import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  MobileFilterSheet,
  FilterTriggerButton,
} from "./MobileFilterSheet";
import { Select } from "./Select";
import { Toggle } from "./Toggle";
import { Label } from "./Label";

const meta: Meta<typeof MobileFilterSheet> = {
  title: "Design System/MobileFilterSheet",
  component: MobileFilterSheet,
  parameters: {
    layout: "centered",
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MobileFilterSheet>;

export const DefaultNoActiveFilters: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-4">
        <FilterTriggerButton
          activeCount={0}
          onClick={() => setOpen(true)}
        />
        <MobileFilterSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          activeCount={0}
          title="Filtros"
        >
          <div className="space-y-4">
            <div>
              <Label>Estado de Cita</Label>
              <Select
                options={[
                  { value: "all", label: "Todos los estados" },
                  { value: "pending", label: "Pendiente" },
                  { value: "confirmed", label: "Confirmada" },
                  { value: "completed", label: "Completada" },
                  { value: "cancelled", label: "Cancelada" },
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
            <div>
              <Label>Sucursal</Label>
              <Select
                options={[
                  { value: "all", label: "Todas las sucursales" },
                  { value: "central", label: "Sede Central" },
                  { value: "norte", label: "Sucursal Norte" },
                ]}
                value="all"
                onChange={() => {}}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Solo urgencias</span>
              <Toggle checked={false} onChange={() => {}} />
            </div>
          </div>
        </MobileFilterSheet>
      </div>
    );
  },
};

export const WithActiveFiltersBadge: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-4">
        <FilterTriggerButton
          activeCount={2}
          onClick={() => setOpen(true)}
        />
        <MobileFilterSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          activeCount={2}
          title="Filtros de Pacientes"
          onClear={() => {}}
          onApply={() => setOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <Label>Tipo de Paciente</Label>
              <Select
                options={[
                  { value: "all", label: "Todos" },
                  { value: "regular", label: "Regular" },
                  { value: "orthodontics", label: "Ortodoncia (Activo)" },
                ]}
                value="orthodontics"
                onChange={() => {}}
              />
            </div>
            <div>
              <Label>Estado de Cuenta</Label>
              <Select
                options={[
                  { value: "all", label: "Cualquiera" },
                  { value: "debt", label: "Con saldo pendiente (Activo)" },
                  { value: "clean", label: "Al día" },
                ]}
                value="debt"
                onChange={() => {}}
              />
            </div>
          </div>
        </MobileFilterSheet>
      </div>
    );
  },
};

export const InteractiveFilterSimulation: Story = {
  render: function InteractiveComponent() {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState("all");
    const [onlyUrgent, setOnlyUrgent] = useState(false);
    const [doctor, setDoctor] = useState("all");

    // Dynamic active filter calculation
    const activeCount =
      (status !== "all" ? 1 : 0) +
      (doctor !== "all" ? 1 : 0) +
      (onlyUrgent ? 1 : 0);

    const handleClear = () => {
      setStatus("all");
      setDoctor("all");
      setOnlyUrgent(false);
    };

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 border rounded-xl bg-card">
        <div className="text-center space-y-2 mb-6">
          <h3 className="font-semibold text-base">Filtros Secundarios Móviles</h3>
          <p className="text-sm text-muted-foreground">
            Prueba abriendo el sheet, modificando opciones y viendo cómo el badge y los estados reaccionan.
          </p>
        </div>

        <FilterTriggerButton
          activeCount={activeCount}
          onClick={() => setIsOpen(true)}
        />

        <div className="mt-4 text-xs text-muted-foreground">
          Filtros seleccionados: <strong>{activeCount}</strong> (Estado: {status}, Dr: {doctor}, Urgente: {onlyUrgent ? "Sí" : "No"})
        </div>

        <MobileFilterSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          activeCount={activeCount}
          onClear={handleClear}
          onApply={() => setIsOpen(false)}
          title="Filtros de Agenda"
        >
          <div className="space-y-4">
            <div>
              <Label>Estado de cita</Label>
              <Select
                options={[
                  { value: "all", label: "Todos los estados" },
                  { value: "pending", label: "Pendiente" },
                  { value: "confirmed", label: "Confirmada" },
                  { value: "completed", label: "Completada" },
                ]}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>

            <div>
              <Label>Profesional a cargo</Label>
              <Select
                options={[
                  { value: "all", label: "Todos los doctores" },
                  { value: "dr-perez", label: "Dr. Juan Pérez" },
                  { value: "dra-gomez", label: "Dra. María Gómez" },
                ]}
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Solo casos prioritarios</span>
              <Toggle
                checked={onlyUrgent}
                onChange={(checked) => setOnlyUrgent(checked)}
              />
            </div>
          </div>
        </MobileFilterSheet>
      </div>
    );
  },
};
