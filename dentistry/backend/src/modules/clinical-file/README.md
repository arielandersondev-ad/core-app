# Archivos clínicos

Adjuntos (imágenes y PDF) del historial clínico de un paciente. PostgreSQL guarda
solo los metadatos en `dentistry."ClinicalFile"` (ver
`packages/db/docs/target-schema-dictionary.md` §5.6); el binario vive en un bucket
privado compatible con S3.

## API

Todas las rutas exigen token de `dentistry-api` y el módulo Paciente del plan.
Subir, confirmar y retirar exigen además la función `files`: un plan vencido o
reducido conserva la consulta y descarga de lo existente (§7.4).

| Operación | Permiso | Función del plan |
| --- | --- | --- |
| `GET /clinical-files/quota` | `dentistry:files:read` | — |
| `GET /patients/:patientId/clinical-files` | `dentistry:files:read` | — |
| `POST /patients/:patientId/clinical-files/uploads` | `dentistry:files:create` | `files` |
| `POST /patients/:patientId/clinical-files/:fileId/complete` | `dentistry:files:create` | `files` |
| `GET /patients/:patientId/clinical-files/:fileId/access-url?disposition=inline\|attachment` | `dentistry:files:read` | — |
| `DELETE /patients/:patientId/clinical-files/:fileId` | `dentistry:files:delete` | `files` |

Estos permisos no están en ningún seed: hay que darlos de alta en Core y
asignarlos a los roles, igual que los de atenciones.

- **Tipos:** `image/jpeg`, `image/png`, `application/pdf`; máximo 10 MB por archivo.
  Al confirmar se comprueba la firma de bytes del tipo declarado.
- **Cupos del plan:** `limits.fileStorageBytes` (bytes totales de la organización) y
  `limits.filesPerPatient`. Cuentan los READY y las reservas PENDING vigentes no
  eliminadas, bajo bloqueo por organización. Un cupo ausente no es ilimitado: sin
  ambos, la subida responde 403 `CLINICAL_FILE_QUOTA_UNDEFINED`; al llegar al tope,
  403 `PLAN_LIMIT_REACHED` con `resource`.
- **Atención:** `clinicalEncounterId` es opcional; debe ser del paciente, de una
  sucursal autorizada y no estar anulada.
- **Vigencias:** URL de subida 5 min, reserva 15 min, enlace de lectura 2 min.
- **Respuestas:** nunca incluyen proveedor, bucket ni clave del objeto.
- **Auditoría:** `CLINICAL_FILE_UPLOADED` y `CLINICAL_FILE_DELETED` en `core.AuditLog`.
- **Retirada:** lógica (`deletedAt`, `deletedByMembershipId`). El objeto se conserva
  hasta definir la política de retención; los rechazados al confirmar sí se borran.
- **Sin `STORAGE_*`:** subir, confirmar y pedir enlaces responden 503
  `CLINICAL_FILE_STORAGE_UNAVAILABLE`.

## Flujo

El binario nunca pasa por el BFF ni por NestJS:

1. `POST …/uploads` valida acceso, plan, tipo y tamaño, reserva cupo, crea el
   registro `PENDING` y devuelve `{ file, upload }`, con `upload` como `PUT` firmado
   con `Content-Type` y `Content-Length`. El proveedor rechaza un cuerpo de otro
   tamaño o tipo.
2. El navegador sube directamente al bucket con `upload.url` y `upload.headers`.
3. `POST …/:fileId/complete` consulta el objeto, verifica tamaño, firma de bytes y
   SHA-256, y lo pasa a `READY` (o `FAILED` y elimina el objeto). Si el objeto aún
   no llegó responde 409 `CLINICAL_FILE_UPLOAD_MISSING` y la reserva sigue vigente.
4. `GET …/access-url` firma una lectura corta con `Content-Type` y
   `Content-Disposition` forzados y `Cache-Control: private, no-store`.

## Piezas

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| application | `ports/file-storage.ts` | Contrato abstracto del almacenamiento |
| domain | `value-objects/clinical-file-object-key.ts` | Clave `dentistry/{organizationId}/{patientId}/{objectId}.{ext}`, solo UUID aleatorios |
| domain | `errors/file-storage.errors.ts` | No configurado, no encontrado, demasiado grande, fallo del proveedor |
| infrastructure | `storage/s3-compatible-file-storage.ts` | AWS SDK v3 contra B2, S3, R2 o MinIO |
| infrastructure | `storage/unavailable-file-storage.ts` | Implementación cuando faltan las variables |
| domain | `value-objects/clinical-file-type.ts` | Tipos admitidos, firma de bytes y tamaño máximo |
| domain | `value-objects/filename.ts` | Saneado del nombre aportado |
| infrastructure | `storage/content-disposition.ts` | Cabecera RFC 6266 |
| infrastructure | `prisma-clinical-file.repository.ts` | Reserva con cupos, estados, retirada y auditoría |
| config | `src/config/storage-env.ts` | Validación de `STORAGE_*` |

`FileStorageError` no expone la causa del proveedor en su mensaje (puede incluir
bucket, clave o cuenta); la causa queda en `error.cause` para el registro interno.
No registrar URL firmadas.

## Configuración

Todas las variables son opcionales en conjunto: sin ninguna, el backend arranca y
los adjuntos quedan deshabilitados. Una configuración parcial detiene el arranque.

| Variable | Ejemplo B2 | Nota |
| --- | --- | --- |
| `STORAGE_PROVIDER` | `BACKBLAZE_B2` | `BACKBLAZE_B2`, `AWS_S3`, `CLOUDFLARE_R2`, `MINIO`. Se guarda en `ClinicalFile.storageProvider` |
| `STORAGE_ENDPOINT` | `https://s3.us-west-004.backblazeb2.com` | Origen https; opcional solo en `AWS_S3`; http solo en localhost |
| `STORAGE_REGION` | `us-west-004` | En R2 usar `auto` |
| `STORAGE_BUCKET` | `crowant-dentistry-demo` | Se guarda en `ClinicalFile.bucket` |
| `STORAGE_ACCESS_KEY_ID` | keyID | Application key, no la master key |
| `STORAGE_SECRET_ACCESS_KEY` | applicationKey | Solo en `.env`/secretos del despliegue |
| `STORAGE_FORCE_PATH_STYLE` | `false` | Opcional; `true` por defecto solo en MinIO |

Cambiar de proveedor es cambiar estas variables; los objetos existentes se copian
y se actualizan `storageProvider`/`bucket` de sus registros.

## Preparar el bucket de Backblaze B2 (demos)

1. **Bucket** privado (*Files in Bucket are: Private*), sin enlaces públicos.
2. **Default Encryption**: habilitar SSE-B2.
3. **Lifecycle**: conservar versiones y purgar las ocultas tras 30 días
   (`daysFromHidingToDeleting: 30`). En B2 un `DeleteObject` sin versión oculta el
   archivo; la regla limpia las versiones ocultas.
4. **Application key** restringida a ese bucket, con `readFiles`, `writeFiles`,
   `deleteFiles` y `listFiles`. Sin `listFiles`, consultar un objeto inexistente
   puede devolver 403 en lugar de 404. No usar la master key.
5. **CORS** (*Bucket Settings → CORS Rules → Custom*), solo para los orígenes del
   frontend:

   ```json
   [
     {
       "corsRuleName": "dentistry-frontend",
       "allowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
       "allowedOperations": ["s3_put", "s3_get", "s3_head"],
       "allowedHeaders": ["content-type"],
       "exposeHeaders": ["etag"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

   Con la CLI: `b2 bucket update --cors-rules '<json>' <bucket> allPrivate`.
   Añadir el dominio de demo/producción cuando exista; no usar `*`.

## Prueba de humo

Con las variables en `.env`:

```bash
npm run build
npm run storage:smoke
# Verificar también CORS para un origen del frontend:
STORAGE_SMOKE_ORIGIN=http://localhost:3000 npm run storage:smoke
```

Crea un objeto bajo `dentistry/_smoke/`, comprueba que el proveedor rechaza un
cuerpo con tamaño o tipo distinto al firmado, sube, consulta, lee, descarga con
URL firmada, verifica que el GET sin firma falla y elimina el objeto.
