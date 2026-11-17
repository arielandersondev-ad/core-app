import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { StatusMessage } from "./StatusMessage";

const meta: Meta<typeof StatusMessage> = {
  title: "UI/StatusMessage",
  component: StatusMessage,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "radio", options: ["loading", "error", "info"] },
  },
};

export default meta;
type Story = StoryObj<typeof StatusMessage>;

export const Loading: Story = {
  args: { variant: "loading", message: "Cargando pacientes…" },
};

export const Error: Story = {
  args: {
    variant: "error",
    message: "No se pudo cargar el paciente.",
    description: "Revisa tu conexión e inténtalo de nuevo.",
    action: <Button variant="outline">Reintentar</Button>,
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    message: "Sin conexión. La consulta continuará cuando recuperes la conexión.",
  },
};
