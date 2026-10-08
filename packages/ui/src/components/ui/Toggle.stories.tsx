import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
};

export default meta;

export const Interactive: StoryObj = {
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <div className="flex items-center gap-3">
        <Toggle checked={checked} onChange={setChecked} />
        <span className="text-sm font-medium text-[var(--foreground)]">
          {checked ? "Habilitado" : "Deshabilitado"}
        </span>
      </div>
    );
  },
};
