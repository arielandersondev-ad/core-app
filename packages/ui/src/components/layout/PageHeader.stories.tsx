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
