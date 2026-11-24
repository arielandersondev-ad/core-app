# Plan Starter de Dentistry — estado general

> Última actualización: 2026-11-16

## 1. Alcance del plan

Es el primer plan comercial, de muy bajo costo.

| Límite | Valor |
|---|---|
| Sucursales | 1 |
| Usuarios | 2, contando al propietario. El segundo es otro dentista. |
| Pacientes | 300 **activos**, sin contar los eliminados |

| Módulo | Qué incluye |
|---|---|
| Paciente | Filiación con campos fijos, no configurables, y la clínica no puede agregar campos propios. Más adelante se podrán ocultar los campos opcionales desde una pestaña de configuración general, que en este plan está desactivada. |
| Historial clínico | Perfil de salud y atenciones con sus procedimientos. El odontograma y lo demás queda para planes superiores. |
| Agenda | Grilla por franjas horarias. Cada dentista ve solo sus citas; el propietario ve las de toda la organización y puede filtrar por profesional. |
| Citas | Crear una cita y verla en la agenda, más un historial de citas con filtros y paginado. |
| Procedimiento | Texto libre con observaciones. El precio nominal y los cobros solo existen si el plan incluye `payments` (ver sección 8). Se registra desde una cita, desde una atención o suelto desde el paciente, como "atención rápida". |
| Inventario (opcional) | Herramientas (cantidad y estado) y materiales (stock, unidad, mínimo y movimientos manuales). No se relaciona con otros módulos. |

Las pantallas de módulos que el plan no incluye se **ocultan según el plan de la organización**; no se borran.

## 2. Lo que ya estaba implementado

- **Core:**
  - login con JWT RS256 por audiencia
  - usuarios, roles y permisos
  - organizaciones, sucursales y planes con asignación por organización
- **Pacientes:**
  - alta, edición y baja lógica
  - búsqueda paginada con la filiación completa
  - personas (contactos de la agenda) que se pueden convertir en paciente
- **Historial clínico:**
  - perfil de salud
  - atenciones (crear, registrar procedimientos, completar y anular), todo con datos reales
- **Citas:** el backend crea, lista y cambia de estado las citas.

## 3. Lo implementado en este ciclo

### F1 — Funciones y límites por plan (`e34848e`, ajustado en `ed1baaf`)

> El ajuste al formato del diccionario está commiteado en `ed1baaf`.

- **Formato del plan.** Es el de `packages/db/docs/target-schema-dictionary.md` §7.1, que la base ya tiene cargado: `features` (booleanos) y `limits` (`patients`, `members`, `branches`). Ya no se usan `modules` ni `limits.users`.
- **Core:**
  - `entitlements` valida `features` y `limits`.
  - Crear o editar un plan exige `features` y los tres límites; un límite vacío es un error, no "ilimitado".
  - Los planes ya guardados sin alguna clave se siguen leyendo: ese cupo no se aplica hasta que se complete el plan.
  - La creación de usuarios (`members`) y sucursales (`branches`) respeta el cupo con el error `PLAN_LIMIT_REACHED`.
  - El formulario de planes edita las funciones y los límites.
- **Dentistry backend:** `PlanEntitlementsReader`, `DentistryModuleGuard` con `@RequireModule('<modulo>')` (error `MODULE_NOT_IN_PLAN`) y `plan` en `/auth/me`.
- **Dentistry frontend:** el menú se filtra con `navItemsForPlan` y `ModuleGate` muestra "No incluido en tu plan".

### F4 y F5 — Tope de pacientes, cierre del historial y atención rápida

> Estado: commiteado (`794c200`, `28c0c19`, `56ac9ed`, `7fb2591`) y verificado con tests; sin probar todavía contra una base real.

- Tope de pacientes en el alta y en la conversión de persona, con `GET /patients/quota`, contador "N / 300" y aviso "Mejora tu plan".
- Pacientes, historial clínico y perfil de salud protegidos por la función del plan.
- "Registrar procedimiento" desde el paciente (`POST .../clinical-encounters/quick`).
- `/patients/:id/clinical-encounters/new?appointmentId=` deja la cita preseleccionada.
- **Verificación:** `tsc` sin errores; tests de core 38/38, de dentistry backend 83/83 y de dentistry frontend 131/131.

El detalle está en [plan-paciente-historial-procedimiento.md](./plan-paciente-historial-procedimiento.md).

## 4. Fases pendientes y responsables

| Fase | Qué falta | Responsable | Estado |
|---|---|---|---|
| F2 — Profesional real y visibilidad de agenda | Quitar el profesional fijo (`DEV_PERSONAS`). Permiso `dentistry:appointments:read-all` para el propietario. `GET /practitioners`. | Otro desarrollador (Agenda/Citas) | Pendiente |
| F3 — Grilla real e historial de citas | Quitar los datos ficticios de la agenda (`modules/clinic/__mocks__`). Vista de día y semana por franjas. `GET /appointments` paginado. Vista "Historial de citas". | Otro desarrollador (Agenda/Citas) | Pendiente |
| F4 — Tope de 300 pacientes | — | **Nosotros** | Implementado (`794c200`, `28c0c19`) |
| F5 — Procedimiento rápido | — | **Nosotros** | Implementado (`56ac9ed`, `7fb2591`) |
| F6 — Inventario | Modelos `InventoryItem` e `InventoryMovement`, migración, backend y pantallas. | Otro desarrollador (Inventario) | Pendiente |
| F7 — Cambio de contraseña en Core | `change-password-page.tsx` muestra éxito sin llamar a la API. | Sin asignar | Pendiente |

**Pendientes de datos antes de la demo** (se hacen desde Core, nunca con SQL directo):

- Dar de alta los permisos `dentistry:encounters:read|create|update|void` y asignarlos a los roles del propietario y del dentista. No existen en ningún seed del repo.
- Agregar al plan las funciones que el diccionario aún no lista (`inventory`, `dashboard`, `services`) cuando correspondan, y reasignar el plan a la organización: las asignaciones vigentes conservan su copia del plan hasta reasignarse.

## 5. Contratos compartidos que deben usar todos

- **Funciones del plan.** Cada controlador de un módulo del plan lleva:

  ```ts
  @UseGuards(DentistryJwtGuard, DentistryPermissionGuard, DentistryModuleGuard)
  @RequireModule('inventory')
  ```

  El guard traduce el módulo a la función del plan que lo habilita. Solo una función en `true` habilita su módulo:

  | Módulo (`@RequireModule`) | Función en `entitlements.features` |
  |---|---|
  | `patients` (incluye historial clínico) | `clinicalHistory` |
  | `agenda`, `appointments` | `appointments` |
  | `procedures` | `procedureNotes` |
  | `inventory` | `inventory` |
  | `dashboard` | `dashboard` |
  | `services` | `services` |
  | `treatments` | `treatments` |
  | `payments` | `payments` |

- **Límites del plan.** `entitlements.limits` con `patients`, `members` y `branches`, enteros positivos.
  - El cupo se comprueba **dentro de la transacción que crea el registro**, no en un guard: así lo respetan todos los caminos de alta.
  - En Dentistry, `assertPatientSeatAvailable` toma un bloqueo por organización antes de contar, para que dos altas simultáneas no superen el cupo.
- **Errores 403.**
  - Módulo no incluido: `{ code: 'MODULE_NOT_IN_PLAN', module, message }`.
  - Límite alcanzado: `{ code: 'PLAN_LIMIT_REACHED', resource, limit, message }`, con `resource` igual a `patients`, `members` o `branches`.
- **Frontend.**
  - `useAuthenticatedSession().plan` trae `{ modules, limits }`. `modules` son los módulos ya derivados de las funciones; si es `null`, el plan es anterior a las funciones y no restringe.
  - `ApiError.code` trae el código estable del backend.
  - Cada ítem nuevo de menú declara su `module` en `shared/components/layout/navigation.ts`.
  - Cada ruta nueva se registra en `shared/plan/plan-access.ts` (`ROUTE_MODULES`).
- **Base de datos (Inventario).**
  - Seguir solo el ciclo de `packages/db/README.md`: `migration:plan` → `test:schema` y `test:semantic` → `contract:emit` y `build`.
  - **Nunca** ejecutar SQL directo contra Neon ni `db:update` contra QA.
- **Commits.** Un commit atómico por ticket, con el formato `<type>(<scope>): HAG-XX - descripción`.

## 6. Puntos de coordinación entre equipos

- Agenda usa `CreatePatientModal` y `PatientDetail` de `modules/clinic`, que trabajan con datos ficticios. Reemplazarlos corresponde a **Agenda**; las versiones reales están en `features/patient`.
- **Atender desde la agenda (F8, nuestro equipo).** La tarjeta expandida y el detalle de la cita muestran "Atender" (lleva a `/patients/:patientId/clinical-encounters/new?appointmentId=:id`) y "Registrar procedimiento" (atención rápida con la cita). Si la cita ya tiene una atención, solo "Ver atención" o "Continuar atención". No se muestran en citas canceladas o ausentes. Componente: `features/clinical-encounter/components/appointment-encounter-actions.tsx`.
- **Estado de la cita sincronizado con la atención:** crear la atención pasa la cita a `IN_PROGRESS`; completarla o registrar una atención rápida, a `COMPLETED`; anularla no la toca; nunca se retrocede. Detalle en `dentistry/backend/src/modules/clinical-encounter/README.md`.
- **Pendiente de Agenda:** los cambios manuales de estado (Finalizar, Cancelar, No asistió) no consideran la atención vinculada; por ejemplo, se puede cancelar una cita con una atención en curso.
- La conversión de persona a paciente (`POST /persons/:id/convert`) se dispara desde la agenda. El backend ya aplica el tope, y la UI de Agenda solo debe mostrar el error `PLAN_LIMIT_REACHED`.
- **Zona horaria (corregido).** Las fechas de calendario se leen y escriben en la zona de la **sucursal** (`core.Branch.timezone`), con la de la organización como respaldo. `GET /auth/me` devuelve `context.timeZone` y `context.branchTimeZones`; el frontend convierte con `shared/time/zoned-time.ts` y `useTimeZone(branchId)`. La API acepta fechas sin zona (`2026-11-22T09:00`) y las interpreta en la zona de la sucursal; `GET /appointments?date=` es el día de calendario de cada sucursal. Las citas creadas antes del cambio quedaron 4 h antes y no se migran (datos de prueba).
- Pendiente fuera de Dentistry: el diálogo de asignar plan en Core usa UTC y la zona del navegador (ticket aparte).
- `AppointmentController` y `PersonController` todavía no llevan `@RequireModule('appointments')`; corresponde a **Agenda**.

## 7. Fuera del plan Starter (siguiente etapa)

- Precio y duración del plan, y los planes superiores.
- Odontograma y adjuntos. Los tratamientos y pagos se describen en la sección 8.
- Despliegue, CI, backups y monitoreo.

## 8. Plan estándar del cliente: presupuesto, abonos y saldo

> Estado: implementado y commiteado (HAG-11 a HAG-19). Migraciones aplicadas a la base `dev` el 2026-11-24; falta el recorrido real con el backend y el frontend en marcha. El detalle está en [plan-cobros-ortodoncia.md](../plan-cobros-ortodoncia.md).

Este README describe el plan Starter, pero el plan que usa el cliente es el **estándar**. Sus funciones reales son `files`, `payments`, `services`, `dashboard`, `appointments`, `procedureNotes` y `clinicalHistory`, con `inventory`, `odontogram`, `customForms` y `patientSelfService` en `false`. Para el cobro de ortodoncia se activa además `treatments: true` desde Core y se **reasigna** el plan a la organización (cada asignación conserva su copia).

| Qué | Cómo |
|---|---|
| Presupuesto | `Treatment.agreedPriceMinor` y `currency`; módulo `treatments` |
| Anticipo y abonos | `Payment` ligado al tratamiento; módulo `payments` |
| Abono de una atención | `Payment` ligado a la atención, 1:1; una atención sin pago es una prórroga |
| Saldo | Derivado: presupuesto menos los pagos `COMPLETED` del tratamiento |
| Propuesta de cobro | Suma de los precios de los procedimientos de la atención, acotada al saldo; recepción la confirma, edita u omite |

**Dónde se usa:** `/patients/:id/account` (cuenta del paciente) y el panel "Cobro" de la atención. Las antiguas pantallas globales de tratamientos y pagos eran un prototipo y se retiraron del menú.

**Permisos** (se dan de alta y se asignan desde Core, solo al propietario): `dentistry:payments:read|create|void`, `dentistry:treatments:read|create|update` y `dentistry:encounters:read|create|update|void`.

**Migraciones:** `20261105T1833`, `20261123T1811` y `20261123T1857` ya están aplicadas en `dev`. Otro entorno (QA, producción) las recibe con `migration:status` y `migrate` desde `packages/db`, en orden. Nunca SQL directo contra Neon ni `db:update` contra la base compartida.
