import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    label: "Especialidad",
    options: [
      { value: "general", label: "Odontología General" },
      { value: "ortho", label: "Ortodoncia" },
      { value: "endo", label: "Endodoncia" },
      { value: "surgery", label: "Cirugía Maxilofacial" },
    ],
  },
};

export const WithError: Story = {
  args: {
    label: "Sucursal",
    error: "Debes seleccionar una sucursal válida",
    options: [
      { value: "", label: "Seleccione una sucursal..." },
      { value: "1", label: "Sucursal Central" },
      { value: "2", label: "Sucursal Norte" },
    ],
  },
};
