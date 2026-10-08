import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "success",
        "warning",
        "danger",
        "neutral",
        "active",
        "inactive",
        "suspended",
        "role",
      ],
    },
    size: {
      control: "radio",
      options: ["sm", "md"],
    },
    dot: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Primary: Story = {
  args: {
    children: "Administrador",
    variant: "primary",
    dot: true,
  },
};

export const Success: Story = {
  args: {
    children: "Activo",
    variant: "success",
    dot: true,
  },
};

export const Warning: Story = {
  args: {
    children: "Pendiente",
    variant: "warning",
    dot: true,
  },
};

export const Danger: Story = {
  args: {
    children: "Cancelado",
    variant: "danger",
    dot: true,
  },
};

export const Neutral: Story = {
  args: {
    children: "Borrador",
    variant: "neutral",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Badge variant="primary" dot>Primary</Badge>
      <Badge variant="success" dot>Success</Badge>
      <Badge variant="warning" dot>Warning</Badge>
      <Badge variant="danger" dot>Danger</Badge>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="role">Role</Badge>
    </div>
  ),
};
