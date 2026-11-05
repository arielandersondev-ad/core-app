import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  ResponsiveModal,
  Button,
  Input,
  Combobox,
  DatePicker,
  TimePicker,
  Icons,
  formatCurrency,
} from "../../index";

const meta: Meta = {
  title: "Design System/CreateAppointmentModal",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Canonical mock dental services with UUIDv7 IDs
const CATALOG_BOB = [
  {
    id: "0194d3f0-0001-7000-8000-000000000001",
    name: "Evaluación y Diagnóstico Integral",
    duration: 30,
    price: 150,
    currency: "BOB",
  },
  {
    id: "0194d3f0-0002-7000-8000-000000000002",
    name: "Profilaxis y Limpieza Dental Ultrasónica",
    duration: 45,
    price: 220,
    currency: "BOB",
  },
  {
    id: "0194d3f0-0003-7000-8000-000000000003",
    name: "Restauración con Resina Fotocurable",
    duration: 45,
    price: 280,
    currency: "BOB",
  },
  {
    id: "0194d3f0-0004-7000-8000-000000000004",
    name: "Endodoncia Unirradicular Mecanizada",
    duration: 60,
    price: 650,
    currency: "BOB",
  },
];

const CATALOG_USD = [
  {
    id: "0194d3f0-0010-7000-8000-000000000010",
    name: "Comprehensive Oral Examination",
    duration: 30,
    price: 45,
    currency: "USD",
  },
  {
    id: "0194d3f0-0011-7000-8000-000000000011",
    name: "Ultrasonic Dental Scaling & Polish",
    duration: 45,
    price: 75,
    currency: "USD",
  },
  {
    id: "0194d3f0-0012-7000-8000-000000000012",
    name: "Composite Resin Aesthetic Restoration",
    duration: 45,
    price: 95,
    currency: "USD",
  },
  {
    id: "0194d3f0-0013-7000-8000-000000000013",
    name: "In-Office Laser Teeth Whitening",
    duration: 60,
    price: 180,
    currency: "USD",
  },
];

interface AppointmentModalDemoProps {
  initialCurrency: "BOB" | "USD";
  title: string;
}

function AppointmentModalDemo({ initialCurrency, title }: AppointmentModalDemoProps) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<"patient" | "person">("patient");
  const [currency, setCurrency] = useState<"BOB" | "USD">(initialCurrency);
  const [date, setDate] = useState("2026-11-05");
  const [time, setTime] = useState("09:30");
  const [patientId, setPatientId] = useState("0194d3f0-1000-7000-8000-000000000100");
  const [personName, setPersonName] = useState("");
  const [personPhone, setPersonPhone] = useState("");

  const catalog = currency === "USD" ? CATALOG_USD : CATALOG_BOB;

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    catalog[0].id,
  ]);
  const [serviceToAdd, setServiceToAdd] = useState("");

  const selectedServices = selectedServiceIds
    .map((id) => catalog.find((s) => s.id === id))
    .filter(Boolean) as typeof CATALOG_BOB;

  const totalMinutes = selectedServices.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);

  const handleAddService = (serviceId: string) => {
    if (serviceId && !selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds((prev) => [...prev, serviceId]);
    }
    setServiceToAdd("");
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="mb-4 flex items-center gap-3">
        <Button onClick={() => setOpen(true)} variant="primary">
          Abrir {title}
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          Moneda: {currency} | UUIDs v7 canónicos
        </span>
      </div>

      <ResponsiveModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle="Formulario modal estándar con soporte multi-moneda y UUIDv7"
        icon={Icons.calendar}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert(
                  `Cita guardada con éxito:\nTotal: ${formatCurrency(totalPrice, {
                    currency,
                  })}\nServicios: ${selectedServices.map((s) => s.name).join(", ")}`
                );
                setOpen(false);
              }}
            >
              Confirmar Cita ({formatCurrency(totalPrice, { currency })})
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Selector de moneda para demostración de multi-moneda */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
            <span className="text-xs font-medium text-foreground">
              Moneda de atención:
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={currency === "BOB" ? "primary" : "outline"}
                onClick={() => {
                  setCurrency("BOB");
                  setSelectedServiceIds([CATALOG_BOB[0].id]);
                }}
              >
                BOB (Bolivianos)
              </Button>
              <Button
                size="sm"
                variant={currency === "USD" ? "primary" : "outline"}
                onClick={() => {
                  setCurrency("USD");
                  setSelectedServiceIds([CATALOG_USD[0].id]);
                }}
              >
                USD (Dólares)
              </Button>
            </div>
          </div>

          {/* Toggle Paciente vs Persona */}
          <div className="flex rounded-lg border border-border p-1 bg-surface">
            <button
              type="button"
              onClick={() => setMode("patient")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === "patient"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paciente Registrado
            </button>
            <button
              type="button"
              onClick={() => setMode("person")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === "person"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Persona (Registro Rápido)
            </button>
          </div>

          {mode === "patient" ? (
            <div>
              <Combobox
                label="Paciente *"
                placeholder="Seleccione paciente..."
                value={patientId}
                onChange={setPatientId}
                options={[
                  {
                    value: "0194d3f0-1000-7000-8000-000000000100",
                    label: "Lucía Morales Flores",
                    description: "CI: 4893201 · Tel: 71234567",
                  },
                  {
                    value: "0194d3f0-1001-7000-8000-000000000101",
                    label: "Rodrigo Vargas Choque",
                    description: "CI: 5938204 · Tel: 76543210",
                  },
                ]}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre completo *"
                placeholder="Ej. Roberto Gómez"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
              <Input
                label="Teléfono / WhatsApp *"
                placeholder="Ej. 70012345"
                value={personPhone}
                onChange={(e) => setPersonPhone(e.target.value)}
              />
            </div>
          )}

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DatePicker
              label="Fecha de la cita"
              value={date}
              onChange={setDate}
            />
            <TimePicker
              label="Hora de inicio"
              value={time}
              onChange={setTime}
            />
          </div>

          {/* Selección de servicios con UUIDs y formatCurrency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Servicios Odontológicos *
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {selectedServices.length} seleccionados · {totalMinutes} min
              </span>
            </div>

            <Combobox
              placeholder="Agregar procedimiento dental..."
              value={serviceToAdd}
              onChange={handleAddService}
              options={catalog
                .filter((s) => !selectedServiceIds.includes(s.id))
                .map((s) => ({
                  value: s.id,
                  label: s.name,
                  description: `${s.duration} min · ${formatCurrency(s.price, {
                    currency,
                  })}`,
                }))}
            />

            {/* Lista de servicios seleccionados */}
            <div className="space-y-1.5 pt-1">
              {selectedServices.map((svc) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{svc.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      UUID: {svc.id.slice(0, 18)}... · {svc.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold font-mono text-primary">
                      {formatCurrency(svc.price, { currency })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(svc.id)}
                      className="p-1 text-muted-foreground hover:text-danger rounded transition-colors"
                      title="Eliminar servicio"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen Total */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary-subtle border border-primary/20 mt-3">
              <span className="text-xs font-semibold text-primary">
                Total Presupuestado ({currency}):
              </span>
              <span className="font-display font-bold text-base text-primary">
                {formatCurrency(totalPrice, { currency })}
              </span>
            </div>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}

export const BolivianosDefault: Story = {
  render: () => (
    <AppointmentModalDemo
      initialCurrency="BOB"
      title="Nueva Cita Odontológica (BOB)"
    />
  ),
};

export const UsdMultiCurrency: Story = {
  render: () => (
    <AppointmentModalDemo
      initialCurrency="USD"
      title="New Dental Appointment (USD)"
    />
  ),
};
