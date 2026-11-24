# API de atenciones clínicas y perfil de salud

Implementa las entregas E1–E4 de
`dentistry/frontend/docs/clinical-encounter-api-requirements.md` con las
decisiones de su §10.1: rutas anidadas bajo el paciente, `PATCH` para el perfil,
listado `{ items, pagination }`, permisos `dentistry:encounters:*`, profesional
= membresía de la sesión y `procedureSummary` opcional al completar.

| Operación | Permiso |
| --- | --- |
| `GET /patients/:patientId/clinical-encounters` (filtros `status`, `practitionerMembershipId`, `appointmentId`, `search`) | `dentistry:encounters:read` |
| `GET /patients/:patientId/clinical-encounters/reference-data` | `dentistry:encounters:read` |
| `GET /patients/:patientId/clinical-encounters/:encounterId` | `dentistry:encounters:read` |
| `POST /patients/:patientId/clinical-encounters` | `dentistry:encounters:create` |
| `POST /patients/:patientId/clinical-encounters/quick` | `dentistry:encounters:create` |
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
- Cada procedimiento puede llevar un precio nominal (`priceMinor`, entero ≥ 0 en
  unidades menores, con `currency` de tres letras; ambos o ninguno →
  400 `INVALID_PROCEDURE_PRICE`). Los precios de una atención se suman, así que
  comparten moneda (422 `PROCEDURE_CURRENCY_MISMATCH`). La respuesta incluye
  `proceduresTotal` (`{ amountMinor, currency }`, o `null` sin precios) con lo
  realizado; **no es lo cobrado**: el cobro es un pago aparte (ver
  [pagos](../payment/README.md)).
- Una atención con pago vigente no se anula (409 `ENCOUNTER_HAS_PAYMENT`):
  primero se anula el pago, que libera la atención. La anulación toma el mismo
  bloqueo que el cobro, así que ambas operaciones no se cruzan.
- `appointmentId` es único en BD incluso para atenciones anuladas: una cita
  admite una sola atención (409 `ENCOUNTER_APPOINTMENT_TAKEN`).
- Perfil inexistente → 200 con campos `null`, `rowVersion: 0`. `PATCH` conserva
  los campos omitidos, `""`/`null` los vacía y `rowVersion` opcional activa la
  concurrencia optimista (409 `HEALTH_PROFILE_STALE`).
- Los errores conservan el cuerpo de Nest y añaden `code`
  (`application/clinical-encounter.errors.ts`).
- `branchName`, `practitionerName` y `completedByName` se leen de Core por id;
  si no se resuelven quedan en `null`.
- `startedAt`, `endedAt` y `performedAt` aceptan un instante con zona (`Z` o
  `±hh:mm`) o una hora de pared sin zona (`2026-11-22T09:00`), que se interpreta
  en la zona de la sucursal (o de la organización si la sucursal no tiene una).

Pendiente: archivos y radiografías (E6), anular/corregir procedimientos (P8) y
búsqueda por nombre de profesional o sucursal en el listado.

## Plan de la organización y atención rápida

- Ambos controladores exigen la función `clinicalHistory` del plan (`@RequireModule('patients')`).
- `POST .../quick` exige además `procedureNotes` (`@RequireModule('procedures')`). Body: `{ branchId, performedAt?, appointmentId?, procedureSummary?, procedures: [{ targetType, toothNumber?, targetDescription?, description, priceMinor?, currency? }] }` (1–50 procedimientos).
- Crea en una transacción una atención ya `COMPLETED` (inicio = fin = `performedAt`, por defecto ahora) a nombre de la membresía de la sesión, con sus procedimientos. Responde 201 con la atención.
- La cita, si se envía, queda vinculada y pasa a `COMPLETED` (ver abajo). Aplican las mismas reglas que en el alta (404, 422 `APPOINTMENT_NOT_ELIGIBLE`, 409 `ENCOUNTER_APPOINTMENT_TAKEN`).

## Sincronización con la cita

La regla vive en `domain/appointment-sync.ts` y el repositorio la aplica en la
misma transacción que la atención (concurrencia optimista con la `rowVersion`
de la cita; si cambió entretanto, 409 `APPOINTMENT_CHANGED` y no se guarda nada).

| Acción | Cita |
| --- | --- |
| Crear la atención con `appointmentId` | `SCHEDULED`/`CONFIRMED`/`WAITING_ROOM` → `IN_PROGRESS` |
| Completar la atención | `SCHEDULED`/`CONFIRMED`/`WAITING_ROOM`/`IN_PROGRESS` → `COMPLETED` |
| Atención rápida con `appointmentId` | igual que completar |
| Anular la atención | no cambia |

Nunca se retrocede: una cita ya `COMPLETED` admite una atención (para registrar
después lo hecho) pero conserva su estado. `GET ...?appointmentId=` devuelve la
atención de una cita (a lo sumo una, incluida la anulada); la agenda la usa para
decidir entre "Atender"/"Registrar procedimiento" y "Ver atención".
