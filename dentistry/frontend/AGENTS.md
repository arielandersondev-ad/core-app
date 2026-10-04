<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Dinero: siempre en minor units

La clínica cobra en bolivianos. Los importes se guardan y se transportan
**como enteros en minor units**, nunca como float en unidades mayores. Esto
es lo que hace el contrato (`DentalService.basePriceMinor`,
`Treatment.agreedPriceMinor`, `Payment.amountMinor`, todos con `currency`
al lado).

```ts
// NO
const price = 150;

// SÍ
const basePriceMinor = 15000; // Bs. 150.00
```

Los helpers viven en `src/shared/data/clinic-data.ts` y son la única vía
aceptada para cruzar el límite:

| Helper                   | Para qué                                        |
| ------------------------ | ----------------------------------------------- |
| `toMinorUnits(major)`    | bolivianos → minor units                        |
| `fromMinorUnits(minor)`  | minor units → bolivianos                        |
| `formatCurrency(minor)`  | formatea; **recibe minor units**, no bolivianos   |
| `parseCurrency(input)`   | texto del usuario → minor units; acepta `,`      |

`formatCurrency` divide por 100. Si le pasás `150` imprime `Bs. 1.50`.
`parseCurrency` acepta la coma decimal boliviana (`"150,50"`).

`toMinorUnits` usa la forma exponencial a propósito:
`Math.round(1.005 * 100)` da `100` y no `101`, porque 1.005 se guarda
ligeramente por debajo y el producto cae en 100.49999999999999.
`Number(\`\${major}e2\`)` sí redondea bien. Hay tests que lo cubren; no lo
simplifiques a `Math.round(major * 100)`.

## Datos mock: una sola fuente

Todo el dataset de demostración está en **`src/shared/data/clinic-data.ts`**.
No crees un segundo archivo de mocks: antes había dos y el huérfano tenía
datos peruanos (`S/`, +51, Lima), lo que producía moneda y teléfonos
equivocados en pantalla.

La UI consume mocks; el backend sólo tiene endpoints de `appointment` y
`clinical-encounter`. Todo lo demás es mock hasta que exista su API. Al
conectar una vista, cambia el origen de los datos, no la forma de la vista:
los mocks ya tienen la misma forma que el contrato.

## Tests

Vitest 4.1.11 (misma versión que `core/backend`). Correr con `npm test`.
El alias `@/*` se resuelve de forma nativa vía `resolve.tsconfigPaths` en
`vitest.config.mts`; no agregues `vite-tsconfig-paths`.

Cuando toques helpers de dinero o el ledger de inventario, actualiza
`src/shared/data/__tests__/`. Ahí viven los invariantes que no son
obvios a simple vista: que el ledger cuadre con el stock, y que el
`lastRefill` denormalizado coincida con el último `entrada` real.

## Instalación: `npm install` está roto

Un `npm install` pelado falla con
`Cannot read properties of null (reading 'edgesOut')` en `#loadPeerSet`
(un bug de arborist con peer deps). Usar `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

No está diagnosticado. Si lo arreglás, quitá la nota.

## Estructura: hay una migración a medio hacer

El README de la raíz define `src/features/` como estándar. Dentistry usa
`src/modules/clinic/`. Hoy conviven:

- `src/modules/clinic/views/*` — lo que las rutas importan de verdad
- `src/features/patient/views/patient-page.tsx` — **huérfana**, nadie la
  importa; es la única que usa `DynamicTable`

No agregues vistas nuevas en `modules/`. Al tocar pacientes, decidí primero
si se promueve `features/patient` a canónico o se borra la huérfana; no
construyas una tercera variante. Borrar la huérfana es preferible a dejarla
flotando si no vas a migrar.

## Componentes

`src/shared/components/data-table/` tiene su propio `AGENTS.md` con el
roadmap por fases y los bugs conocidos. Leelo antes de tocarlo.
