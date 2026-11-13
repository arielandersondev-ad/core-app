# Revisión — `feature/inventory-consultations`

Rama oficial del trabajo de inventario. Base: `origin/dev` (`c15d5a9`).
No se modifican `dev` ni `main`. El trabajo anterior quedó archivado en
`backup/inventory-consultations-2026-11-13` (`a9ab4b0`).

## Alcance

Incluido:

- Corrección de los 5 bugs documentados del data-table.
- Bitácora de inventario por artículo (entradas, salidas, ajustes).
- Conciliación entre `stock` denormalizado y la suma de movimientos.
- Registro de movimientos desde la UI.
- 15 tests de inventario con el runner nativo de `dev` (`node --test`).
- Documento con el modelo de inventario propuesto para la Fase 1.

Fuera de alcance:

- Módulo backend de inventario.
- Migración de tablas de inventario.
- Refactor de dinero de los mocks (`price` → `basePriceMinor`). La API real ya
  usa minor units; se deja para una rama propia.
- Consultas y clinical encounters: ya existen y son más completos en `dev`.

## Commits

| Commit | Contenido |
|---|---|
| `53bd780` | Data-table Fase 1 |
| `462e255` | Bitácora y conciliación |
| `9dce2cf` | Tests de inventario en `node --test` |
| `cc39739` | Modelo de inventario propuesto |
| `2d0f9aa` | Registro de movimientos |
| `1349bd6` | Doc del registro de movimientos |

## Orden de lectura sugerido

1. `packages/db/docs/inventory-model-proposal.md` — qué se implementó y qué
   falta para escalar.
2. `dentistry/frontend/src/modules/clinic/__mocks__/data.ts` — modelo de datos,
   movimientos y helpers de conciliación.
3. `dentistry/frontend/src/modules/clinic/views/Inventory.tsx` — integración
   con la UI existente de `dev`.
4. `dentistry/frontend/src/modules/clinic/components/RegisterInventoryMovementModal.tsx`
   — alta de movimientos y validación de stock.
5. `dentistry/frontend/src/shared/components/data-table/` — fixes del data-table
   y su `AGENTS.md` actualizado.
6. `dentistry/frontend/tests/inventory.test.mjs` — 15 casos.

## Evidencia de verificación

Ejecutado en `dentistry/frontend`:

```text
tsc --noEmit --incremental false   -> 0 errores
npm test                           -> 133/133 (118 previos + 15 nuevos)
npm run build                      -> compila; /inventory presente
next start + HTTP                  -> /login 200; /inventory 307 a login (auth)
```

`eslint` sobre los archivos tocados: 0 errores; queda solo el warning conocido
de `<img>` en la columna `image` del data-table.

## Riesgos y reversión

- Todo el inventario es UI sobre mocks; no hay escritura en base.
- El stock se recalcula desde la bitácora al registrar movimientos, por lo que
  no puede quedar desincronizado por la UI.
- Revertir: `git revert` de los commits, o volver a
  `backup/inventory-consultations-2026-11-13`.
- El build usa `@app/ui` y dependencias de `dev`; si falta `node_modules`,
  ejecutar `npm install --legacy-peer-deps` en `dentistry/frontend` y
  `packages/ui`.

## Checklist para el revisor

- [ ] La bitácora no rompe los filtros, el scroll infinito ni el modal de alta.
- [ ] El stock mostrado coincide con la suma de movimientos en los 8 artículos.
- [ ] Registrar una salida mayor al stock se rechaza.
- [ ] Registrar un ajuste negativo actualiza el stock y la bitácora.
- [ ] El data-table mantiene búsqueda, orden, paginación y `getRowId`.
- [ ] No se introdujeron dependencias nuevas.
- [ ] `dev` y `main` no fueron modificados.

## Siguiente fase (requiere autorización)

1. Agregar `InventoryItem`/`InventoryMovement` al contrato con costo, lote,
   vencimiento y CHECKs.
2. `contract:emit` → `migration:plan` → revisar → `migrate` (solo con OK
   explícito) → `db:verify`.
3. Módulo backend de inventario siguiendo el patrón de `appointment`.
4. Cliente API en el frontend con fallback a mocks.
