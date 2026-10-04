# @app/db — Dueño único del contrato y las migraciones

Una sola base Neon. Dos schemas PostgreSQL:

| Schema       | Contenido                        | Antes     |
| ------------ | -------------------------------- | --------- |
| `core`       | Tablas del Core (10 modelos)     | `public`  |
| `dentistry`  | Tablas de la vertical odontología| `dentistry` |
| `public`     | Solo objetos del framework (`prisma_contract.marker`) | tablas Core |

## Reglas

1. **Solo este paquete** ejecuta el CLI de Prisma Next
   (`contract emit`, `migration plan`, `migrate`, `db verify`, ...).
   Los backends consumen tipos; nunca planifican ni aplican migraciones.
2. **Nunca** correr `db update` / `db sign` contra la base compartida.
3. Las referencias Core ↔ Dentistry son por `id` **sin FK físicas**
   entre schemas; cada vertical valida pertenencia en su API.
4. Los artefactos generados se versionan:
   `src/prisma/contract.json`, `src/prisma/contract.d.ts`,
   `migrations/**` (grafo, refs y snapshots).

## Estructura

```
prisma.config.ts            # ÚNICO config canónico (lee .env local)
src/prisma/schema.ts        # Contrato combinado en un solo archivo
                            # (el cargador del CLI no reescribe imports relativos)
src/prisma/generated/       # Artefactos del CLI: contract.json + contract.d.ts (output)
src/index.ts                # Re-exporta type Contract desde los artefactos generados
migrations/                 # grafo canónico + snapshots + refs (movido desde core/backend)
```

## Flujo de cambio

```bat
npm run contract:emit
npm run migration:plan -- --name <slug>
npm run migration:show
npm run migrate
npm run db:verify
```

## Build

`npm run build` requiere que exista `src/prisma/generated/contract.d.ts`
(generado por `contract:emit`). Solo emite declaraciones (`dist/`);
el runtime de los backends importa directamente
`@app/db/src/prisma/generated/contract.json`.

## Nota histórica: transición public → core

El planner no detecta "moves" de namespace y además deja `public`
fuera del alcance cuando el contrato no lo declara (sin drops). La
migración `20260825T1633_unify_core_schema_and_add_dentistry` fue
editada vía `fix-unify-migration.mjs`: las ops estructurales del lado
core se reemplazaron por ops `rawSql` con
`ALTER TABLE public."<Tabla>" SET SCHEMA core;`
(data-preserving; índices, constraints y secuencias propias viajan con
la tabla). Tras editar, siempre self-emit:

```bat
node migrations\app\<dir>\migration.ts
```

## Backends

```ts
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '@app/db';
import contractJson from '@app/db/src/prisma/generated/contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
```

Accesores por namespace: `db.orm.core.user`, `db.orm.dentistry.patient`,
`db.sql.core.<tabla>`, `db.sql.dentistry.<tabla>`.

## Seed

```bash
npm run db:seed
```

`scripts/seed.mjs` corre el seed de core (usuarios, organización, sede,
membresía) y termina invocado `scripts/copy-artifacts.mjs`.

La vertical odontológica tiene su propio seed, `scripts/seed-dentistry.sql`,
que se aplica **con `psql` y no con el CLI de Prisma Next** (crea el rol
`dentistry_app`, aplica los seeds de la vertical y copia los artefactos
compilados del backend). No tiene script propio: hay que invocarlo a mano
con `DATABASE_URL` apuntando a la base compartida.

## Estado actual de la base — desalineada, no la sincronices

**Instantánea del 2026-10-03. La regla 2 de arriba aplica con más fuerza
que nunca acá: no corras `db:update` / `db sign` para "arreglar" esto.**

El grafo local y la base viva no coinciden en las cuatro tablas de la
vertical odontológica:

| Tabla                     | `schema.ts` | `contract.json` | Base viva |
| ------------------------- | ----------- | --------------- | --------- |
| `inventory_items`         | presente    | **ausente**     | **ausente** |
| `inventory_movements`     | presente    | **ausente**     | **ausente** |
| `appointment_services`    | ausente     | ausente         | **presente** |
| `dental_service_supplies` | ausente     | ausente         | **presente** |

Lo que significa:

1. **`schema.ts` tiene `InventoryItem` e `InventoryMovement`, pero el
   contrato generado no.** El artefacto es viejo: nadie ha corrido
   `contract:emit` desde que se agregaron esos modelos. Por eso el frontend
   mock no tiene respaldo en la base, y por eso `Dentistry backend` compila
   contra tipos que no incluyen inventario.
2. **La base tiene dos tablas que el código ya no describe.**
   `appointment_services` y `dental_service_supplies` existen en Neon pero
   no hay `schema.ts`, ni contrato, ni migración que las produzca. Están
   huérfanas de una iteración anterior.
3. **`prisma_contract.marker` no coincide con el grafo local.** No hay
   ningún `marker.ts` en todo el historial de git, así que el marker vivo
   fue firmado **fuera** de estas migraciones. `db verify` fallen contra el
   grafo versionado y `migration:status` reporta divergencia.

Nada de esto se arregla con un `db:update`: eso firmaría el estado actual
como si fuera el deseado, congelando las dos tablas huérfanas dentro del
contrato y descartando la posibilidad de migrarlas a limpio.

Orden de resolución propuesto (requiere aprobación explícita):

1. Decidir el destino de `appointment_services` /
   `dental_service_supplies`: ¿se adoptan en `schema.ts` o se dropean?
2. Sólo entonces `contract:emit` para que el contrato incluya inventario.
3. Recién ahí `migration:plan` + `migrate`, que firmará un marker
   coherente con el grafo.

Mientras tanto, la vertical odontológica sigue desarrollándose **con mocks en el
frontend**. Los detalles del diseño de inventario están en
`dentistry/frontend/README.md`.
