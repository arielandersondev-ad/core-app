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

### 1. Rules of Hooks violado (`dynamic-table.tsx:81-88`)

```tsx
// PROBLEMA: llamada condicional de hook
const paginatedData = showPagination
  ? useTablePagination(sortedData, currentPage, pageSize)
  : sortedData;

// FIX: llamar siempre, controlar visualmente
const paginatedData = useTablePagination(sortedData, currentPage, pageSize);
// Luego usar showPagination para decidir si mostrar controles, no si computar
```

### 2. `getNestedValue` duplicado 3 veces

- `utils/get-nested-value.ts`
- `hooks/use-table-sort.tsx` (líneas 5-12)
- `hooks/use-table-filter.tsx` (líneas 5-12)

**Fix:** Los hooks deben importar del util compartido.

### 3. `ColumnConfig.key` es `keyof T | string`

El `| string` anula la seguridad de tipos. Debería ser `keyof T` para que TypeScript valide las keys.

### 4. Row key usa array index

`key={rowIndex}` causa bugs de reconciliación. Debería usarse un `getRowId` prop.

### 5. `quickFilters` — dead prop

Definido en `types.ts:99` pero nunca consumido en `dynamic-table.tsx`.

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

### Fase 1: Corregir lo roto
- [ ] Fix Rules of Hooks en `useTablePagination`
- [ ] Eliminar `getNestedValue` duplicado
- [ ] Corregir `ColumnConfig.key` a `keyof T`
- [ ] Agregar `getRowId` prop para key estable

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
