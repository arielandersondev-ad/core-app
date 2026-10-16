import type { Meta, StoryObj } from "@storybook/react";
import { FilterToolbar } from "./FilterToolbar";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Icons } from "../ui/Icons";

const meta: Meta<typeof FilterToolbar> = {
  title: "Layout/FilterToolbar",
  component: FilterToolbar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <FilterToolbar className="w-full max-w-4xl">
      <div className="flex-1 min-w-[200px]">
        <Input
          inputSize="sm"
          placeholder="Buscar por nombre o cédula..."
          leftIcon={Icons.search}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-40">
          <Select
            selectSize="sm"
            options={[
              { value: "all", label: "Todos los estados" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Inactivos" },
            ]}
          />
        </div>
        <Button variant="outline" size="sm" leftIcon={Icons.filter}>
          Filtros
        </Button>
      </div>
    </FilterToolbar>
  ),
};
