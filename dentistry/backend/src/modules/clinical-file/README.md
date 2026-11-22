# Archivos clínicos

Adjuntos (imágenes y PDF) del historial clínico de un paciente. PostgreSQL guarda
solo los metadatos en `dentistry."ClinicalFile"` (ver
`packages/db/docs/target-schema-dictionary.md` §5.6); el binario vive en un bucket
privado compatible con S3.

## Estado

Fase 1 (infraestructura): puerto `FileStorage`, adaptador S3 compatible,
configuración y prueba de humo. Todavía no hay endpoints ni pantallas.

## Flujo previsto

El binario nunca pasa por el BFF ni por NestJS:

1. El backend valida acceso, plan, tipo y tamaño, reserva cupo, crea el registro
   `PENDING` y emite una subida firmada (`PUT`, minutos) con `Content-Type` y
   `Content-Length` firmados. El proveedor rechaza un cuerpo de otro tamaño o tipo.
2. El navegador sube directamente al bucket.
3. El backend confirma: consulta el objeto, verifica tamaño, firma de bytes y
   SHA-256, y lo pasa a `READY` (o `FAILED` y elimina el objeto).
4. Las lecturas usan descargas firmadas de corta duración con `Content-Type` y
   `Content-Disposition` forzados y `Cache-Control: private, no-store`.

## Piezas

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| application | `ports/file-storage.ts` | Contrato abstracto del almacenamiento |
| domain | `value-objects/clinical-file-object-key.ts` | Clave `dentistry/{organizationId}/{patientId}/{clinicalFileId}.{ext}`, solo UUID |
| domain | `errors/file-storage.errors.ts` | No configurado, no encontrado, demasiado grande, fallo del proveedor |
| infrastructure | `storage/s3-compatible-file-storage.ts` | AWS SDK v3 contra B2, S3, R2 o MinIO |
| infrastructure | `storage/unavailable-file-storage.ts` | Implementación cuando faltan las variables |
| infrastructure | `storage/content-disposition.ts` | Saneado del nombre aportado y cabecera RFC 6266 |
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
