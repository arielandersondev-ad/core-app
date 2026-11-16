# Plan: Paciente, Historial clínico y Procedimiento (plan Starter)

> Responsable: nuestro equipo. Agenda, Citas e Inventario los llevan otros desarrolladores (ver [README](./README.md)).
> Última actualización: 2026-11-16

## Contexto

**Ya funciona:**
- alta, edición y búsqueda de pacientes
- perfil de salud
- atenciones con procedimientos

**Falta para el Starter:**
1. Aplicar el **tope de 300 pacientes activos** y avisarlo en la UI.
2. Cerrar el historial clínico y protegerlo según el módulo del plan.
3. Poder registrar un **procedimiento suelto** desde el paciente ("atención rápida") y dejar lista la entrada desde una cita.

**Requisito previo:** commitear F1 (módulos y límites por plan) en 4 commits.

## Ticket A — Tope de pacientes (backend)

**Objetivo:** con 300 pacientes activos en la organización, no se puede crear el siguiente. La respuesta es un 403 con el código `PLAN_LIMIT_REACHED`.

**Cambios:**
- **Lectura del límite.** Reutilizar `PlanEntitlementsReader`, que ya exporta `DentistryAuthModule`, para leer `limits.patients`. Si el valor es `null`, no hay límite.
- **Nueva excepción** `PlanLimitReachedException`, con el mismo cuerpo que la de Core:
  - `{ statusCode: 403, code: 'PLAN_LIMIT_REACHED', resource: 'patients', limit, message }`
  - va en `dentistry/backend/src/modules/auth/application/contracts/`
- **`create-patient.use-case.ts`.** Contar pacientes con `deletedAt = null` y crear dentro de la misma transacción, para que dos altas simultáneas no pasen el tope. Se agrega el método `PatientRepository.createWithinLimit(data, limit)` en `prisma-patient.repository.ts`, con el conteo `.aggregate((a) => ({ totalItems: a.count() }))`.
- **`convert-person-to-patient.use-case.ts`.** Hacer la misma cuenta dentro de la transacción que ya existe, antes de `Patient.create`.
- **Restauración.** Revisar en `update-patient.use-case.ts` si se puede restaurar un paciente eliminado; si se puede, también cuenta contra el tope.
- **Nuevo endpoint** `GET /patients/quota`, que responde `{ used, limit }` y requiere el permiso `dentistry:patients:read`.
- **Guard.** `@RequireModule('patients')` en los controladores de pacientes y de personas.

**Tests** en `dentistry/backend/tests/`:
- crea por debajo del tope
- rechaza al llegar al tope
- los pacientes eliminados no cuentan
- la conversión respeta el tope
- sin límite, no hay restricción
- la respuesta de `quota`

## Ticket B — Tope de pacientes (UI)

**Objetivo:** el usuario ve cuántos pacientes lleva y no puede iniciar un alta cuando llegó al tope.

**Cambios en `dentistry/frontend/src/features/patient/`:**
- **Datos:**
  - `api/endpoints.ts` agrega el endpoint del cupo.
  - `api/query-options.ts` agrega `patientQuotaOptions`.
  - La ruta se suma al allowlist de `infrastructure/http/dentistry-proxy.ts`.
- **`views/patients-page.tsx`.** Contador "N / 300" en la cabecera. No se muestra si el plan no tiene límite.
- **`components/create-patient-button.tsx`.** Al llegar al tope, el botón queda deshabilitado y aparece el aviso: "Llegaste al máximo de pacientes de tu plan. Mejora tu plan para agregar más."
- **`components/create-patient-dialog.tsx`.** Traduce el 403 `PLAN_LIMIT_REACHED` al mismo aviso. Cubre el caso de dos usuarios que crean pacientes a la vez.
- **Caché.** Al crear o eliminar un paciente se invalida la consulta del cupo.

**Tests** con `node --test`:
- la utilidad pura que decide el aviso
- la ruta en el allowlist
- el mapeo del error

## Ticket C — Historial clínico: cierre

**Objetivo:** el historial queda protegido por el plan y sin defectos conocidos. No se agregan features.

**Cambios:**
- `@RequireModule('patients')` en `clinical-encounter.controller.ts` y en `patient-health-profile.controller.ts`. El historial es parte del módulo Paciente.
- Recorrido manual de punta a punta:
  1. perfil de salud
  2. nueva atención
  3. procedimiento
  4. completar
  5. anular

  Los defectos que aparezcan se corrigen dentro del ticket o se registran aparte.

**Fuera de alcance:**
- odontograma
- configuración para ocultar campos opcionales (desactivada en este plan)
- archivos adjuntos

## Ticket D — Procedimiento rápido ("atención rápida")

**Objetivo:** registrar un procedimiento suelto desde el paciente en un solo paso. Por detrás se crea una atención sin cita, ya completada, con sus procedimientos. También queda lista la entrada desde una cita.

### Backend

- **Endpoint** `POST /patients/:patientId/clinical-encounters/quick`, con el body:

  ```json
  {
    "branchId": "uuid",
    "performedAt": "ISO opcional, por defecto ahora",
    "appointmentId": "uuid opcional",
    "procedureSummary": "observaciones opcionales",
    "procedures": [{ "targetType": "TOOTH", "toothNumber": "16", "description": "Restauración" }]
  }
  ```

- **Caso de uso** `RegisterQuickProcedureUseCase`, que reutiliza:
  - `ClinicalEncounterAccess.assertPatient`
  - la validación de sucursal autorizada y de elegibilidad de la cita de `create-clinical-encounter.use-case.ts`
  - `toCreateData` de `add-clinical-encounter-procedures.use-case.ts`, que hay que exportar
- **Repositorio.** El método nuevo `ClinicalEncounterRepository.createCompletedWithProcedures(...)` crea la atención en estado `COMPLETED` junto con sus procedimientos en **una sola transacción**. Sigue el patrón de `prisma-clinical-encounter.repository.ts`.
- **Responsable.** La atención queda a nombre de la membresía de la sesión.
- **Acceso.** Permiso `dentistry:encounters:create` y `@RequireModule('procedures')`.
- **Tests:**
  - caso exitoso
  - sin procedimientos
  - pieza FDI inválida
  - cita no elegible
  - sucursal no autorizada
  - plan sin el módulo `procedures`

### Frontend

- **Servicio y mutación** en `features/clinical-encounter/services/clinical-encounter.service.ts` y `api/query-options.ts`. Al guardar se invalida la lista de atenciones y el detalle del paciente.
- **Botón** "Registrar procedimiento" en `features/patient/components/patient-detail-page.tsx`. Aparece solo con el permiso y si el plan incluye `procedures`.
- **Modal.** Reutiliza los campos de `components/modals/procedure-modal.tsx` (objetivo, pieza y descripción) y agrega observaciones y fecha y hora.
- **Entrada desde una cita.** `clinical-encounter-create-page.tsx` lee `?appointmentId=` y deja la cita preseleccionada. Es el contrato que usará Agenda para "Iniciar atención".
- **Tests:**
  - la validación del formulario rápido
  - la lectura del query param
  - la ruta en el allowlist

## Orden y commits

| Orden | Ticket | Commit sugerido |
|---|---|---|
| 0 | F1 (hecho) | 4 commits: core backend, core frontend, dentistry backend y dentistry frontend |
| 1 | A | `feat(dentistry-back): HAG-XX - Tope de pacientes activos por plan` |
| 2 | B | `feat(dentistry-front): HAG-XX - Contador y aviso de tope de pacientes` |
| 3 | C | `chore(dentistry): HAG-XX - Proteger historial clinico por modulo del plan` |
| 4 | D | `feat(dentistry): HAG-XX - Registro rapido de procedimiento` |

Los IDs de ticket están por confirmar.

## Verificación (por ticket)

- `npx tsc --noEmit` sin errores en cada paquete tocado.
- Tests:
  - dentistry backend: `npm run build` y después `npm test`
  - dentistry frontend: `npm test`
- ESLint con `@typescript-eslint/no-unused-vars` sobre los archivos modificados. El plugin `unused-imports` que pide HARNESS-RULE-02 no está instalado; hay que agregarlo o ajustar la regla.
- Prueba manual, en local:
  - Con un plan de prueba con `patients: 3`, el cuarto paciente queda bloqueado con el aviso.
  - Registrar un procedimiento suelto desde el paciente y verlo en sus atenciones como completado.
  - Abrir `/patients/:id/clinical-encounters/new?appointmentId=...` y ver la cita preseleccionada.
  - Con un plan sin `procedures`, el botón no aparece y el endpoint responde `MODULE_NOT_IN_PLAN`.
