# Plan: Paciente, Historial clínico y Procedimiento (plan Starter)

> Responsable: nuestro equipo. Agenda, Citas e Inventario los llevan otros desarrolladores (ver [README](./README.md)).
> Última actualización: 2026-11-16

## Estado

Los tickets están **implementados, verificados con tests y commiteados** (ver [Commits](#commits)). Falta la prueba manual en local contra una base real.

| Ticket | Qué entrega | Estado |
|---|---|---|
| 0 | F1 al formato `features` / `limits.members` del diccionario | Implementado |
| A | Tope de pacientes (backend) | Implementado |
| B | Tope de pacientes (UI) | Implementado |
| C | Historial clínico protegido por el plan | Implementado; falta el recorrido manual |
| D | Atención rápida y entrada desde una cita | Implementado |

## Decisiones tomadas

- **Formato del plan:** el de `packages/db/docs/target-schema-dictionary.md` §7.1 (`features` y `limits.members`). Las funciones `inventory`, `dashboard` y `services` se agregan al plan cuando correspondan.
- **Límite ausente:** crear o editar un plan sin alguno de los tres límites es un error. Los planes ya guardados sin la clave se leen sin aplicar ese cupo.
- **Dónde se valida el cupo:** en el caso de uso, dentro de la transacción y bajo un bloqueo por organización. Un guard no cubre la conversión de persona a paciente ni evita que dos altas simultáneas pasen el tope.
- **Qué cuenta contra el cupo:** todo paciente no eliminado. Inactivarlo no libera cupo.
- **Atención rápida desde una cita:** la cita solo queda vinculada; su estado lo maneja Agenda.

## Ticket 0 — F1 al formato del diccionario

- **Core backend** (`modules/plan/domain/entitlements.ts`):
  - valida `features` (objeto de booleanos) y `limits` (`patients`, `members`, `branches`)
  - `normalizeCatalogEntitlements` exige `features` y los tres límites al crear o editar un plan
  - la asignación a una organización sigue aceptando planes antiguos
  - el cupo de usuarios se lee de `limits.members`
- **Core frontend** (`features/plan`): el formulario marca funciones (`data/plan-features.ts`) y pide los tres límites como obligatorios. Conserva las claves del plan que no edita.
- **Dentistry backend** (`auth/application/contracts/plan-entitlements.ts`): `MODULE_FEATURES` traduce cada módulo a su función. La tabla está en el [README](./README.md#5-contratos-compartidos-que-deben-usar-todos).
- **Dentistry frontend** (`shared/plan/plan-access.ts`): `limits.members` en lugar de `limits.users`.

## Ticket A — Tope de pacientes (backend)

Con el cupo lleno no se puede crear el siguiente paciente: 403 `{ code: 'PLAN_LIMIT_REACHED', resource: 'patients', limit, message }`.

- **`patient/infrastructure/patient-quota.ts`:**
  - `countPatientSeats` cuenta los pacientes con `deletedAt = null`
  - `assertPatientSeatAvailable(tx, organizationId, limit)` toma `pg_advisory_xact_lock` por organización, cuenta y lanza `PlanLimitReachedException`; con `limit = null` no hace nada
- **Alta:** `PatientRepository.create(patient, patientLimit)` comprueba el cupo y crea en la misma transacción. `CreatePatientUseCase` lee el límite con `PlanEntitlementsReader`.
- **Conversión:** `ConvertPersonToPatientUseCase` llama a `assertPatientSeatAvailable` dentro de su transacción, antes de `Patient.create`.
- **`GET /patients/quota`:** responde `{ used, limit }` con el permiso `dentistry:patients:read`. Está declarado antes de `/:id`.
- **Guard:** `@RequireModule('patients')` en `PatientController`.
- **No aplica:** no existe la restauración de pacientes eliminados, así que no hay un tercer camino de alta.

## Ticket B — Tope de pacientes (UI)

- **Datos** (`features/patient`):
  - `utils/patient-quota.ts` decide el aviso, la etiqueta del contador y reconoce el error
  - `patientQuotaOptions` usa la clave `["patients", "quota"]`, que se invalida al crear o eliminar
  - `ApiError.code` trae el código del backend
  - `GET patients/quota` está en el allowlist del BFF
- **Listado:** contador "Pacientes del plan: N / 300" y aviso cuando el cupo está lleno (`components/patient-quota.tsx`). No se muestran si el plan no define cupo.
- **Botón "Nuevo paciente":** deshabilitado con el cupo lleno. El menú móvil y `?create=true` abren un aviso en lugar del formulario.
- **Formulario:** un 403 `PLAN_LIMIT_REACHED` muestra "Llegaste al máximo de pacientes de tu plan. Mejora tu plan para agregar más." en vez de "No tienes permiso".

## Ticket C — Historial clínico: cierre

- `@RequireModule('patients')` en `ClinicalEncounterController` y `PatientHealthProfileController`.
- **Pendiente:** recorrido manual de punta a punta (perfil de salud → nueva atención → procedimiento → completar → anular).

Fuera de alcance: odontograma, configuración de campos visibles y archivos adjuntos.

## Ticket D — Procedimiento rápido ("atención rápida")

### Backend

- **Endpoint** `POST /patients/:patientId/clinical-encounters/quick`, con el permiso `dentistry:encounters:create` y `@RequireModule('procedures')`:

  ```json
  {
    "branchId": "uuid",
    "performedAt": "ISO opcional, por defecto ahora",
    "appointmentId": "uuid opcional",
    "procedureSummary": "observaciones opcionales",
    "procedures": [{ "targetType": "TOOTH", "toothNumber": "16", "description": "Restauración" }]
  }
  ```

- **`RegisterQuickProcedureUseCase`** reutiliza `ClinicalEncounterAccess.assertPatient`, `assertEligibleAppointment` (extraído del alta de atención) y `toCreateData` (regla de pieza FDI).
- **`createCompletedWithProcedures`** crea la atención `COMPLETED` (inicio = fin = `performedAt`) y sus procedimientos en una transacción. Queda a nombre de la membresía de la sesión.
- **Cita:** si ya tiene una atención, aunque esté anulada, responde 409 `ENCOUNTER_APPOINTMENT_TAKEN`.
- **Sin vínculo a plan de tratamiento:** tratamientos no está en el Starter.

### Frontend

- **Botón "Registrar procedimiento"** en el detalle del paciente, visible con el permiso y si el plan incluye `procedures`.
- **`QuickProcedureModal`:** objetivo, pieza, procedimiento, observaciones, fecha y hora. Pide sucursal solo si el usuario tiene más de una. Rechaza fechas futuras.
- **Al guardar:** mensaje con enlace a la atención; se invalidan la lista de atenciones, los datos de referencia y el detalle del paciente.
- **Entrada desde una cita:** `/patients/:id/clinical-encounters/new?appointmentId=` preselecciona la cita si sigue disponible y sugiere su tratamiento. Si no lo está, lo avisa. Con una sola sucursal, queda elegida.

## Commits

Commiteados sin ID de ticket (no estaban asignados).

| Ticket | Commit |
|---|---|
| 0 | `ed1baaf` refactor(plan): alinear entitlements al formato features y limits.members |
| A | `794c200` feat(dentistry-back): aplicar el tope de pacientes del plan |
| B | `28c0c19` feat(dentistry-front): mostrar el cupo de pacientes y avisar al llegar al tope |
| C y D (backend) | `56ac9ed` feat(dentistry-back): proteger el historial por plan y registrar atenciones rápidas |
| D (frontend) | `7fb2591` feat(dentistry-front): registrar procedimientos rápidos y preseleccionar la cita |

## Verificación

**Automática (hecha):**

- `npx tsc --noEmit` sin errores en core backend, core frontend, dentistry backend y dentistry frontend.
- Tests: core backend 38/38, dentistry backend 83/83, dentistry frontend 131/131. `npm run build` del frontend de Dentistry correcto.
- ESLint con `@typescript-eslint/no-unused-vars` limpio en los archivos tocados. Quedan dos errores `set-state-in-effect` anteriores en `patients-page.tsx`. El plugin `unused-imports` de HARNESS-RULE-02 no está instalado.

**Manual en local (pendiente):**

1. Editar el plan en Core con `patients: 3` y **reasignarlo** a la organización; volver a iniciar sesión en Dentistry.
2. Crear pacientes hasta el tope: el contador avanza y el cuarto queda bloqueado con el aviso.
3. Eliminar un paciente: el contador baja y se puede crear otro.
4. Convertir una persona en paciente con el cupo lleno: responde `PLAN_LIMIT_REACHED`.
5. Registrar un procedimiento desde el paciente y verlo en sus atenciones como completado.
6. Abrir `/patients/:id/clinical-encounters/new?appointmentId=...` y ver la cita preseleccionada.
7. Quitar `procedureNotes` del plan y reasignar: el botón no aparece y el endpoint responde `MODULE_NOT_IN_PLAN`.

El bloqueo `pg_advisory_xact_lock` solo se ejercita contra PostgreSQL real: el paso 2 es su primera prueba.
