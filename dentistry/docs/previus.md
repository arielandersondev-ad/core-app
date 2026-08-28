Sí. Con toda esta información, ya podemos identificar con bastante precisión el problema, y hay una corrección importante respecto a lo que te indiqué antes:

namespace: 'dentistry' en tu schema.ts NO crea un migration space llamado dentistry.

Tu prueba lo demuestra:

npx prisma-cli migration status --space dentistry
→ MIGRATION.SPACE_NOT_FOUND
→ Pick one of: app

Eso es correcto según el funcionamiento actual de Prisma 8: los contract spaces de migración son lanes de migración, definidos por la estructura migrations/<space>/; no son lo mismo que los namespaces SQL de tus modelos. Prisma documenta que los espacios adicionales aparecen principalmente con extensiones, mientras que el espacio de aplicación es app.

Lo que realmente tienes ahora

Tu arquitectura es esta:

                     MISMA DATABASE NEON
                            │
                            ▼
                    PostgreSQL database
                           "dev"
                            │
              ┌─────────────┴─────────────┐
              │                           │
           Core                       Dentistry
              │                           │
        namespace ?                 namespace dentistry
              │                           │
           public                     ¿dentistry?
              │
      ┌───────┴────────┐
      │                │
 Organization       Membership
 Branch             User
 ...

Pero el sistema de migraciones Prisma está viendo otra cosa:

dentistry/backend/migrations/
└── app/
    └── 20260824T2020_init_dentistry
        ∅ → 88664fc

Por eso:

migration graph

1 space(s)
2 contracts
1 migration

Y ese único space es:

app
El dato más importante que acabas de proporcionar

La tabla:

prisma_contract.marker

contiene:

{
  "space": "app",
  "core_hash": "e895710bb8af14d332edc7b921da8bccdf0a24bec3aee590d47ff063fc4d2598",
  "profile_hash": "3916f444a8a17ad749191acf9e08dad97d1a327b88c2f1d45d12f240296aa8b2",
  ...
}

Es decir:

DATABASE
└── prisma_contract
    └── marker
        └── space = app
            └── core_hash = e895710...

Y Core confirma exactamente ese estado:

core migration status

○ e895710 @contract @db (db)

○ 918d188
│↑ 20260823T2239_baseline ∅ → 918d188 13 ops

○ ∅

✔ Up to date

Por tanto:

Core está correctamente posicionado en e895710

No debemos tocar eso.

Y Dentistry está intentando entrar por la misma puerta

Dentistry tiene:

88664fc @contract
│↑ 20260824T2020_init_dentistry ∅ → 88664fc 67 ops

Pero la base dice:

app → e895710

Mientras Dentistry tiene una historia local que empieza en:

∅ → 88664fc

Entonces Prisma pregunta:

"Estoy en e895710, ¿cómo llego a 88664fc?"

Y la respuesta es:

NO EXISTE UNA RUTA

porque tu historia de Dentistry es:

∅
│
└── 88664fc

y la historia de Core es:

∅
│
└── 918d188
      │
      └── e895710

Son dos grafos diferentes.

Esto explica perfectamente el error

Dentistry:

migration status

produce:

○ 88664fc @contract

│↑ 20260824T2020_init_dentistry
   ∅ → 88664fc

⚠ Database marker e895710bb8af is not in the on-disk migration graph

No es que Prisma esté confundiendo public con dentistry.

Es que el migration graph de Dentistry no contiene el estado desde el cual está actualmente la base.

Y aquí hay otro detalle MUY importante

Tu schema.ts tiene:

const NAMESPACE = 'dentistry' as const;

y luego:

model('Patient', {
  namespace: NAMESPACE,
  ...
})

Eso es correcto para indicar que los modelos pertenecen al namespace/espacio de almacenamiento dentistry según tu contrato.

Pero eso no significa:

migrations/dentistry/

El CLI considera los directorios bajo migrations/ como los contract spaces de migración. De hecho, tu propio CLI lo confirma:

Pick one of: app

y:

No directory named "dentistry" exists under the migrations root.

Eso coincide con la documentación de Prisma 8: --space selecciona un espacio de migración y esos espacios corresponden a lanes bajo migrations/<space>/.

Entonces tenemos dos conceptos diferentes

Esto es fundamental:

1. Namespace del contrato

En tu Dentistry:

const NAMESPACE = 'dentistry';

Esto está relacionado con dónde viven las entidades/tablas del contrato.

2. Migration space

Actualmente:

migrations/app/

Esto es la lane de migraciones.

No son equivalentes.

Tu objetivo real

Por lo que has mostrado, entiendo que quieres esto:

NEON
│
└── dev
    │
    ├── public
    │   ├── User
    │   ├── Organization
    │   ├── Branch
    │   ├── Membership
    │   └── ...
    │
    └── dentistry
        ├── patients
        ├── clinical_histories
        ├── dental_services
        ├── treatments
        ├── appointments
        ├── clinical_encounters
        ├── payments
        ├── clinical_files
        └── radiographs

Y además:

CORE
migration history
    ↓
e895710
    ↓
public

mientras Dentistry debería poder administrar:

DENTISTRY
migration history
    ↓
88664fc
    ↓
dentistry

sin que Dentistry modifique las tablas Core.

Ese diseño es razonable.

Pero no podemos conseguirlo simplemente poniendo:

namespace: 'dentistry'

porque el problema actual está en la identidad/historial de migraciones.

Lo que NO debemos hacer

Con la información actual, yo no ejecutaría:

npx prisma-cli db sign

en Dentistry.

Porque estaríamos diciendo:

"La base de datos ya corresponde exactamente al contrato Dentistry."

Y claramente no es así: actualmente la base contiene solamente las tablas Core que mostraste:

AuditLog
Authorization
Branch
Membership
MembershipBranch
MembershipRole
Organization
Role
Session
User

No aparecen:

patients
clinical_histories
dental_services
treatments
appointments
...

Por tanto, firmar la base como Dentistry sería incorrecto.

Tampoco ejecutaría todavía:

npx prisma-cli db update

porque el CLI ya te está indicando que su punto de partida no está en el graph de Dentistry.

Y tampoco:

npx prisma-cli migrate

por la misma razón.

Tampoco debemos modificar Core

Tu Core está perfecto:

e895710 @contract @db

y:

✔ Up to date

Así que yo tomaría esto como una restricción absoluta:

CORE
e895710
↓
NO TOCAR

La documentación de Prisma describe precisamente el marker como la identidad que permite comprobar que el contrato y la base están alineados.

Lo siguiente que necesitamos averiguar

Hay una pregunta técnica que todavía tenemos que resolver antes de tocar nada:

¿Cómo quiere Prisma 8 RC.6 representar múltiples contratos independientes sobre la misma base de datos?

Porque tu situación no es simplemente:

una aplicación
una migración

sino:

Core contract
        +
Dentistry contract
        +
misma DATABASE_URL
        +
diferentes namespaces/storage

Y eso es precisamente donde no quiero darte una solución inventada basada en Prisma 7 o en una versión distinta del CLI.

Además, tu versión:

@prisma/cli       8.0.0-rc.6
@prisma/cli-engine 0.2.0
@prisma/orm-postgres 8.0.0-rc.4

es una combinación concreta que ya tienes validada, así que no voy a recomendar cambiar versiones.

La documentación actual confirma que Prisma 8 maneja contract spaces, pero también deja claro que el app es el espacio principal y que los espacios adicionales están asociados al mecanismo de extensiones.

Mi diagnóstico actual

En una frase:

El problema NO está en tu prisma.config.ts, ni en las versiones, ni en que falte namespace: dentistry. El problema es que Dentistry tiene creado un nuevo migration graph ∅ → 88664fc dentro del único space app, mientras que la misma base ya está marcada en app → e895710 por Core.

Visualmente:

                  MISMO DATABASE
                       │
                       ▼
             prisma_contract.marker
                       │
                  space = app
                       │
                 e895710...
                       ▲
                       │
              ┌────────┴────────┐
              │                 │
            CORE            DENTISTRY
              │                 │
       918d188 → e895710     ∅ → 88664fc
              │                 │
              └─────── X ──────┘
                     no path

Y esto explica exactamente todos los resultados que acabas de obtener.

Lo bueno

Tu contrato Dentistry en sí mismo está planteado correctamente para el aislamiento lógico:

namespace: 'dentistry'

y, además, deliberadamente no tienes FKs hacia Core. Eso es consistente con tu arquitectura.

Lo que falta

Necesitamos definir la estrategia correcta de migración para dos contratos independientes que comparten la misma base, no intentar arreglarlo con db:sign.

Si quieres, el siguiente paso que haría es revisar la estructura exacta de dentistry/backend/migrations y core/backend/migrations, especialmente los archivos de 20260824T2020_init_dentistry y 20260823T2239_baseline. Con eso podemos determinar si ese init_dentistry se puede reconstruir como una migración válida para el estado existente sin tocar Core y sin perder el historial.
