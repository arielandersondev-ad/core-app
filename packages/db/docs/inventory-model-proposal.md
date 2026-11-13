# Inventario — estado actual y modelo propuesto

Fecha: 2026-11-13. Rama: `feature/inventory-consultations`.

Este documento separa lo que ya está implementado (UI sobre mocks) de lo que
requiere contrato y migración. No autoriza ejecutar `migrate`, `db:update` ni
`db sign`.

## Implementado en esta rama

- `Inventory.tsx` conserva la UI de `dev`: KPIs, alertas, filtros, scroll
  infinito y `CreateInventoryModal`.
- Se agregó la bitácora por artículo: entradas, salidas y ajustes, con el
  profesional que registró el movimiento.
- Se agregó el registro de movimientos desde la UI. Al guardar, el stock
  denormalizado se recalcula desde la bitácora, de modo que ambos siempre
  concilian.
- Se agregó conciliación `stock` ↔ suma de movimientos. Si un artículo tiene
  movimientos y su stock no cuadra, aparece un banner de advertencia.
- El alta de un insumo con stock inicial genera su movimiento `IN`, para que la
  bitácora pueda reconciliar desde el primer día.
- Los mocks viven en `src/modules/clinic/__mocks__/data.ts`.

## Estado de implementación

- Contrato: `InventoryItem` e `InventoryMovement` agregados a
  `src/prisma/schema.ts` con UUID nativo, `timestamptz`, `deletedAt` y CHECKs.
- Contrato emitido: `f5c0089e6a6991ed41f5356139ae71499adcae0c935ec1f9a0f076c580919723`.
- Migración planificada: `20261113T2018_inventory_items_and_movements`
  (11 operaciones aditivas).
- **No aplicada**: el paquete está en el grafo, pero `migrate` requiere
  autorización explícita.
- Backend y cliente API: implementados en `feature/inventory-api`.
- Verificación end-to-end: pendiente de aplicar la migración.

## Mapeo mock → contrato

| Mock actual | Contrato propuesto | Nota |
|---|---|---|
| `InventoryItem.stock` | `currentStock` | Denormalizado; se recalcula desde la bitácora |
| `InventoryItem.lastRefill` | `lastRestockAt` | Derivado de la última entrada; no requiere columna |
| `InventoryItem.category` | `category` | Texto libre por ahora |
| `InventoryItem.unit` | `unit` | Texto libre; evaluar catálogo |
| `InventoryMovement.type` (`IN\|OUT\|ADJUSTMENT`) | igual | Con CHECK en base |
| `InventoryMovement.quantity` | igual | Absoluto en `IN`/`OUT`; con signo en `ADJUSTMENT` |
| `InventoryMovement.occurredAt` | `createdAt` | Instante del movimiento |
| `InventoryMovement.reason` | `reason` | Texto libre |
| `InventoryMovement.professionalId` (mock) | `createdByMembershipId` | El mock usa ids de profesional |

## Modelo propuesto para la Fase 1

`InventoryItem`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | UUID nativo | UUIDv7 |
| `organizationId` | UUID | Referencia Core por id, sin FK cruzada |
| `branchId` | UUID | Stock por sucursal |
| `sku` | text | Único por `(branchId, sku)` |
| `name` | text | Obligatorio |
| `description` | text? | — |
| `category` | text? | — |
| `unit` | text | Obligatorio |
| `minStock` | int | `>= 0` |
| `currentStock` | int | `>= 0`; protegido por CHECK |
| `unitCostMinor` | int? | Costo unitario en minor units |
| `currency` | text | `BOB` por defecto |
| `isActive` | boolean | `true` por defecto |
| `createdByMembershipId` | UUID | — |
| `updatedByMembershipId` | UUID? | — |
| `deletedAt` | timestamptz? | Borrado lógico |
| `createdAt` / `updatedAt` | timestamptz | — |
| `rowVersion` | int | Control de concurrencia; `> 0` |

`InventoryMovement`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | UUID nativo | UUIDv7 |
| `organizationId` / `branchId` | UUID | Coherencia con el artículo |
| `itemId` | UUID | FK dentro de `dentistry` |
| `type` | text | CHECK: `IN`, `OUT`, `ADJUSTMENT` |
| `quantity` | int | CHECK: `<> 0`; signo según tipo |
| `unitCostMinor` | int? | Costo del movimiento (para promedio/COGS) |
| `currency` | text | `BOB` por defecto |
| `lotNumber` | text? | Trazabilidad por lote |
| `expiryDate` | date? | Vencimiento del insumo (fecha civil) |
| `reason` | text? | — |
| `relatedTreatmentId` | UUID? | Referencia validada por la API, sin FK física |
| `relatedClinicalEncounterId` | UUID? | Referencia validada por la API, sin FK física |
| `createdByMembershipId` | UUID | — |
| `createdAt` | timestamptz | — |

Índices: `(itemId, createdAt)`, `(organizationId, type)`,
`(organizationId, branchId, createdAt)`, `(branchId, sku)` único parcial
(`deletedAt IS NULL`), `(organizationId, branchId)`, `(organizationId, isActive)`.
FK compuesta `(organizationId, itemId)` a `InventoryItem`.

## Por qué estas columnas antes del primer `migrate`

- **Costo por movimiento**: sin `unitCostMinor` no se puede valorar inventario
  ni calcular costo promedio. Agregarlo después obliga a reconstruir el
  histórico.
- **Lote y vencimiento**: los insumos dentales vencen. Sin lote no hay
  trazabilidad sanitaria y no se puede inventar retroactivamente.
- **CHECK en `type`/`quantity`/`currentStock`**: hoy nada impide stock negativo
  ni tipos inválidos.

## Pendiente de la Fase 1

- Aplicar la migración `20261113T2018_inventory_items_and_movements` con
  autorización explícita y verificar con `db:verify`.
- Módulo backend de inventario y endpoints.
- Refactor de dinero en los mocks del frontend (`price` → `basePriceMinor`).
  La API real ya usa minor units y `@app/ui` ya expone `formatMinorCurrency`;
  el cambio queda para una rama propia.
- Proveedores/órdenes de compra, transferencias entre sucursales, anulación de
  movimientos y conversión de unidades.
