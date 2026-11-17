import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "UI/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Componente híbrido de selección de fecha. Permite tanto la escritura directa por teclado (formato YYYY-MM-DD o DD/MM/YYYY) como la selección visual interactiva mediante popover de calendario con navegación mensual y atajo 'Hoy'.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState("2026-10-28");
    return (
      <div className="max-w-xs p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
        <DatePicker
          label="Fecha de la Cita"
          value={date}
          onChange={setDate}
          hint="Escribe la fecha o abre el calendario"
        />
        <p className="mt-3 text-xs text-[var(--muted)] font-mono">
          Valor actual: <strong className="text-[var(--primary)]">{date}</strong>
        </p>
      </div>
    );
  },
};

export const CompactSize: Story = {
  render: () => {
    const [date, setDate] = useState("2026-11-04");
    return (
      <div className="max-w-xs p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
        <DatePicker
          label="Fecha (size='sm' / 36px)"
          pickerSize="sm"
          value={date}
          onChange={setDate}
        />
      </div>
    );
  },
};
