# Estándar de arquitectura de la aplicación

Este documento define la estructura y las responsabilidades que deben seguir
el frontend, el backend y el paquete de base de datos. Las implementaciones de
referencia son `core/frontend`, `core/backend` y `packages/db`.

## Vista general del repositorio

```text
core-app/
├── core/
│   ├── frontend/        # Next.js, interfaz web y BFF
│   └── backend/         # NestJS, autorización y reglas de negocio
└── packages/
    └── db/              # Contrato y migraciones de PostgreSQL
```

La comunicación sigue esta dirección:

```text
Navegador
  → Next.js / BFF
  → NestJS
  → @app/db
  → PostgreSQL
```

El frontend nunca accede directamente a la base de datos. NestJS es la fuente
de verdad para autorización, validación final y reglas de negocio. El paquete
`@app/db` es el dueño del contrato persistente y de sus migraciones.

## Arquitectura frontend

## Convenciones de nombres

- Las carpetas se nombran en minúsculas y, si contienen varias palabras, en
  `kebab-case`.
- Los componentes reutilizables usan `PascalCase` (`Badge.tsx`, `Modal.tsx`).
- Los archivos reservados por Next.js mantienen sus nombres convencionales:
  `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` y `not-found.tsx`.
- Las vistas internas de una feature pueden usar `kebab-case` y el sufijo
  `-page.tsx`; el componente exportado siempre usa `PascalCase`.
- Los imports internos deben usar el alias `@/` en lugar de rutas relativas
  largas.
- npm y `package-lock.json` son el gestor y lockfile oficiales del frontend.

## Estructura de referencia

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Layout raíz: HTML, fuentes y estilos
│   │   ├── globals.css                # Tokens y estilos globales
│   │   ├── fonts.ts                   # Fuentes de la aplicación
│   │   ├── (public)/                  # Landing y acceso sin AppShell
│   │   │   ├── page.tsx               # Landing pública (/)
│   │   │   ├── landing/page.tsx       # Alias de la landing (/landing)
│   │   │   └── login/page.tsx         # Acceso administrativo (/login)
│   │   ├── (platform)/                # Grupo de rutas; no modifica la URL
│   │   │   ├── layout.tsx             # AppShell compartido
│   │   │   ├── dashboard/page.tsx     # /dashboard
│   │   │   ├── organizations/         # /organizations y subrutas
│   │   │   ├── users/                 # /users y subrutas
│   │   │   ├── roles/                 # /roles
│   │   │   └── settings/              # /settings
│   │   └── api/                       # Rutas autenticadas del mismo origen
│   ├── config/                        # Configuración de navegación y aplicación
│   ├── features/                      # Capacidades funcionales del producto
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   ├── organization/
│   │   ├── user/
│   │   └── settings/
│   ├── infrastructure/                # Cliente HTTP, sesión y TanStack Query compartidos
│   └── shared/                        # Código reutilizable entre features
│       ├── components/
│       │   ├── layout/                # AppShell, navbar y sidebar
│       │   └── ui/                    # Componentes visuales reutilizables
│       ├── data/                      # Datos compartidos o mocks transversales
│       ├── hooks/                     # Hooks compartidos
│       ├── navigation/                # Tipos y utilidades de navegación
│       └── utils/                     # Funciones puras reutilizables
├── package.json
└── package-lock.json
```

Cada feature puede contener únicamente las carpetas que necesite:

```text
features/<feature>/
├── api/           # Endpoints y claves de consulta propios de la feature
├── components/    # Componentes exclusivos de la feature
├── data/          # Datos o mocks exclusivos de la feature
├── hooks/         # Consultas y mutaciones de TanStack Query
├── schemas/       # Validación de formularios, cuando sea necesaria
├── services/      # Operaciones HTTP de la feature
├── types/         # Tipos del dominio de la feature
├── utils/         # Utilidades exclusivas de la feature
└── views/         # Vistas completas consumidas por app/
```

## Responsabilidades

### `app`

Define rutas, layouts y composición. Los archivos `page.tsx` deben ser
delgados: importan una vista desde `features` y la renderizan. No deben contener
lógica de negocio, peticiones HTTP ni implementaciones extensas de interfaz.
Los `app/api/**/route.ts` son entradas HTTP del mismo origen: leen la sesión,
reenvían únicamente las operaciones previstas al backend y devuelven respuestas
controladas. Son endpoints públicos y deben verificar la sesión; en operaciones
que modifican datos también se debe controlar el origen de la petición. La
autorización final permanece en el backend.

Las rutas principales son hermanas. `dashboard` no contiene a
`organizations`, `users`, `roles` o `settings`. Todas comparten el layout de
`(platform)` y su `AppShell`.

### `features`

Agrupa el código por capacidad funcional. Una feature contiene sus vistas,
componentes, tipos, datos y utilidades específicas. También contiene sus
`api/endpoints.ts`, servicios HTTP, hooks de TanStack Query y esquemas de
formularios cuando los necesite. No se debe crear una estructura paralela como
`src/modules` ni carpetas vacías para completar una plantilla.

- `api` nombra las rutas y las claves de consulta de la feature. Las claves
  incluyen todos los parámetros que cambian la respuesta.
- `services` ejecuta las peticiones y devuelve datos tipados; no maneja estado
  de React ni guarda tokens.
- `hooks` compone `useQuery` y `useMutation`, estados de carga, claves e
  invalidaciones. No duplica peticiones HTTP.
- `schemas` valida formularios. Se infieren los tipos del formulario a partir
  del esquema cuando sea posible. El backend valida de nuevo cada petición.
- `types` define los contratos de petición y respuesta. Las fechas recibidas
  como JSON son cadenas hasta que se transformen explícitamente.
- `components` contiene piezas visuales exclusivas de la feature; `views`
  compone la pantalla. Lo reutilizado por varias features va a `shared`.

### `shared`

Contiene elementos usados por dos o más features. No debe importar código desde
`features` ni desde `app`. Los componentes UI deben tener una única fuente de
verdad y no deben duplicarse por diferencias de mayúsculas y minúsculas.

### `infrastructure`

Contiene la infraestructura compartida: cliente HTTP, configuración de entorno,
sesión, proveedor de TanStack Query y adaptadores externos transversales. Las
rutas y operaciones HTTP exclusivas de una feature viven en esa feature. No
contiene componentes visuales de negocio.

El token de sesión permanece en la cookie HttpOnly. El cliente HTTP del
navegador llama a rutas del mismo origen en Next.js; estas rutas leen la cookie
y llaman al backend. No se expone el token al JavaScript del navegador. Cada
ruta de Next.js comprueba la sesión y el backend sigue siendo responsable de
validar el token y autorizar cada operación. La organización de carpetas y los
controles visuales no sustituyen estas verificaciones.

TanStack Query gestiona datos del servidor, caché, carga, errores e
invalidaciones. El estado de interfaz local permanece en React; si más adelante
se incorpora Zustand, se reserva para estado de interfaz compartido y no para
copiar respuestas de la API.

## BFF de autenticación

Next.js actúa como un **Backend for Frontend (BFF) delgado** entre el navegador
y NestJS. Su objetivo es mantener el token fuera del JavaScript del navegador,
no replicar el backend de negocio.

```text
Navegador
  └── cookie HttpOnly: crowant_session=<JWT>
          ↓ petición al mismo origen (/api/**)
Next.js BFF
  └── lee el JWT de la cookie en el servidor
  └── lo reenvía como Authorization: Bearer <JWT>
          ↓
NestJS
  └── verifica el JWT y aplica autorización y reglas de negocio
```

El JWT no se transforma ni se genera de nuevo: conserva el mismo valor. El BFF
solo cambia su mecanismo de transporte, de una cookie `HttpOnly` recibida desde
el navegador al esquema `Bearer` esperado por NestJS.

### Responsabilidades del BFF

- Crear, leer y eliminar la cookie de sesión.
- Mantener el token inaccesible al JavaScript del navegador.
- Reenviar hacia un backend fijo y configurado mediante `API_URL` únicamente
  rutas, métodos y cuerpos expresamente permitidos.
- Añadir el encabezado `Authorization: Bearer <JWT>` en las llamadas a NestJS.
- Aplicar controles propios de la frontera web, como verificación de sesión,
  origen y protección CSRF en operaciones que modifican datos.
- Traducir fallos técnicos de conexión sin exponer información interna.
- Componer varias respuestas solo cuando una pantalla tenga una necesidad real
  y específica.

### Fuera del alcance del BFF

El BFF no debe contener reglas de negocio, consultar directamente la base de
datos, decidir permisos ni duplicar DTO, validaciones o controladores de NestJS.
NestJS continúa siendo la única fuente de verdad para autenticación final,
autorización, validación de datos y lógica de negocio.

Las operaciones CRUD ordinarias deben pasar por un mecanismo común de proxy
autenticado y restringido, en lugar de crear una réplica manual de cada endpoint
del backend. Las rutas BFF específicas se reservan para login, logout,
renovación de sesión, composición de respuestas o tratamientos que realmente
sean propios del frontend.

En este documento, **BFF** nombra el patrón arquitectónico, **proxy de API**
describe la función de reenviar solicitudes y **middleware** identifica una
pieza interna del procesamiento. Un middleware puede formar parte del BFF, pero
no son términos equivalentes.

### `config`

Centraliza configuración estable de la aplicación, como los elementos y rutas
de navegación.

## Dirección de dependencias

```text
app ────────────> features ────────────> shared
 │                    │                    ▲
 ├────────────────────┴────────────────────┘
 └──────────────> config / infrastructure
```

- `app` puede importar desde `features`, `shared`, `config` e `infrastructure`.
- `features` puede importar desde `shared` e `infrastructure`.
- `shared` no puede depender de una feature concreta.
- Las features no deben acoplarse entre sí; lo transversal se extrae a
  `shared`.

## Enrutado principal

| URL | Vista |
| --- | --- |
| `/` | Landing pública de CrowAnt |
| `/landing` | Alias de la landing |
| `/login` | Acceso administrativo |
| `/dashboard` | Dashboard |
| `/organizations` | Organizaciones |
| `/users` | Usuarios |
| `/roles` | Roles y permisos |
| `/settings` | Configuración |

Las rutas dinámicas permanecen dentro de su recurso. Por ejemplo,
`/organizations/org-1` corresponde a
`app/(platform)/organizations/[id]/page.tsx`.

## Regla para nuevas funcionalidades

1. Crear o ampliar la feature correspondiente en `src/features`.
2. Colocar en `shared` únicamente lo que tenga consumidores en varias features.
3. Crear en `app` una página delgada que renderice la vista de la feature.
4. Registrar la navegación en `src/config/navigation.ts`, si corresponde.
5. Validar con `npm run lint`, TypeScript y `npm run build`.

Para una nueva petición, agregar su ruta a `features/<feature>/api`, la operación
HTTP a `services` y, si la consume una vista interactiva, un hook de TanStack
Query. Crear una ruta `app/api` cuando el navegador necesite acceder al backend
sin exponer la cookie HttpOnly. No agregar estas capas si la feature todavía no
las utiliza.

## Flujo frontend de referencia: creación de organizaciones

La creación de organizaciones muestra cómo distribuir un flujo interactivo sin
mezclar interfaz, validación, estado del servidor y transporte HTTP.

```text
CreateOrganizationButton
  → CreateOrganizationDialog
  → OrganizationStep / RolesStep / BranchesStep
  → React Hook Form + Zod
  → useCreateOrganizationWizard
  → useCreateOrganizationSetup
  → organizationService
  → Axios: POST /api/organizations/setup
  → proxy autenticado de Next.js
  → POST /organizations/setup en NestJS
```

La feature sigue esta estructura:

```text
features/organization/
├── api/
│   └── endpoints.ts                         # Rutas y claves de consulta
├── components/
│   ├── create-organization-button.tsx       # Abre el flujo
│   ├── create-organization-dialog.tsx       # Compone el asistente
│   ├── create-organization-wizard-*.tsx     # Navegación y acciones
│   └── forms/
│       ├── organization-step.tsx            # Datos de la organización
│       ├── roles-step.tsx                   # Roles iniciales
│       └── branches-step.tsx                # Sucursales iniciales
├── hooks/
│   ├── use-organizations.ts                 # Query y mutación del servidor
│   └── use-create-organization-wizard.ts    # Estado local del asistente
├── schemas/
│   └── organization-setup.schema.ts         # Validación y transformación
├── services/
│   └── organization.service.ts              # Operaciones HTTP tipadas
├── types/
│   ├── organization.ts                      # Entidad de organización
│   ├── organization-list.ts                 # Respuesta del listado
│   └── organization-setup.ts                # Tipos inferidos y valores iniciales
└── views/
    └── organizations-page.tsx               # Composición de la pantalla
```

React Hook Form administra el estado, los errores y el envío de los formularios,
pero no proporciona estilos ni impone componentes visuales. Los elementos HTML
y sus clases siguen perteneciendo a la aplicación. Zod centraliza las reglas de
cada paso, convierte valores como latitud y longitud a números e infiere el tipo
del payload para evitar contratos duplicados.

`useCreateOrganizationWizard` solo controla el paso actual y los datos
acumulados. TanStack Query controla la mutación, sus estados y la invalidación
del listado. El servicio se limita al transporte HTTP. Las validaciones del
frontend mejoran la experiencia, pero NestJS siempre vuelve a validar la
petición.

No se deben crear abstracciones visuales genéricas como `FormInput` o
`FormField` hasta que exista un sistema de diseño estable o varios consumidores
con la misma necesidad. Separar lógica no obliga a anticipar una biblioteca UI.

## Arquitectura backend

El backend se organiza por módulos funcionales. `modules/role` es la referencia
para crear o ampliar un módulo.

```text
src/modules/role/
├── application/
│   ├── contracts/          # Formas de salida propias de los casos de uso
│   ├── mappers/            # Transformaciones de aplicación
│   └── use-case/           # Orquestación de cada operación
├── domain/
│   ├── entities/           # Entidades y tipos del negocio
│   ├── errors/             # Errores expresivos del dominio
│   ├── repositories/       # Contratos abstractos de persistencia
│   └── value-objects/      # Reglas de valores como códigos y permisos
├── infrastructure/
│   ├── prisma-*.repository.ts # Lecturas que implementan contratos
│   ├── prisma-*.writer.ts     # Escrituras reutilizables y transacciones
│   └── role.mapper.ts         # Conversión entre persistencia y dominio
├── presentation/
│   ├── dto/                # Validación de entrada HTTP
│   └── http/               # Controllers, rutas, guards y decoradores
└── role.module.ts          # Composición e inyección de dependencias
```

Cada capa tiene una responsabilidad definida:

- `presentation` traduce HTTP a una entrada válida para la aplicación. Define
  rutas, parámetros, DTO, guards y códigos de respuesta; no implementa reglas de
  negocio ni accede a Prisma.
- `application` contiene casos de uso. Coordina entidades, repositorios y
  transacciones, pero no conoce controllers, cookies ni detalles HTTP.
- `domain` contiene conceptos y contratos del negocio. No depende de NestJS,
  Prisma ni de la forma de transporte.
- `infrastructure` implementa los contratos definidos por el dominio mediante
  Prisma u otros proveedores externos.
- `*.module.ts` es la raíz de composición del módulo: registra controllers,
  casos de uso y la implementación concreta de cada dependencia abstracta.

La dirección de dependencias es:

```text
presentation ──> application ──> domain
                         ▲           ▲
                         │           │
                    composición  infrastructure
```

`infrastructure` depende de los contratos del dominio; el dominio nunca conoce
la implementación Prisma. El módulo de NestJS conecta ambos mediante
`provide/useClass` o el mecanismo de inyección apropiado.

### Flujo backend de referencia: listado de roles

```text
GET /role/get-list-org?organizationId=<uuid>
  → JwtAuthGuard
  → CoreAccessGuard
  → @RequireCoreAccess('roles:read')
  → ListRolesQueryDto
  → ListRolesByOrganizationScopeUseCase
  → RoleRepository
  → PrismaRoleRepository
  → @app/db
  → PostgreSQL
```

El controller recibe y valida la petición, y después delega. El caso de uso
decide qué operación del dominio ejecutar. `RoleRepository` expresa lo que la
aplicación necesita sin imponer Prisma. `PrismaRoleRepository` traduce esa
necesidad al acceso persistente.

Para una escritura, como `POST /role/create`, se mantiene la misma separación:
el DTO valida el borde HTTP, el guard exige `roles:create`, el caso de uso aplica
las reglas y un writer o repositorio realiza la persistencia. Las operaciones
que deban ser atómicas se ejecutan en una transacción dentro de infraestructura,
no desde el controller.

### Reglas para módulos backend

1. Crear el módulo dentro de `src/modules/<feature>`.
2. Definir primero los conceptos y contratos necesarios en `domain`.
3. Crear un caso de uso por operación significativa en `application/use-case`.
4. Validar la entrada externa con DTO en `presentation/dto`.
5. Mantener controllers delgados y protegidos por autenticación y permisos.
6. Implementar persistencia y adaptadores en `infrastructure`.
7. Registrar dependencias abstractas y concretas en el módulo de NestJS.
8. No retornar modelos Prisma directamente si el contrato público requiere una
   forma diferente; usar un mapper o contrato de salida.

## Arquitectura de base de datos

`packages/db` es el dueño único del esquema, los contratos generados y las
migraciones de la base compartida. El backend lo consume como la dependencia
local `@app/db`.

```text
packages/db/
├── src/
│   ├── index.ts                    # Exportaciones públicas del paquete
│   └── prisma/
│       ├── schema.ts               # Definición del esquema
│       └── generated/              # Contrato generado
├── migrations/
│   ├── app/                        # Migraciones versionadas
│   └── snapshots/                  # Contratos históricos verificables
├── prisma.config.ts                # Configuración de Prisma
└── scripts/copy-artifacts.mjs      # Empaquetado de artefactos generados
```

```text
packages/db ──> @app/db ──> core/backend
```

- Los cambios del esquema y las migraciones se realizan en `packages/db`.
- El backend consume el contrato publicado por `@app/db`; no mantiene una
  segunda definición de las tablas.
- El frontend no importa `@app/db` ni conoce modelos de persistencia.
- Una migración debe revisarse antes de aplicarse y conservarse en control de
  versiones junto con su contrato.
- La versión de PostgreSQL debe documentarse en la configuración de despliegue
  cuando esta quede definida; no se debe inferir desde el cliente Prisma.

Los comandos principales del paquete son:

| Comando | Responsabilidad |
| --- | --- |
| `npm run build` | Compila el paquete y copia sus artefactos |
| `npm run contract:emit` | Genera el contrato Prisma |
| `npm run db:init` | Inicializa la base administrada por Prisma |
| `npm run db:update` | Actualiza el estado de la base |
| `npm run db:verify` | Verifica que contrato y base sean compatibles |
| `npm run migration:plan` | Prepara y permite revisar una migración |
| `npm run migration:status` | Consulta el estado de las migraciones |
| `npm run migrate` | Aplica las migraciones previstas |

## Dependencias por aplicación y paquete

Las versiones de esta sección reflejan los manifiestos actuales. Cuando una
dependencia cambie, se debe actualizar su `package.json`, el lockfile
correspondiente y esta documentación en el mismo cambio.

### Frontend (`core/frontend`)

| Dependencia | Versión | Responsabilidad |
| --- | --- | --- |
| Next.js | `16.3.1` | Enrutado, renderizado, Server Actions y BFF |
| React / React DOM | `19.2.8` | Composición y estado de la interfaz |
| TanStack Query | `5.100.14` | Caché, queries, mutaciones e invalidaciones |
| Axios | `1.20.0` | Cliente HTTP del navegador hacia `/api` |
| React Hook Form | `^7.88.0` | Estado y envío eficiente de formularios |
| Zod | `^4.6.5` | Validación, transformación e inferencia de tipos |
| Hook Form Resolvers | `^5.9.1` | Integración entre React Hook Form y Zod |
| Tailwind CSS | `^4` | Utilidades visuales y sistema de estilos |
| TypeScript | `^5` | Tipado y verificación estática |
| ESLint / eslint-config-next | `^9` / `16.3.1` | Calidad y convenciones del código |

### Backend (`core/backend`)

| Dependencia | Versión | Responsabilidad |
| --- | --- | --- |
| NestJS | `11.0.1` | Framework HTTP, módulos e inyección de dependencias |
| `@app/db` | `file:../../packages/db` | Contrato local de persistencia compartido |
| Prisma ORM PostgreSQL | `8.0.0-rc.4` | Acceso tipado a PostgreSQL |
| class-validator | `0.15.1` | Validación declarativa de DTO |
| class-transformer | `0.5.1` | Normalización y transformación de entradas |
| jose | `^5.10.0` | Firma y verificación de JWT |
| bcryptjs | `^3.0.3` | Hash y verificación de contraseñas |
| RxJS | `7.8.1` | Primitivas reactivas utilizadas por NestJS |
| dotenv | `17.4.2` | Carga de configuración de entorno |
| TypeScript | `5.9` | Compilación y tipado del backend |
| ESLint / Prettier | `9.18.0` / `3.4.2` | Calidad y formato del código |
| Prisma CLI | `7.9.1` | Herramientas locales del backend, incluido Studio |

### Base de datos (`packages/db`)

| Dependencia | Versión | Responsabilidad |
| --- | --- | --- |
| PostgreSQL | Definida por despliegue | Motor relacional de la aplicación |
| Prisma ORM PostgreSQL | `8.0.0-rc.4` | Contrato de acceso al motor PostgreSQL |
| Prisma CLI | `8.0.0-rc.6` | Contratos, operaciones de base y migraciones |
| Prisma CLI Engine | `0.2.0` | Motor utilizado por las herramientas Prisma |
| dotenv | `17.4.2` | Configuración local del paquete |
| TypeScript | `5.9` | Compilación del contrato de base de datos |

Las dependencias marcadas como `rc` son versiones candidatas. Deben actualizarse
de forma coordinada entre `packages/db` y los consumidores; no se debe cambiar
una versión de Prisma de manera aislada.

## Flujo transversal de una petición

```text
Interfaz de la feature
  → validación React Hook Form + Zod
  → mutación de TanStack Query
  → servicio HTTP
  → BFF de Next.js y cookie HttpOnly
  → guard de autenticación de NestJS
  → guard de autorización
  → DTO y transformación de entrada
  → caso de uso
  → contrato de repositorio
  → implementación Prisma
  → @app/db
  → PostgreSQL
```

La validación existe en más de una frontera con objetivos distintos: el
frontend ofrece respuesta inmediata al usuario y el backend protege el sistema
frente a cualquier cliente. Los tipos TypeScript no sustituyen la validación en
tiempo de ejecución.

## Checklist para nuevas funcionalidades

### Frontend

- Ubicar la capacidad dentro de la feature correcta.
- Declarar endpoints y claves de TanStack Query con todos sus parámetros.
- Mantener servicios HTTP sin estado de React ni acceso a tokens.
- Inferir tipos desde Zod cuando el esquema represente el contrato completo.
- Separar estado local de interfaz y estado remoto del servidor.
- Registrar la operación permitida en el proxy BFF cuando corresponda.
- Comprobar estados de carga, error, vacío y éxito.

### Backend

- Proteger el endpoint con autenticación y permiso explícito.
- Validar y transformar toda entrada mediante DTO.
- Delegar la operación desde el controller a un caso de uso.
- Definir contratos abstractos para persistencia o servicios externos.
- Implementar esos contratos en infraestructura y registrarlos en el módulo.
- Usar transacciones para cambios que deban confirmarse de forma atómica.
- Añadir pruebas para reglas, permisos y casos de error relevantes.

### Base de datos

- Modificar el esquema únicamente desde `packages/db`.
- Generar y revisar el plan de migración antes de aplicarlo.
- Verificar el contrato y conservar migraciones y snapshots.
- Actualizar `@app/db` en los consumidores cuando cambie el contrato.
- No exponer modelos de base de datos directamente al frontend.

### Verificación

- Ejecutar lint y comprobación de TypeScript en la aplicación modificada.
- Ejecutar las pruebas del backend afectado.
- Ejecutar el build de frontend y backend.
- Verificar manualmente el flujo completo a través del BFF.
