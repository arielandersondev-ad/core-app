# @app/ui - Design System & Storybook

Design System compartido y catálogo visual unificado para las aplicaciones **Core** y **Dentistry** de `core-app`.

## 📦 Contenido

### 🎨 Design Tokens & Estilo
- Hoja de tokens unificada: `src/styles/tokens.css`
- Variables CSS para modo claro y oscuro (`.dark`)
- Compatibilidad nativa con Tailwind CSS v4 (`@theme inline`)
- Radio estandarizado `--radius: 0.75rem` idéntico para todos los verticales

### 🧩 Componentes UI
- **Button**: Variantes (`primary`, `secondary`, `outline`, `ghost`, `danger`), tamaños (`sm`, `md`, `lg`), estado de carga (`loading`), slots para `leftIcon` y `rightIcon`.
- **Icons**: Catálogo estandarizado de iconos vectoriales inline (`users`, `search`, `calendar`, `tooth`, `whatsapp`, etc.) con tamaños coherentes.
- **Input**: Tamaños (`sm`, `md`, `lg`), labels, hints, errores y slots para `leftIcon`/`rightIcon`.
- **Label**: Tipografía monospace estilizada y espaciado consistente.
- **Select**: Tamaños, mapeo de opciones, estados de error e indicador chevron.
- **Badge**: Variantes semánticas (`primary`, `success`, `warning`, `danger`, `neutral`, `role`), tamaños y punto indicador (`dot`).
- **Card**: Contenedor estándar con superficies y bordes sincronizados, soporte interactivo opcional (`onClick`).
- **StatCard**: Tarjeta de métricas con variantes (`default`, `success`, `warning`, `danger`, `accent`), valores responsivos y soporte interactivo.
- **Modal**: Diálogo accesible con backdrop desenfocado, header configurable (`title`, `subtitle`, `eyebrow`, `icon`), cierre con escape y backdrop.
- **Toggle**: Switch accesible con transición suave.
- **EmptyState**: Estado vacío con ilustración/icono, mensaje, descripción y botón de acción.
- **Separator**: Divisor con color de borde armonizado.
- **Avatar**: Generación automática de iniciales con asignación determinista de color.

### 📐 Primitivas de Layout
- **PageContainer**: Contenedor de página con espaciado responsivo (`p-4 sm:p-6 lg:p-8`) y anchos máximos consistentes.
- **PageHeader**: Encabezado unificado con soporte para migas de pan (breadcrumbs), títulos, badges descriptivos y botones de acción.
- **FilterToolbar**: Barra de herramientas con diseño flexible y responsivo para filtros y búsqueda.

---

## 🚀 Comandos

Desde la raíz del repositorio:
```bash
# Iniciar servidor de desarrollo de Storybook (puerto 6006)
npm run storybook

# Construir bundle estático de Storybook
npm run build-storybook
```

O directamente en el paquete:
```bash
cd packages/ui
npm run storybook
```
