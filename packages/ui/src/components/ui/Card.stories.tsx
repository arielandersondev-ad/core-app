import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";
import { Button } from "./Button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="p-6 max-w-md">
      <h3 className="font-display font-bold text-lg text-[var(--foreground)] mb-2">
        Título de la tarjeta
      </h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
        Contenedor con superficie, bordes y radio estrictamente estandarizados para todo el proyecto.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">Cerrar</Button>
        <Button variant="primary" size="sm">Aceptar</Button>
      </div>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card onClick={() => alert("Tarjeta clickeada")} className="p-5 max-w-sm">
      <p className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Interactivo</p>
      <h4 className="font-display font-semibold text-base text-[var(--foreground)] mt-1">Haz clic en esta tarjeta</h4>
      <p className="text-xs text-[var(--muted)] mt-1">Soporta hover, active scale y estilos de focus.</p>
    </Card>
  ),
};
