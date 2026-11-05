import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";
import { Icons } from "./Icons";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Estado vacío responsivo y expansivo. Diseñado para ocupar todo el alto y ancho disponible de su contenedor padre (`w-full h-full flex-1 min-h-0 justify-center`) usando Flexbox dinámico sin position: absolute.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    message: "No hay registros disponibles",
    description: "Comienza agregando un nuevo elemento para comenzar a visualizarlo aquí.",
    action: (
      <Button size="sm" leftIcon={Icons.plus}>
        Agregar primer registro
      </Button>
    ),
  },
};

/**
 * EmptyState Expansivo en contenedor de altura fija / dinámica.
 * Demuestra cómo EmptyState ocupa el 100% del alto y ancho disponible y centra su contenido sin `position: absolute`.
 */
export const ExpansiveInContainer: Story = {
  render: () => (
    <div className="flex flex-col h-[420px] w-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="p-2 border-b border-[var(--border)] text-xs text-[var(--muted)] font-mono">
        Contenedor padre flex-col de 420px de altura
      </div>
      <EmptyState
        message="Bandeja de turnos clínicos vacía"
        description="No existen atenciones programadas para el intervalo de fechas seleccionado."
        icon={Icons.calendar}
        action={
          <Button size="sm" variant="primary" leftIcon={Icons.plus}>
            Agendar Nueva Cita
          </Button>
        }
      />
    </div>
  ),
};

/**
 * EmptyState con botón de reintento en caso de filtros sin coincidencias.
 */
export const SearchNoResults: Story = {
  render: () => (
    <div className="flex flex-col h-[320px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <EmptyState
        message="No se encontraron pacientes"
        description="Intenta modificar los términos de búsqueda o limpiar los filtros activos."
        icon={Icons.search}
        action={
          <Button size="sm" variant="outline">
            Limpiar filtros
          </Button>
        }
      />
    </div>
  ),
};
