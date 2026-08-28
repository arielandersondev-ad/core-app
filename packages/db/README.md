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
