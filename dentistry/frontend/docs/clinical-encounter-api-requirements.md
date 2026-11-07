# Solicitud de contrato HTTP: atenciones clínicas de Dentistry

**Dirigido a:** Dentistry Backend y responsable del BFF.  
**Estado:** pendiente de acuerdo e implementación. No es especificación implementada ni autorización para cambiar `@app/db`.

## Motivo

El contrato Prisma ya contiene `PatientHealthProfile`, `ClinicalEncounter`, `ClinicalEncounterProcedure`, `Treatment`, `TreatmentProcedure`, `ClinicalFile` y `Radiograph`, pero el sondeo de controladores de `dentistry/backend` no halló rutas para esos recursos. El BFF de Dentistry solo permite pacientes, citas, personas y servicios.

El frontend no puede persistir atención clínica usando el prototipo `ClinicalHistory` ni mapearlo a `notes`; tampoco puede inventar rutas. Se solicita acordar los siguientes recursos, payloads y permisos antes de iniciar su interfaz persistente.

## Reglas transversales solicitadas

- Autenticar y autorizar todas las rutas en NestJS. Derivar `organizationId`, actor, `createdByMembershipId`, `updatedByMembershipId` y `completedByMembershipId` del principal; no aceptarlos como autoridad del body.
- Limitar todos los recursos a la organización, paciente, sucursal y asignaciones autorizadas. Un id existente en otra organización debe responder como no accesible, no filtrar datos.
- Validar el mismo paciente/organización entre atención, cita, tratamiento, procedimiento planificado y archivo. Respetar los constraints vigentes en `@app/db`.
- Definir permisos nominales antes de implementar el frontend (por ejemplo `dentistry:clinical-encounters:read/create/update/complete`, `dentistry:patient-health-profile:read/update`, `dentistry:clinical-files:read/upload`). Son nombres candidatos, no nombres ya aprobados.
- Devolver fechas civiles como `YYYY-MM-DD` y los instantes como ISO 8601. Publicar respuestas JSON tipadas y errores de validación consistentes con los recursos existentes.
- Una vez aprobada una ruta, añadirla explícitamente a `dentistry/frontend/src/infrastructure/http/dentistry-proxy.ts`, con método, patrón y query permitidos. No abrir un proxy genérico.

## 1. Paciente y perfil de salud

### Extensión de paciente existente

Se requiere que `GET /patients/:id`, `POST /patients` y `PATCH /patients/:id` representen, cuando aplique:

```json
{
  "maritalStatus": "string | null",
  "occupation": "string | null",
  "origin": "string | null",
  "address": "string | null"
}
```

`birthDate` y `sex` permanecen opcionales. La edad no se recibe ni persiste. Confirmar si estos campos pueden añadirse al CRUD existente y con qué permiso, manteniendo las validaciones de fecha civil actuales.

### Perfil de salud

Se solicita un recurso único por paciente, por ejemplo:

| Operación candidata | Necesidad |
| --- | --- |
| `GET /patients/:patientId/health-profile` | Obtener el perfil, o una respuesta explícita de perfil aún no creado. |
| `PUT /patients/:patientId/health-profile` | Crear/actualizar idempotentemente los seis textos opcionales. |

Payload candidato:

```json
{
  "medicalHistory": "string | null",
  "allergies": "string | null",
  "currentMedications": "string | null",
  "dentalHistory": "string | null",
  "relevantConditions": "string | null",
  "observations": "string | null"
}
```

Confirmar si se requiere versionado/concurrencia por `rowVersion` y el código que diferencia ausencia de perfil de perfil vacío. El cliente mostrará valores vacíos como “Sin registrar”, no como una negación clínica.

## 2. Atenciones clínicas

Se solicita un recurso separado de `Appointment`; una atención puede no tener cita y puede completarse sin procedimientos.

| Operación candidata | Necesidad |
| --- | --- |
| `POST /clinical-encounters` | Abrir atención en `IN_PROGRESS`. |
| `GET /patients/:patientId/clinical-encounters` | Listar historial paginado/filtrable del paciente. |
| `GET /clinical-encounters/:id` | Recuperar el detalle, incluidas filas de procedimientos y referencias de archivos aprobadas. |
| `PATCH /clinical-encounters/:id` | Corregir campos permitidos mientras esté en curso. |
| `POST /clinical-encounters/:id/complete` | Registrar cierre y transición a `COMPLETED`. |

Payload de apertura/edición a validar por Backend:

```json
{
  "patientId": "uuid",
  "branchId": "uuid",
  "appointmentId": "uuid | omitted",
  "treatmentId": "uuid | omitted",
  "startedAt": "ISO-8601",
  "chiefComplaint": "string | null",
  "examinationSummary": "string | null",
  "diagnosisSummary": "string | null",
  "procedureSummary": "string | null",
  "progressNotes": "string | null",
  "patientInstructions": "string | null",
  "notes": "string | null"
}
```

El profesional debe provenir de la política de sesión/autoridad que Backend confirme. Si se permite registrar en nombre de otro profesional, se necesita un directorio autorizado y una validación de asignación; el cliente no debe enviar una membresía arbitraria. La operación de completar debe recibir `endedAt` y los campos clínicos que Backend permita modificar, y el servidor debe derivar `completedAt` y `completedByMembershipId`. No debe exigir `procedureSummary` ni al menos una fila de `ClinicalEncounterProcedure`.

Solicitamos además la decisión explícita sobre anulación (`VOIDED`): ruta, permiso, motivo obligatorio e inmutabilidad de atenciones completadas. Si no está en alcance, Backend debe documentar que no se expone en esta fase.

## 3. Procedimientos realizados

Se necesita agregar y consultar filas de `ClinicalEncounterProcedure` dentro de una atención. Para el lote de piezas, el cliente expandirá la selección y enviará una fila por pieza; no se espera una lista en `toothNumber`.

Operaciones candidatas:

| Operación | Necesidad |
| --- | --- |
| `POST /clinical-encounters/:id/procedures` | Registrar una o varias filas atómicamente. |
| `PATCH /clinical-encounters/:id/procedures/:procedureId` | Solo si el negocio permite corregir campos antes del cierre. |
| `POST /clinical-encounters/:id/procedures/:procedureId/void` | Anular sin borrar, con motivo obligatorio. |

Entrada por fila propuesta:

```json
{
  "treatmentProcedureId": "uuid | omitted",
  "targetType": "TOOTH | REGION | WHOLE_MOUTH | OTHER",
  "toothNumber": "FDI string; required only for TOOTH",
  "targetDescription": "string | null",
  "description": "string"
}
```

Backend debe rechazar `toothNumber` fuera de `TOOTH`, descripciones vacías y un `treatmentProcedureId` que no pertenezca al mismo paciente, organización y tratamiento. Confirmar si una atención completada prohíbe altas/correcciones y si el listado de detalle incluye filas anuladas con sus razones.

## 4. Tratamientos y procedimientos planificados

Aunque `DentalService` tiene CRUD, no reemplaza a `Treatment` ni expone `TreatmentProcedure`. Para mostrar el plan y permitir el vínculo opcional se requiere, como mínimo, lectura autorizada del paciente:

| Operación candidata | Resultado necesario |
| --- | --- |
| `GET /patients/:patientId/treatments` | Tratamientos del paciente, con `serviceId?`, estado, profesional y resumen. |
| `GET /treatments/:id` o inclusión en la anterior | `TreatmentProcedure[]` con `id`, objetivo, pieza/región, descripción, `position` y estado. |

Confirmar filtros/paginación y si los procedimientos cancelados/completados se pueden vincular a una atención. El frontend no creará ni editará planes en esta fase salvo autorización posterior.

## 5. Sucursal y profesional

- La atención requiere `branchId`, pero `GET /auth/me` actual no ofrece nombres de sucursal y no se observó un directorio de sucursales de Dentistry. Solicitar una fuente segura de sucursales autorizadas, por ejemplo ampliar `/auth/me` o publicar `GET /clinic/branches` derivado del principal.
- Hay `GET /clinic/professionals?organizationId=...`, pero no aplica guardas de Dentistry y el BFF lo rechaza. Debe reemplazarse o endurecerse antes de uso: sin `organizationId` controlado por cliente, con JWT/permisos, solo membresías elegibles y reglas de sucursal/asignación documentadas. Si la política dicta que el profesional es siempre quien inició sesión, basta publicar su presentación en `/auth/me` y no exponer un selector.

## 6. Archivos y radiografías

No hay flujo de subida disponible. Se solicita definir uno compatible con el BFF de JSON (64 KiB) y con almacenamiento privado; el binario no debe atravesar el proxy ni ir codificado en base64.

Flujo candidato a acordar:

1. `POST /clinical-files/upload-intents`: recibe metadatos mínimos y devuelve identificador + URL/headers de subida temporal autorizada.
2. Navegador sube el binario directamente al proveedor autorizado.
3. `POST /clinical-files/:id/complete`: Backend verifica y confirma `ClinicalFile` como cargado.
4. `GET /patients/:patientId/clinical-files` y/o inclusión en detalle de atención; descarga mediante URL temporal emitida por Backend.
5. Operación de eliminación/anulación trazable, si está autorizada.

El cliente nunca elige `storageProvider`, `bucket`, `objectKey`, checksum, `uploadedByMembershipId` ni estado interno. Para radiografías, confirmar si sus metadatos se incluyen al crear la intención o en una operación separada y admitir solo `ClinicalFile.category = "RADIOGRAPH"`:

```json
{
  "radiographType": "PANORAMIC | PERIAPICAL | BITEWING | OCCLUSAL | CEPHALOMETRIC | CBCT | OTHER",
  "toothNumber": "string | null",
  "region": "string | null",
  "laterality": "LEFT | RIGHT | BILATERAL | null",
  "notes": "string | null"
}
```

## Aceptación requerida

Antes de implementar pantallas persistentes, Backend y Frontend deben acordar para cada operación: ruta, método, permiso, request/response exacto, errores, reglas de estado, paginación, autorización y prueba de integración. Backend implementa y prueba primero; luego Frontend agrega la allow-list BFF y los tipos/hook que correspondan. Cualquier necesidad de cambio en `@app/db` se tramita como una tarea separada siguiendo el procedimiento canónico de `packages/db`.
