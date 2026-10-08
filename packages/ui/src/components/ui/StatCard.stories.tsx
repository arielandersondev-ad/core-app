import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "./StatCard";
import { Icons } from "./Icons";

const meta: Meta<typeof StatCard> = {
  title: "UI/StatCard",
  component: StatCard,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "accent"],
    },
    active: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: "Pacientes Activos",
    value: "1,248",
    sublabel: "+12% vs mes anterior",
    icon: Icons.users,
  },
};

export const Accent: Story = {
  args: {
    label: "Ingresos del Día",
    value: "$4,850",
    sublabel: "34 transacciones completadas",
    variant: "accent",
    icon: Icons.dollarSign,
  },
};

export const Warning: Story = {
  args: {
    label: "Citas Pendientes",
    value: "18",
    sublabel: "Requieren confirmación hoy",
    variant: "warning",
    icon: Icons.clock,
  },
};

export const Danger: Story = {
  args: {
    label: "Tratamientos Atrasados",
    value: "3",
    sublabel: "Atención prioritaria",
    variant: "danger",
    icon: Icons.alertTriangle,
  },
};

export const AllVariantsRow: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
      <StatCard
        label="Total Usuarios"
        value="480"
        sublabel="8 creados esta semana"
        icon={Icons.users}
      />
      <StatCard
        label="Citas Confirmadas"
        value="94"
        sublabel="Para la jornada de hoy"
        variant="success"
        icon={Icons.check}
      />
      <StatCard
        label="Por Cobrar"
        value="$1,200"
        sublabel="Facturas con vencimiento"
        variant="warning"
        icon={Icons.clock}
      />
      <StatCard
        label="Ingresos Mes"
        value="$18,450"
        sublabel="Meta superada al 104%"
        variant="accent"
        icon={Icons.dollarSign}
      />
    </div>
  ),
};
