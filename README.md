# Estándar de arquitectura frontend

Este documento define la estructura que deben seguir los frontends del
repositorio. `core/frontend` es la implementación de referencia.

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
│   │   └── (platform)/                # Grupo de rutas; no modifica la URL
│   │       ├── layout.tsx             # AppShell compartido
│   │       ├── dashboard/page.tsx     # /dashboard
│   │       ├── organizations/         # /organizations y subrutas
│   │       ├── users/                 # /users y subrutas
│   │       ├── roles/                 # /roles
│   │       └── settings/              # /settings
│   ├── config/                        # Configuración de navegación y aplicación
│   ├── features/                      # Capacidades funcionales del producto
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   ├── organization/
│   │   ├── user/
│   │   └── settings/
│   ├── infrastructure/                # API, entorno y adaptadores externos
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
├── components/    # Componentes exclusivos de la feature
├── data/          # Datos o mocks exclusivos de la feature
├── types/         # Tipos del dominio de la feature
├── utils/         # Utilidades exclusivas de la feature
└── views/         # Vistas completas consumidas por app/
```

## Responsabilidades

### `app`

Define rutas, layouts y composición. Los archivos `page.tsx` deben ser
delgados: importan una vista desde `features` y la renderizan. No deben contener
lógica de negocio ni implementaciones extensas de interfaz.

Las rutas principales son hermanas. `dashboard` no contiene a
`organizations`, `users`, `roles` o `settings`. Todas comparten el layout de
`(platform)` y su `AppShell`.

### `features`

Agrupa el código por capacidad funcional. Una feature contiene sus vistas,
componentes, tipos, datos y utilidades específicas. No se debe crear una
estructura paralela como `src/modules`.

### `shared`

Contiene elementos usados por dos o más features. No debe importar código desde
`features` ni desde `app`. Los componentes UI deben tener una única fuente de
verdad y no deben duplicarse por diferencias de mayúsculas y minúsculas.

### `infrastructure`

Contiene detalles de integración: clientes HTTP, endpoints, configuración de
entorno, persistencia y adaptadores externos. No contiene componentes visuales.

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
