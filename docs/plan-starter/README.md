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
| Procedimiento | Texto libre con observaciones, sin precios ni cobros. Se registra desde una cita, desde una atención o suelto desde el paciente, como "atención rápida". |
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

## 3. Lo implementado en este ciclo (F1 — módulos y límites por plan)

> Estado: implementado y verificado, **sin commitear** a la espera de los IDs de ticket.

- **Core:**
  - `entitlements` valida `modules` y `limits` (`patients`, `users`, `branches`).
  - La creación de usuarios y sucursales respeta el cupo y devuelve el error `PLAN_LIMIT_REACHED`.
  - El formulario de planes permite editar los módulos y los límites.
- **Dentistry backend:**
  - El lector del plan vigente es `PlanEntitlementsReader`.
  - Guard `DentistryModuleGuard` con el decorador `@RequireModule('<modulo>')`, que responde `MODULE_NOT_IN_PLAN`.
  - `/auth/me` devuelve `plan`.
- **Dentistry frontend:**
  - El menú se filtra por plan con `navItemsForPlan`.
  - La pantalla "No incluido en tu plan" la muestra `ModuleGate`.
- **Verificación:** `tsc` sin errores; tests de core 37/37, de dentistry backend 76/76 y de dentistry frontend 122/122.

## 4. Fases pendientes y responsables

| Fase | Qué falta | Responsable | Estado |
|---|---|---|---|
| F2 — Profesional real y visibilidad de agenda | Quitar el profesional fijo (`DEV_PERSONAS`). Permiso `dentistry:appointments:read-all` para el propietario. `GET /practitioners`. | Otro desarrollador (Agenda/Citas) | Pendiente |
| F3 — Grilla real e historial de citas | Quitar los datos ficticios de la agenda (`modules/clinic/__mocks__`). Vista de día y semana por franjas. `GET /appointments` paginado. Vista "Historial de citas". | Otro desarrollador (Agenda/Citas) | Pendiente |
| F4 — Tope de 300 pacientes | Aplicar el límite en el alta y en la conversión de persona a paciente. Contador y aviso "Mejora tu plan". | **Nosotros** | Pendiente |
| F5 — Procedimiento rápido | "Atención rápida" desde el paciente y preselección de cita en la nueva atención. | **Nosotros** | Pendiente |
| F6 — Inventario | Modelos `InventoryItem` e `InventoryMovement`, migración, backend y pantallas. | Otro desarrollador (Inventario) | Pendiente |
| F7 — Cambio de contraseña en Core | `change-password-page.tsx` muestra éxito sin llamar a la API. | Sin asignar | Pendiente |

El detalle de F4 y F5 está en [plan-paciente-historial-procedimiento.md](./plan-paciente-historial-procedimiento.md).

## 5. Contratos compartidos que deben usar todos

- **Módulos del plan.** Cada controlador de un módulo del plan lleva:

  ```ts
  @UseGuards(DentistryJwtGuard, DentistryPermissionGuard, DentistryModuleGuard)
  @RequireModule('inventory')
  ```

  Los códigos válidos son: `patients`, `agenda`, `appointments`, `procedures`, `inventory`, `dashboard`, `services`, `treatments` y `payments`.
- **Errores 403.**
  - Módulo no incluido: `{ code: 'MODULE_NOT_IN_PLAN', module, message }`.
  - Límite alcanzado: `{ code: 'PLAN_LIMIT_REACHED', resource, limit, message }`.
- **Frontend.**
  - `useAuthenticatedSession().plan` trae `{ modules, limits }`. Si `modules` es `null`, todos los módulos están habilitados.
  - Cada ítem nuevo de menú declara su `module` en `shared/components/layout/navigation.ts`.
  - Cada ruta nueva se registra en `shared/plan/plan-access.ts` (`ROUTE_MODULES`).
- **Base de datos (Inventario).**
  - Seguir solo el ciclo de `packages/db/README.md`: `migration:plan` → `test:schema` y `test:semantic` → `contract:emit` y `build`.
  - **Nunca** ejecutar SQL directo contra Neon ni `db:update` contra QA.
- **Commits.** Un commit atómico por ticket, con el formato `<type>(<scope>): HAG-XX - descripción`.

## 6. Puntos de coordinación entre equipos

- Agenda usa `CreatePatientModal` y `PatientDetail` de `modules/clinic`, que trabajan con datos ficticios. Reemplazarlos corresponde a **Agenda**; las versiones reales están en `features/patient`.
- **Agenda** pone el botón "Iniciar atención" en el detalle de la cita, con un enlace a `/patients/:patientId/clinical-encounters/new?appointmentId=:id`. Esa ruta la deja lista **nosotros** en F5.
- La conversión de persona a paciente (`POST /persons/:id/convert`) se dispara desde la agenda. El tope de 300 lo aplica el backend en **F4**, y la UI de Agenda solo debe mostrar el error `PLAN_LIMIT_REACHED`.

## 7. Fuera del plan Starter (siguiente etapa)

- Precio y duración del plan, y los planes superiores.
- Odontograma, tratamientos, pagos y adjuntos.
- Despliegue, CI, backups y monitoreo.
