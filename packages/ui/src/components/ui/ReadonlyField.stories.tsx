import type { Meta, StoryObj } from "@storybook/react";
import { ReadonlyField } from "./ReadonlyField";
import { Icons } from "./Icons";

const meta: Meta<typeof ReadonlyField> = {
  title: "UI/ReadonlyField",
  component: ReadonlyField,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Componente para presentar información de solo lectura o calculada dentro de formularios (horas estimadas, totales, códigos). Evita usar `<input disabled>` o campos editables falsos que confunden al usuario.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReadonlyField>;

export const Default: Story = {
  args: {
    label: "Fin Estimado de Consulta",
    value: "10:15 AM",
    icon: Icons.clock,
    badge: "Automático",
    helperText: "Calculado a partir de la hora de inicio y la duración de los tratamientos",
    size: "sm",
  },
};

export const DatosPacientePrecargado: Story = {
  args: {
    label: "Paciente Registrado",
    value: "Ana Sofía Martínez (+58 412 901-2233)",
    icon: Icons.user,
    badge: "Solo lectura",
    helperText: "El paciente proviene del contexto actual de navegación",
    size: "sm",
  },
};

export const ResumenMontoCalculado: Story = {
  args: {
    label: "Costo Total Estimado",
    value: "$145.00 USD (3 procedimientos)",
    icon: Icons.dollarSign,
    badge: "Presupuesto",
    size: "sm",
  },
};

export const TamañoMedium: Story = {
  args: {
    label: "Código Único de Atención",
    value: "ENC-2026-00482",
    size: "md",
    badge: "Identificador",
    helperText: "Generado automáticamente por el backend clínico",
  },
};
