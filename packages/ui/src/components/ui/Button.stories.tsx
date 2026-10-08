import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { Icons } from "./Icons";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "outline"],
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Guardar cambios",
    variant: "primary",
    size: "md",
  },
};

export const Secondary: Story = {
  args: {
    children: "Acción secundaria",
    variant: "secondary",
    size: "md",
  },
};

export const Outline: Story = {
  args: {
    children: "Cancelar",
    variant: "outline",
    size: "md",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ver detalles",
    variant: "ghost",
    size: "md",
  },
};

export const Danger: Story = {
  args: {
    children: "Eliminar registro",
    variant: "danger",
    size: "md",
  },
};

export const WithLeftIcon: Story = {
  args: {
    children: "Nuevo paciente",
    variant: "primary",
    leftIcon: Icons.plus,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: "Siguiente",
    variant: "primary",
    rightIcon: Icons.chevronRight,
  },
};

export const Loading: Story = {
  args: {
    children: "Guardando...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Deshabilitado",
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button size="sm">Pequeño (sm)</Button>
      <Button size="md">Mediano (md)</Button>
      <Button size="lg">Grande (lg)</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
