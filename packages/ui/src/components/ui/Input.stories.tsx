import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { Icons } from "./Icons";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    inputSize: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Correo electrónico",
    placeholder: "ejemplo@clinica.com",
    hint: "Usaremos este correo para enviar confirmaciones.",
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: "Buscar paciente o tratamiento",
    placeholder: "Escribe un nombre o cédula...",
    leftIcon: Icons.search,
  },
};

export const WithError: Story = {
  args: {
    label: "Contraseña",
    type: "password",
    defaultValue: "123",
    error: "La contraseña debe tener al menos 8 caracteres.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Identificador asignado",
    defaultValue: "CLINIC-8941",
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input inputSize="sm" label="Tamaño Pequeño (sm)" placeholder="Input sm" />
      <Input inputSize="md" label="Tamaño Mediano (md)" placeholder="Input md" />
      <Input inputSize="lg" label="Tamaño Grande (lg)" placeholder="Input lg" />
    </div>
  ),
};
