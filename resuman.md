# Resumen del Estado del Proyecto

> Fecha: 2026-10-14
> Estructura: monorepo con dos verticales (`core` y `dentistry`), cada una con `backend` (NestJS) y `frontend` (Next.js), más un paquete compartido `packages/db` (Prisma) y `packages/ui` (componentes UI).

---

## Tabla Resumen por Vertical y Capa

| Vertical | Capa | Stack principal | Estado general | Lo implementado | Características faltantes / pendientes |
|---|---|---|---|---|---|
| **core** | **backend** | NestJS 11 · Prisma 8 (Postgres) · jose · bcryptjs | 🟡 Funcional, incompleto | Auth (login + `/me`), JWT por audiencia (core/dentistry), policy de acceso vertical, Organization (crear, setup, listar, listar branches), User (listar, crear), Role (CRUD parcial + permisos), Plan (CRUD + asignación a organización), guards `JwtAuthGuard` + `CoreAccessGuard` + `RolesGuard` | **Refresh tokens** (tabla `Session` con `refreshTokenHash` existe en BD pero no hay lógica ni endpoint), **logout**, reset de contraseña, verificación de email, **account lockout** (campos `failedAttempts`/`lockedUntil` sin uso), update/delete de User/Org/Branch, detalle de usuario por ID, auditoría no cableada, rate limiting |
| **core** | **frontend** | Next.js 16 · React 19 · Tailwind 4 · react-query · axios · react-hook-form · zod · `@app/ui` | 🟢 Avanzado | Landing, login, dashboard, organizations (lista + detalle + setup con branches/roles), branches (crear), users (lista + crear + detalle + cambiar email/password + permisos), roles (crear rol + permiso + asignar), plans (lista + crear + asignar), settings, **BFF con whitelist de rutas** | Sin librería de iconos (SVGs inline en `Icons.tsx`), el BFF no cubre todas las rutas del backend (ej. detalle de organización por ID, update de entidades), sin manejo de refresh token (sesión de 15 min sin renovación silenciosa), logout solo limpia cookie (no llama al backend), sin error boundaries |
| **dentistry** | **backend** | NestJS 11 · Prisma 8 (Postgres) · jose | 🔴 Incompleto, fallos de seguridad | Auth (verifica JWT emitido por core, `/me`), Appointment (CRUD completo **con guards** y permisos), DentalService (CRUD completo **SIN guards**), Patient (listar/crear/actualizar **SIN guards**) | **`ClinicModule` no registrado** en `app.module.ts` (endpoint `/clinic/professionals` no disponible), **Patient y DentalService carecen de guards de autenticación/autorización**, sin módulos para: Treatment, ClinicalEncounter, Payment, ClinicalHistory, ClinicalFile/Radiograph, Inventory (la BD sí tiene los modelos), sin audit log, sin rate limiting |
| **dentistry** | **frontend** | Next.js 16 · React 19 · Tailwind 4 · `@app/ui` (sin react-query / axios / react-hook-form) | 🔴 Mayormente mockeado | Landing, login, dashboard, agenda (usa API de appointments + mocks para pacientes/servicios/profesionales), vistas de pacientes, servicios, inventario, pagos, tratamientos, registro de pagos, demo de historia clínica | **BFF solo whitelistea rutas de appointments** (patients, services, clinic NO pasan por el proxy), **la mayoría de vistas usan datos mock** (`__mocks__/data`) en lugar de la API real, sin librería de data-fetching (fetch nativo), sin librería de formularios/validación, sin librería de iconos (SVGs inline), sin integración backend para tratamientos/historia clínica/pagos/inventario, sin listado de profesionales vía API, sin manejo de refresh token |

---

## Detalle por capa

### 🔹 core-backend

**Módulos registrados** ([app.module.ts](file:///d:/Usuarios/ariel.cruz/Desktop/Trae/core-app/core/backend/src/app.module.ts)): `Prisma`, `Organization`, `User`, `Role`, `Auth`, `Plan`.

**Endpoints existentes:**
- `POST /auth/login`, `POST /auth/core/login`, `POST /auth/dentistry/login`, `GET /auth/me`
- `POST /organizations`, `POST /organizations/setup`, `GET /organizations`, `GET /organizations/:id/branches`
- `POST /branches/create`
- `GET /users`, `POST /users/create`
- `GET /role/get-list-org`, `POST /role/create`, `GET /role/permissions`, `POST /role/permissions`, `GET /role/permissions/:roleId`, `PUT /role/:roleId/permissions`
- `GET /plans`, `GET /plans/assignments`, `GET /plans/:id`, `POST /plans`, `PATCH /plans/:id`, `DELETE /plans/:id`
- `GET /organizations/:id/plans`, `PUT /organizations/:id/plans/:vertical`, `PATCH /organizations/:id/plans/:vertical/status`

**Pendientes clave:**
- ❌ **Refresh tokens**: El modelo `Session` (con `refreshTokenHash`, `expiresAt`, `revokedAt`) existe en el esquema de BD pero no hay caso de uso, repositorio ni endpoint que lo utilice. El login solo emite un access token de corta duración.
- ❌ No hay endpoint de logout.
- ❌ No hay flujo de recuperación/reset de contraseña ni verificación de email.
- ❌ Los campos `failedAttempts` y `lockedUntil` de `Authorization` no se usan (sin lógica de bloqueo por intentos fallidos).
- ❌ Faltan operaciones de actualización/eliminación para User, Organization y Branch.
- ❌ No hay endpoint de detalle de usuario por ID.
- ⚠️ El `prisma-audit.writer.ts` existe pero no está claro que se invoque en los casos de uso.

---

### 🔹 core-frontend

**Features implementadas** (bajo `src/features`): auth, dashboard, landing, organization, plan, role, settings, user.

**Puntos fuertes:**
- ✅ Usa `@tanstack/react-query`, `axios`, `react-hook-form` y `zod`.
- ✅ BFF server-side con whitelist de rutas y validación de origen para mutaciones ([backend-proxy.ts](file:///d:/Usuarios/ariel.cruz/Desktop/Trae/core-app/core/frontend/src/infrastructure/http/backend-proxy.ts)).
- ✅ Sesión en cookie httpOnly.

**Pendientes clave:**
- ⚠️ **Sin librería de iconos**: se usan SVGs inline en [Icons.tsx](file:///d:/Usuarios/ariel.cruz/Desktop/Trae/core-app/core/frontend/src/shared/components/ui/Icons.tsx).
- ⚠️ El BFF no cubre todas las rutas del backend (el whitelist es limitado).
- ❌ Sin renovación de sesión (expira a los 15 min y no hay refresh).
- ❌ Logout ([logout-action.ts](file:///d:/Usuarios/ariel.cruz/Desktop/Trae/core-app/core/frontend/src/features/auth/actions/logout-action.ts)) solo borra la cookie, no notifica al backend.

---

### 🔹 dentistry-backend

**Módulos registrados** ([app.module.ts](file:///d:/Usuarios/ariel.cruz/Desktop/Trae/core-app/dentistry/backend/src/app.module.ts)): `Prisma`, `DentistryAuth`, `Appointment`, `DentalService`, `Patient`.

**Problemas críticos:**
- 🔴 **`ClinicModule` existe pero NO está importado** en `app.module.ts`, por lo que `GET /clinic/professionals` no está disponible.
- 🔴 **`PatientController` y `DentalServiceController` no tienen `@UseGuards`**: cualquier petición anónima puede listar/crear/modificar pacientes y servicios. Solo `AppointmentController` usa `DentistryJwtGuard` + `DentistryPermissionGuard`.

**Endpoints existentes:**
- `GET /auth/me` (protegido)
- `GET/POST /appointments`, `GET /appointments/:id`, `PATCH /appointments/:id/status`, `POST /appointments/:id/cancel` (protegidos)
- `GET/POST /patients`, `GET /patients/:id`, `PATCH /patients/:id` (SIN proteger)
- `GET/POST /services`, `GET /services/:id`, `PATCH /services/:id`, `PATCH /services/:id/toggle-status`, `DELETE /services/:id` (SIN proteger)

**Pendientes clave (BD tiene los modelos pero no hay módulos backend):**
- ❌ Treatment (tratamientos)
- ❌ ClinicalEncounter (encuentros clínicos)
- ❌ Payment (pagos)
- ❌ ClinicalHistory (historia clínica)
- ❌ ClinicalFile / Radiograph (archivos clínicos / radiografías)
- ❌ Inventory (inventario) — ni siquiera existe modelo en BD
- ❌ Falta conectar `ClinicModule` y añadir guards a Patient y Service.

---

### 🔹 dentistry-frontend

**Vistas existentes** (bajo `src/modules/clinic/views`): Agenda, Patients, PatientDetail, Services, Inventory, Payments, RegisterPayment, Treatments, ClinicDashboard.

**Problemas críticos:**
- 🔴 **El BFF ([dentistry-proxy.ts](file:///d:/Usuarios/ariel.cruz/Desktop/Trae/core-app/dentistry/frontend/src/infrastructure/http/dentistry-proxy.ts)) solo whitelistea rutas de `appointments`.** Las llamadas a `/api/dentistry/patients`, `/services`, `/clinic/professionals` devolverán 404.
- 🔴 **La mayoría de vistas consumen datos mock** de `__mocks__/data.ts` en lugar de la API: `Patients`, `Services`, `Inventory`, `Payments`, `Treatments`. Solo `Agenda` mezcla API de citas con mocks.
- ⚠️ No usa `react-query`, `axios` ni `react-hook-form` — depende de `fetch` nativo.
- ⚠️ Sin librería de iconos (SVGs inline).

**Pendientes clave:**
- ❌ Extender el BFF para whitelitear patients, services, clinic (professionals), treatments, payments, inventory.
- ❌ Reemplazar mocks por llamadas reales a la API en Patients, Services, Inventory, Payments, Treatments.
- ❌ No hay integración con historia clínica, pagos, tratamientos ni inventario a nivel backend.
- ❌ Sin listado de profesionales (depende de `ClinicModule` no registrado en backend).
- ❌ Sin manejo de refresh token.

---

## Notas transversales

- **Base de datos compartida**: `packages/db` define el contrato Prisma con namespaces `core` y `dentistry`. Los modelos de dentistry (Treatment, Payment, ClinicalHistory, etc.) ya existen en el esquema pero no están expuestos por el backend.
- **Paquete UI compartido**: `packages/ui` contiene componentes base (Button, Input, Modal, etc.) con Storybook. Ambos frontends lo consumen.
- **Autenticación cross-vertical**: el core emite JWT con audiencia `core` o `dentistry`; el backend de dentistry verifica el JWT del core. No hay refresh token en ninguna de las dos.
- **Iconos**: ninguno de los dos frontends usa una librería de iconos (lucide-react, heroicons, etc.); ambos mantienen un `Icons.tsx` con SVGs inline.
