import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";
import { Icons } from "./Icons";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    message: "No hay registros disponibles",
    description: "Comienza agregando un nuevo paciente para verlo en esta sección.",
    action: <Button size="sm" leftIcon={Icons.plus}>Agregar primer registro</Button>,
  },
};
