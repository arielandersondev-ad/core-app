import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TimePicker } from "./TimePicker";

const meta: Meta<typeof TimePicker> = {
  title: "UI/TimePicker",
  component: TimePicker,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Componente híbrido de selección de hora. Permite la escritura manual directa (formato HH:MM) o la selección rápida mediante un selector visual con horarios clínicos frecuentes.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {
  render: () => {
    const [time, setTime] = useState("09:00");
    return (
      <div className="max-w-xs p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
        <TimePicker
          label="Hora de Inicio"
          value={time}
          onChange={setTime}
          hint="Escribe directamente o haz clic en el reloj"
        />
        <p className="mt-3 text-xs text-[var(--muted)] font-mono">
          Hora seleccionada: <strong className="text-[var(--primary)]">{time}</strong>
        </p>
      </div>
    );
  },
};

export const CompactSize: Story = {
  render: () => {
    const [time, setTime] = useState("14:30");
    return (
      <div className="max-w-xs p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
        <TimePicker
          label="Hora (size='sm')"
          pickerSize="sm"
          value={time}
          onChange={setTime}
        />
      </div>
    );
  },
};
