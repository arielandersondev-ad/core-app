import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./PageHeader";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icons } from "../ui/Icons";

const meta: Meta<typeof PageHeader> = {
  title: "Layout/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: "Servicios y Tratamientos",
    description: "Catálogo de procedimientos clínicos, tarifas y duraciones estimadas.",
    badge: <Badge variant="primary">24 activos</Badge>,
    breadcrumbs: [
      { label: "Clínica", href: "#" },
      { label: "Configuración", href: "#" },
      { label: "Servicios" },
    ],
    action: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" leftIcon={Icons.filter}>
          Exportar
        </Button>
        <Button variant="primary" size="sm" leftIcon={Icons.plus}>
          Nuevo Servicio
        </Button>
      </div>
    ),
  },
};

/**
 * Las acciones ya no se ocultan en móvil: la fila principal apila título y
 * acciones, y cada acción ocupa el ancho disponible (`flex-1`) hasta `md`.
 */
export const AccionesEnMovil: Story = {
  args: {
    title: "María González",
    description: "Ficha clínica, datos de contacto y tratamientos activos.",
    badge: <Badge variant="neutral">En tratamiento</Badge>,
    breadcrumbs: [
      { label: "Pacientes", href: "#" },
      { label: "María González" },
    ],
    action: (
      <>
        <Button variant="ghost" size="sm" leftIcon={Icons.filter}>
          Filtrar
        </Button>
        <Button variant="outline" size="sm" leftIcon={Icons.calendar}>
          Agendar
        </Button>
        <Button variant="primary" size="sm" leftIcon={Icons.plus}>
          Nueva atención
        </Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Verifica el comportamiento responsive: en móvil las acciones se muestran debajo del título, a ancho completo y sin ocultarse.",
      },
    },
  },
};
