# API de atenciones clínicas y perfil de salud

Implementa las entregas E1–E4 de
`dentistry/frontend/docs/clinical-encounter-api-requirements.md` con las
decisiones de su §10.1: rutas anidadas bajo el paciente, `PATCH` para el perfil,
listado `{ items, pagination }`, permisos `dentistry:encounters:*`, profesional
= membresía de la sesión y `procedureSummary` opcional al completar.

| Operación | Permiso |
| --- | --- |
| `GET /patients/:patientId/clinical-encounters` | `dentistry:encounters:read` |
| `GET /patients/:patientId/clinical-encounters/reference-data` | `dentistry:encounters:read` |
| `GET /patients/:patientId/clinical-encounters/:encounterId` | `dentistry:encounters:read` |
| `POST /patients/:patientId/clinical-encounters` | `dentistry:encounters:create` |
| `POST /patients/:patientId/clinical-encounters/:encounterId/procedures` | `dentistry:encounters:update` |
| `POST /patients/:patientId/clinical-encounters/:encounterId/complete` | `dentistry:encounters:update` |
| `POST /patients/:patientId/clinical-encounters/:encounterId/void` | `dentistry:encounters:void` |
| `GET /patients/:patientId/health-profile` | `dentistry:encounters:read` |
| `PATCH /patients/:patientId/health-profile` | `dentistry:encounters:update` |

Estos códigos deben existir en el catálogo de Core y estar asignados a roles
para viajar en el token. Este módulo no crea permisos.

## Reglas

- Organización, autoría (`createdBy`, `updatedBy`, `completedBy`, `voidedBy`)
  y profesional salen del token; el body no los sustituye.
- Paciente inexistente, eliminado o de otra organización → 404
  `PATIENT_NOT_FOUND`. Atención de otro paciente → 404; de una sucursal fuera
  de `branchIds` del token → 403 `BRANCH_FORBIDDEN`.
- Transiciones: `IN_PROGRESS → COMPLETED`, `IN_PROGRESS | COMPLETED → VOIDED`.
  Cada cambio exige la `rowVersion` leída y la incrementa; una carrera responde
  409 `ENCOUNTER_CHANGED`.
- Procedimientos solo en `IN_PROGRESS`; el lote es atómico. `toothNumber` FDI es
  obligatorio para `TOOTH` y prohibido para el resto.
- `appointmentId` es único en BD incluso para atenciones anuladas: una cita
  admite una sola atención (409 `ENCOUNTER_APPOINTMENT_TAKEN`).
- Perfil inexistente → 200 con campos `null`, `rowVersion: 0`. `PATCH` conserva
  los campos omitidos, `""`/`null` los vacía y `rowVersion` opcional activa la
  concurrencia optimista (409 `HEALTH_PROFILE_STALE`).
- Los errores conservan el cuerpo de Nest y añaden `code`
  (`application/clinical-encounter.errors.ts`).
- `branchName`, `practitionerName` y `completedByName` se leen de Core por id;
  si no se resuelven quedan en `null`.

Pendiente: archivos y radiografías (E6), anular/corregir procedimientos (P8) y
búsqueda por nombre de profesional o sucursal en el listado.
