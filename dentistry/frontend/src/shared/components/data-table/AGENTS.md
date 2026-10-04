# Data-Table — Guía arquitectónica

## Estructura actual

```
data-table/
├── index.ts                        # Barrel exports (solo DynamicTable + types)
├── types.ts                        # ColumnConfig, DynamicTableProps, ActionButton, etc.
├── dynamic-table.tsx               # Orquestador principal
├── components/
│   ├── data-table-avatar.tsx       # Iniciales + nombre
│   ├── data-table-status.tsx       # Badge de estado con color
│   ├── data-table-empty.tsx        # Estado vacío
│   ├── data-table-pagination.tsx   # Botones anterior/siguiente
│   ├── data-table-toolbar.tsx      # Búsqueda + toggle de columnas
│   └── data-table-actions.tsx      # Acciones por fila (botones o dropdown)
├── hooks/
│   ├── use-table-filter.tsx        # Filtrado por búsqueda
│   ├── use-table-sort.tsx          # Ordenamiento por columna
│   └── use-table-pagination.tsx    # Paginación del lado del cliente
└── utils/
    ├── format-date.ts              # Formateo de fechas (es-ES)
    ├── get-nested-value.ts         # Acceso a propiedades anidadas por string path
    └── get-density-class.ts        # Mapeo de densidad a clases de padding
```

## Bugs conocidos

### Corregidos en Fase 1

### 1. Rules of Hooks violado — RESUELTO

`useTablePagination` se llamaba dentro de un ternario. Ahora se llama siempre y
`showPagination` solo decide si se pintan los controles. De paso se corrigió el
página fuera de rango: `safePage = min(currentPage, totalPages)`, que antes
podía dejar la tabla vacía al filtrar estando en la última página.

### 2. `getNestedValue` duplicado 3 veces — RESUELTO

Los tres sites usan `utils/get-nested-value.ts`. Su firma es
`(obj: unknown, path: string): unknown`; los hooks castean donde hace falta.

### 3. `ColumnConfig.key` era `keyof T | string` — RESUELTO

Ahora es `keyof T`. Ningún consumidor usa rutas con punto; si alguna vez hace
falta, agregar `getRowId` y no re-abierta el tipo.

### 4. Row key usaba array index — RESUELTO

`resolveRowKey()` usa el prop `getRowId`, con fallback a `row.id` y finalmente
al índice. `row.id` se lee como `unknown`, sin castear `T`.

### 5. `quickFilters` era dead prop — RESUELTO

`quickFilters` + `quickFilterKey` filtran dentro de `useTableFilter` y se
pintan como chips en el toolbar. El chip activo se puede deseleccionar para
volver a "todo".

### Pendiente

- `<img>` en la columna `type: 'image'` dispara `@next/next/no-img-element`.
  No se migra a `next/image` hasta que haya `remotePatterns` configurados;
  con URLs remotas sin host permitido, `next/image` revienta en runtime.
- Los props `columns` / `visibleColumns` / `onToggleColumn` del toolbar siguen
  sin uso: es la infraestructura del toggle de visibilidad, pendiente del
  componente `dropdown-menu`.

---

## Nivel de personalización actual

| Aspecto | Estado | Escape hatch |
|---|---|---|
| Contenedor principal | Parcial | `className` en div externo |
| Celdas | Buena | `ColumnConfig.render(value, row)` |
| Sub-componentes | Ninguna | No aceptan `className`, no son exportados |
| Toolbar | Baja | Sin slot para acciones, placeholder hardcodeado |
| Colores | Depende del host | Usa tokens semánticos del theme del host |
| Locale | Hardcoded | ~15 strings en español, formatDate en `es-ES` |
| Modo controlado | No existe | Todo el estado es interno |
| Selección múltiple | No existe | — |
| Loading state | No existe | — |

---

## Roadmap de mejoras

### Fase 1: Corregir lo roto — COMPLETA
- [x] Fix Rules of Hooks en `useTablePagination`
- [x] Eliminar `getNestedValue` duplicado
- [x] Corregir `ColumnConfig.key` a `keyof T`
- [x] Agregar `getRowId` prop para key estable
- [x] Implementar `quickFilters`

### Fase 2: Sub-componentes exportables
- [ ] Exportar todos los sub-componentes y hooks desde `index.ts`
- [ ] Cada sub-componente acepta `className`
- [ ] `DataTableToolbar`: prop `placeholder`, slot `actions: ReactNode`
- [ ] `DataTablePagination`: prop `locale` para textos
- [ ] `DataTableEmpty`: props `icon: ReactNode`, `subtitle`
- [ ] `DataTableAvatar`: prop `size: "sm" | "md" | "lg"`

### Fase 3: Modo controlado
- [ ] Props opcionales: `currentPage`, `sortConfig`, `searchTerm`
- [ ] Callbacks: `onPageChange`, `onSortChange`, `onSearchChange`
- [ ] Patrón similar a `<input value={...} onChange={...}>`

### Fase 4: Slots y composición
- [ ] Props `header`, `footer`, `toolbar`, `empty`, `loading` como ReactNode
- [ ] Permite al consumidor reemplazar cualquier sección

### Fase 5: i18n
- [ ] Prop `locale` con defaults en español
- [ ] Mapa interno de strings traducidos
- [ ] `formatDate` recibe locale como parámetro

### Fase 6: Opciones visuales
- [ ] Props `striped`, `hoverable`, `bordered`
- [ ] `loading` state con skeleton
- [ ] `selectedRows` / `onSelectionChange`

---

## Qué funciona bien (no cambiar)

- Pipeline de datos: filter → sort → paginate
- Generic type parameter `<T>` propagado correctamente
- Directorio structure (components/, hooks/, utils/)
- Uso de `useMemo` en hooks
- `ColumnConfig.render` como punto de extensión
- `ActionButton.show` para visibilidad condicional por fila
- Uso de design tokens semánticos
- Sistema de densidad (`TableDensity`)
- Infraestructura de visibilidad de columnas (funcional, falta UI)
