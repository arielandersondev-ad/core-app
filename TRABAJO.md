# Registro de trabajo — Inventario y consultas

Fecha: 2026-11-13.
Repositorio: `arielandersondev-ad/core-app`.
Rama oficial: `feature/inventory-consultations`.

Este documento concentra las ramas, los commits, las decisiones, lo descartado,
la verificación y lo que falta. Es el contexto único para revisar o retomar el
trabajo.

---

## 1. Modelo de ramas

| Rama | Commit | Fecha | Rol |
|---|---|---|---|
| `main` | `fe2dc3f` | 2026-10-23 | Producción. **No se tocó.** |
| `dev` | `c15d5a9` | 2026-11-11 | Integración. **No se tocó.** |
| `feature/inventory-consultations` | `4ec2286` | 2026-11-13 | Rama oficial de la Fase 0. Reconstruida sobre `dev`. |
| `feature/inventory-api` | `f8cbb21` | 2026-11-13 | Rama apilada: contrato, backend y cliente API. |
| `backup/inventory-consultations-2026-11-13` | `a9ab4b0` | 2026-10-03 | Respaldo de la rama vieja. No se mergea. |

Reglas acordadas:

- Nada se mergea a `dev` ni a `main` hasta que pase la revisión.
- La revisión se solicita con un PR **draft** contra `dev`.
- `feature/inventory-consultations` es la rama oficial.
- La Fase 1 (backend + base) va en una rama apilada aparte:
  `feature/inventory-api`.

---

## 2. Por qué se reconstruyó la rama

La rama original había salido de `dev` el 2026-09-19 (`7f785d3`) y quedó
**77 commits atrás**. En el camino, `dev` cambió de arquitectura:

- Frontend con `src/features/*`, `@app/ui`, react-query, axios, zod.
- Backend con 7 módulos, incluido `clinical-encounter` completo.
- Contrato en PascalCase, UUID nativo, `timestamptz`, `deletedAt`.
- 4 paquetes de migración nuevos y documentación de estandarización.

Un merge directo habría producido 30+ conflictos y habría reintroducido
duplicados de consultas y una versión peor de clinical encounters. Por eso se
reconstruyó sobre `dev` conservando solo los aportes reales.

---

## 3. Fase 0 — rama oficial

### Commits

| Commit | Tipo | Contenido | Archivos |
|---|---|---|---|
| `53bd780` | fix | Corrige los 5 bugs del data-table | 7 |
| `462e255` | feat | Bitácora y conciliación de inventario | 3 |
| `9dce2cf` | test | 15 tests de inventario en `node --test` | 2 |
| `cc39739` | docs | Modelo de inventario propuesto | 1 |
| `2d0f9aa` | feat | Registro de entradas, salidas y ajustes | 3 |
| `1349bd6` | docs | Documenta el registro de movimientos | 1 |
| `74731d0` | docs | Guía de revisión (`REVIEW.md`) | 1 |

### Qué incluye

**Data-table (`53bd780`)**

- `useTablePagination` se llama siempre; se eliminó el hook condicional.
- `safePage` evita quedar en una página fuera de rango al filtrar.
- `getNestedValue` unificado en `utils/get-nested-value.ts`.
- `ColumnConfig.key` pasó a `keyof T`.
- `getRowId` para keys estables de fila.
- `quickFilters` + `quickFilterKey` implementados en toolbar y filtro.
- `AGENTS.md` actualizado: Fase 1 completa.

**Inventario (`462e255`, `2d0f9aa`)**

- Se conserva la UI de `dev`: KPIs, alertas, filtros, scroll infinito y
  `CreateInventoryModal`.
- Se agrega bitácora por artículo con entradas, salidas y ajustes.
- Se agrega conciliación `stock` ↔ suma de movimientos, con banner de alerta.
- Se agrega registro de movimientos desde la UI, con validación de stock
  insuficiente.
- Al registrar un movimiento, el stock se recalcula desde la bitácora.
- El alta de un insumo con stock inicial genera su movimiento `IN`.

**Tests (`9dce2cf`)**

- 15 casos nuevos en `dentistry/frontend/tests/inventory.test.mjs`.
- Se adaptó una aserción de `mobile-filter-sheet-integration.test.mjs` porque el
  reset de filtros pasó a handlers (`changeFilter`/`changeCategory`).

**Documentación (`cc39739`, `1349bd6`, `74731d0`)**

- `packages/db/docs/inventory-model-proposal.md`: modelo propuesto, mapeo
  mock → contrato y decisiones de escalado.
- `REVIEW.md`: alcance, orden de lectura, evidencia y checklist.

### Qué se descartó de la rama vieja

| Elemento | Motivo |
|---|---|
| `Consultations.tsx` | `dev` ya tiene clinical encounters completo. |
| `clinical-encounters.ts` | Duplicado del feature de `dev`. |
| `section-tabs`, redirect | Ya existen en `dev`. |
| Módulo backend `clinical-encounter` (15 archivos) | El de `dev` tiene 25 y cubre más. |
| `shared/components/ui/*` | `dev` usa `packages/ui` (`@app/ui`). |
| Unificación en `clinic-data.ts` | `dev` eligió `__mocks__/data.ts`. |
| Seeds (`seed-dentistry.sql`, `seed.mjs`) | Apuntan a tablas snake_case y usan `psql` directo, prohibido por `AGENTS.md`. |
| Docs de BD de la rama vieja | El `README.md` de `dev` ya está corregido. |

---

## 4. Verificación

Ejecutado en `dentistry/frontend`:

```text
tsc --noEmit --incremental false   -> 0 errores
npm test                           -> 133/133 (118 previos + 15 nuevos)
npm run build                      -> compila; /inventory presente
next start + HTTP                  -> /login 200; /inventory 307 a login
```

Backends, en local:

```text
core/backend        -> 3002, POST /auth/dentistry/login responde 401 con credenciales falsas
dentistry/backend   -> 3004, GET /health responde 200
frontend            -> 3001, GET /login responde 200
```

Lint sobre archivos tocados: 0 errores. Queda solo el warning conocido de
`<img>` en la columna `image` del data-table.

Fase 1:

```text
packages/db test:schema        -> 8/8
packages/db test:semantic      -> 7/7
packages/db build              -> OK
dentistry/backend build        -> OK
dentistry/frontend tsc        -> 0 errores
dentistry/frontend test       -> 133/133
dentistry/frontend build      -> OK
/inventory con JWT de dev      -> 200 (cae a mocks si la API no responde)
```

`test:migration` falla en el `dev` base con “PGlite is closed”; se comprobó con
`git stash` que el fallo ya existe antes de estos cambios. No es una regresión
de inventario.

---

## 5. Entorno local (no versionado)

Para que el login y los backends funcionen en esta máquina:

- Se generaron claves RSA en `core/backend/secrets/`
  (`jwt-private.pem`, `jwt-public.pem`).
- La pública se copió a `dentistry/backend/secrets/jwt-public.pem`.
- Se completaron `core/backend/.env` y `dentistry/backend/.env` con las
  variables de `.env.example`; respaldo en `.env.bak-2026-11-13`.
- Se creó `dentistry/frontend/.env.local` **sin BOM**:

  ```env
  AUTH_API_URL=http://localhost:3002
  DENTISTRY_API_URL=http://localhost:3004
  ```

- Se reconstruyó `packages/db` (`npm run build`) para que los backends usen el
  contrato actual de `dev`.
- `node_modules` se instaló con `--legacy-peer-deps` en frontend, `packages/ui`
  y `dentistry/backend`.

Nada de esto se versiona: `.env`, `*.pem`, `node_modules` y `dist` están
gitignored.

---

## 6. Estado actual

| Capa | Estado |
|---|---|
| Frontend UI de inventario | ✅ Bitácora, conciliación, registro de movimientos |
| Frontend API client de inventario | ✅ `features/inventory` con hooks y fallback |
| Backend de inventario | ✅ Módulo `inventory` con endpoints y transacción |
| Contrato de inventario | ✅ En `schema.ts`, emitido (`f5c0089e…`) |
| Migración planificada | ✅ `20261113T2018_inventory_items_and_movements` |
| Tablas de inventario en Neon | ❌ **No aplicadas** (requiere autorización) |
| End-to-end real | ⏳ Pendiente de `migrate` y verificación |

Importante: mientras la migración no se aplique, la UI funciona con mocks y
muestra el aviso de “datos de demostración”. El código de backend y cliente API
ya está listo.

---

## 7. Fase 1 — implementada hasta la compuerta de `migrate`

Rama: `feature/inventory-api`, apilada sobre
`feature/inventory-consultations`.

### 7.1 Contrato (hecho, sin tocar la base)

- `InventoryItem` e `InventoryMovement` agregados a
  `packages/db/src/prisma/schema.ts` con:
  - PascalCase, `uuidNative`, `timestamptz`, `deletedAt`.
  - `unitCostMinor` + `currency`, `lotNumber`, `expiryDate`.
  - CHECKs en `type`, `quantity`, `currentStock`, moneda y versión.
- `contract:emit` → `f5c0089e6a6991ed41f5356139ae71499adcae0c935ec1f9a0f076c580919723`.
- `test:schema` → 8/8; `test:semantic` → 7/7.
- `migration:plan` → `20261113T2018_inventory_items_and_movements`
  (11 operaciones aditivas, snapshot `f5c0089e…`).
- Se corrigió de paso la deuda del diccionario/tests de `dev`:
  faltaban `TreatmentProcedure`, `ClinicalEncounterProcedure` y las columnas
  `maritalStatus`, `occupation`, `origin` de `Patient`.

### 7.2 Base (pendiente, requiere autorización explícita)

- `migrate` del paquete planificado.
- `db:verify`.
- No usar `db:update` ni `db sign`.

### 7.3 Backend (hecho)

- Módulo `dentistry/backend/src/modules/inventory/` con el patrón de
  `appointment`.
- Endpoints:
  - `GET /inventory/items`
  - `POST /inventory/items`
  - `PATCH /inventory/items/:id`
  - `DELETE /inventory/items/:id`
  - `GET /inventory/items/:id/movements`
  - `POST /inventory/items/:id/movements`
- Registro de movimiento en transacción con actualización de stock y rechazo
  de stock negativo.
- Validación de organización y sucursal desde el token.
- Permisos temporales: `dentistry:services:read` para lectura y
  `dentistry:services:manage` para escritura, hasta crear permisos propios de
  inventario.
- `npm run build` del backend: OK.

### 7.4 Frontend (hecho)

- `src/features/inventory/` con `api/`, `services/`, `hooks/` y `types/`.
- `Inventory.tsx` usa la API cuando está disponible y cae a mocks si falla.
- `CreateInventoryModal` y `RegisterInventoryMovementModal` aceptan callbacks
  de API; conservan el comportamiento mock como fallback.
- BFF: rutas de inventario agregadas a `dentistry-proxy.ts`.
- `tsc` 0 errores; 133/133 tests; build de Next OK; `/inventory` 200 con sesión.

### 7.5 Fuera de alcance

- Refactor de dinero de mocks (`price` → `basePriceMinor`): rama aparte.
- Proveedores, órdenes de compra, transferencias entre sucursales, anulación de
  movimientos, catálogo de unidades.

---

## 8. Cómo revisar

1. Leer `REVIEW.md`.
2. Leer `packages/db/docs/inventory-model-proposal.md`.
3. Revisar en este orden:
   - `__mocks__/data.ts` (modelo y helpers).
   - `Inventory.tsx` (integración).
   - `RegisterInventoryMovementModal.tsx` (validación y alta).
   - `shared/components/data-table/*` (fixes).
   - `tests/inventory.test.mjs`.
4. Ejecutar:

   ```powershell
   npm --prefix dentistry/frontend test
   node dentistry/frontend/node_modules/typescript/bin/tsc --noEmit --incremental false -p dentistry/frontend/tsconfig.json
   ```

5. Abrir el PR draft:

   ```powershell
   gh auth login
   gh pr create --draft --base dev `
     --head feature/inventory-consultations `
     --title "feat(dentistry): inventario con bitacora, conciliacion y fixes de data-table" `
     --body-file REVIEW.md
   ```

---

## 9. Riesgos y reversión

- Mientras la migración no se aplique, el inventario sigue en modo mock y no
  persiste.
- Una vez aplicada, el stock se recalcula y actualiza en la misma transacción
  que el movimiento.
- Revertir la Fase 0: `git revert` de los commits, o volver a
  `backup/inventory-consultations-2026-11-13`.
- Revertir la Fase 1: revertir la rama `feature/inventory-api`; si ya se aplicó
  la migración, no se revierte con código, se necesita una migración nueva.

---

## 10. Historial de decisiones

| Fecha | Decisión |
|---|---|
| 2026-11-13 | `dev` es integración y `main` producción. |
| 2026-11-13 | No se mergea nada a `dev`/`main`; se pide code review. |
| 2026-11-13 | La rama oficial se reconstruye sobre `dev`, no se mergea la vieja. |
| 2026-11-13 | Se conserva el trabajo anterior en `backup/...`. |
| 2026-11-13 | Inventario sigue sobre mocks en Fase 0; backend y base van en Fase 1. |
| 2026-11-13 | El refactor de dinero se difiere a una rama aparte. |
| 2026-11-13 | `migrate` requiere autorización explícita antes de ejecutarse. |
| 2026-11-13 | Fase 1 en `feature/inventory-api`: contrato, backend y cliente API hechos; migración solo planificada. |
