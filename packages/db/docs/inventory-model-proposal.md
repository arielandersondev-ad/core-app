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

## Mapeo mock → contrato futuro

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
| `expiresAt` | date? | Vencimiento del insumo |
| `reason` | text? | — |
| `relatedTreatmentId` | UUID? | FK opcional |
| `relatedClinicalEncounterId` | UUID? | FK opcional |
| `createdByMembershipId` | UUID | — |
| `createdAt` | timestamptz | — |

Índices: `(itemId, createdAt)`, `(organizationId, type)`,
`(branchId, sku)` único, `(organizationId, branchId)`.

## Por qué estas columnas antes del primer `migrate`

- **Costo por movimiento**: sin `unitCostMinor` no se puede valorar inventario
  ni calcular costo promedio. Agregarlo después obliga a reconstruir el
  histórico.
- **Lote y vencimiento**: los insumos dentales vencen. Sin lote no hay
  trazabilidad sanitaria y no se puede inventar retroactivamente.
- **CHECK en `type`/`quantity`/`currentStock`**: hoy nada impide stock negativo
  ni tipos inválidos.

## Fuera de alcance de esta rama

- Módulo backend de inventario y endpoints.
- Migración de las tablas.
- Refactor de dinero en los mocks del frontend (`price` → `basePriceMinor`).
  La API real ya usa minor units y `@app/ui` ya expone `formatMinorCurrency`;
  el cambio queda para una rama propia.
- Proveedores/órdenes de compra, transferencias entre sucursales, anulación de
  movimientos y conversión de unidades.
