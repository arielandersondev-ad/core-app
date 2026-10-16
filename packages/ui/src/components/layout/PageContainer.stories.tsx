import type { Meta, StoryObj } from "@storybook/react";
import { PageContainer } from "./PageContainer";
import { Card } from "../ui/Card";

const meta: Meta<typeof PageContainer> = {
  title: "Layout/PageContainer",
  component: PageContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
        <h2 className="font-display font-bold text-xl text-[var(--foreground)]">
          Contenido dentro de PageContainer
        </h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Este layout asegura márgenes responsivos unificados (p-4 en móvil, p-6 en tablet, p-8 en escritorio) y anchos máximos consistentes en toda la aplicación.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">Columna 1</Card>
        <Card className="p-4">Columna 2</Card>
        <Card className="p-4">Columna 3</Card>
      </div>
    </PageContainer>
  ),
};
