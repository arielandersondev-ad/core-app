# Dentistry — Frontend

Vertical odontológica de `core-app`. Next.js 16 + React 19 + Tailwind 4.
App Router, todo el contenido en español (Bolivia).

## Correr

```bash
npm install --legacy-peer-deps   # ver "Instalación" más abajo
npm run dev                      # http://localhost:3000
```

| Script          | Qué hace                                |
| --------------- | --------------------------------------- |
| `npm run dev`   | dev server en `:3000`                   |
| `npm run build` | build de producción                     |
| `npm run lint`  | ESLint                                  |
| `npm test`      | Vitest, 27 tests                        |

El backend es aparte (`dentistry/backend`, NestJS en `:3002`) y la URL de la
API se configura en `src/infrastructure/config/env.ts`, junto con los IDs de
organización / sede / membresía de CrowAnt.

## Estado de los módulos

Lo importante para no perder tiempo: **la mayoría de las vistas corren con
datos mock**. El backend sólo tiene API de `appointment` y
`clinical-encounter`.

| Ruta                        | Vista                | Datos     | Notas                                    |
| --------------------------- | -------------------- | --------- | ---------------------------------------- |
| `/dashboard`                | `ClinicDashboard`    | mock      |                                          |
| `/agenda`                   | `Agenda`             | **API**   | + `CreateAppointment`, `AppointmentDetail` |
| `/patients`                 | `Patients`           | mock      | + `CreatePatient`, `PatientDetail`        |
| `/treatments`               | `Treatments`         | mock      |                                          |
| `/treatments/consultations` | `Consultations`      | **API**   | crea `clinical-encounter`                 |
| `/inventory`                | `Inventory`          | mock      | con bitácora de movimientos               |
| `/payments`                 | `Payments`           | mock      |                                          |
| `/register-payment`         | `RegisterPayment`    | mock      | muta el array en memoria, no persiste     |

Consultas cuelga de la subpestaña de **Tratamientos**, no del sidebar: la
implementa `SectionTabs` (`src/shared/components/layout/section-tabs.tsx`) y
`/consultations` redirige a la ruta nueva.

## Convenciones

Las reglas detalladas están en [`AGENTS.md`](./AGENTS.md). Lo esencial:

**Dinero en minor units.** Los importes son enteros en minor units
(`15000` = Bs. 150.00) con `currency` al lado, igual que el contrato.
`formatCurrency()` **recibe minor units** y divide por 100; si le pasás
`150` imprime `Bs. 1.50`. Para texto del usuario usá `parseCurrency()`,
que acepta la coma decimal boliviana.

**Una sola fuente de mocks:** `src/shared/data/clinic-data.ts`.

**Instalación:** `npm install` pelado falla con
`Cannot read properties of null (reading 'edgesOut')` (bug de arborist con
peer deps). Usar `--legacy-peer-deps`. Sin diagnóstico todavía.

## Inventario

La vista `/inventory` está construida sobre los modelos `InventoryItem` e
`InventoryMovement` que ya existen en el contrato, aunque **las tablas aún no
existen en la base** (ver el estado de la BD en `packages/db/README.md`).

Incluye stock actual vs. mínimo, alertas por estado, bitácora de
movimientos por artículo (entrada / salida / ajuste) y una verificación de
cuadre entre el stock almacenado y la suma de movimientos.

### La desnormalización de "último reabasto"

`inventory_items` **no tiene** columna de última reposición en el esquema. El
mock la expone como `InventoryItem.lastRefill`, y hay dos caminos para el
backend:

1. **Denormalizar** `lastRestockAt` en `inventory_items` y mantenerla al
   escribir. Permite ordenar y filtrar por fecha sin join, a costa de una
   columna que puede desincronizarse.
2. **Calcularla por fila** con un lateral join sobre `inventory_movements`.
   Siempre correcta, pero paga el costo en cada listado de inventario.

El mock implementa la opción 1 y la **verifica en pantalla** contra el
ledger: al abrir un artículo, la bitácora contrasta el valor denormalizado
con el último `entrada` real y avisa si divergen. Hay tests que fijan
el invariante para que ningún cambio futuro rompa el acuerdo.

Los helpers que viven en `clinic-data.ts` y cubiertos por tests:
`signedQuantity()`, `stockFromMovements()`, `lastRestockAt()`.

Ojo: `InventoryMovement.quantity` es un `int` plano y la dirección vive en
`type`. El signo nunca se guarda, así que `signedQuantity()` es el único
lugar válido para leer cantidades — sumar `quantity` a mano suma dos veces
las salidas.

## Pendientes conocidos

- **No hay ningún artículo en estado `crítico`** en los datos mock, así que
  la alerta roja de stock crítico nunca se ve. Hay un test que lo recuerda.
- **La UI de pacientes está duplicada.** `features/patient/views/patient-page.tsx`
  no la importa nadie; la ruta usa `modules/clinic/views/Patients.tsx`. La
  huérfana usa `DynamicTable` y es nicer, pero perdió la navegación a la
  ficha. Hay que promover una o borrar la otra.
- **`modules/` vs `features/`**: el README de la raíz pide `src/features/`,
  dentistry usa `src/modules/`. Migración no hecha, a propósito.
- 6 errores de lint preexistentes: 3× `setState` dentro de `useEffect`,
  1× `any`, 2× entidades sin escapar en JSX.
- `<img>` en la columna `type: 'image'` del data-table dispara
  `@next/next/no-img-element`. No se migra a `next/image` hasta que haya
  `remotePatterns` configurados: con URLs remotas sin host permitido,
  `next/image` revienta en runtime.