import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  PullToRefresh,
  AppointmentTimelineItem,
  type AppointmentTimelineItemData,
} from "../../index";

const meta: Meta<typeof PullToRefresh> = {
  title: "Design System/PullToRefresh",
  component: PullToRefresh,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PullToRefresh>;

// Helper para simular delay asíncrono
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIA 1: Lista Básica con Pull-to-Refresh
// ─────────────────────────────────────────────────────────────────────────────
export const DefaultListPullToRefresh: Story = {
  render: () => {
    const [items, setItems] = useState<string[]>([
      "Registro de paciente #101 - Roberto Suarez",
      "Consulta odontológica - Carmen Morales",
      "Limpieza dental - Diego Fernandez",
      "Ajuste de ortodoncia - Laura Tapia",
    ]);
    const [lastUpdated, setLastUpdated] = useState<string>("Recién cargado");

    const handleRefresh = async () => {
      await delay(1200);
      setItems((prev) => [
        `Nuevo registro #${Math.floor(Math.random() * 900) + 100} - Actualizado`,
        ...prev,
      ]);
      setLastUpdated(new Date().toLocaleTimeString());
    };

    return (
      <div className="w-full max-w-sm sm:max-w-md mx-auto p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-lg">
        <div className="mb-3 px-2 flex items-center justify-between border-b border-[var(--border)] pb-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] font-display">
              Listado con Deslizamiento
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Desliza hacia abajo en móvil o táctil
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
            {lastUpdated}
          </span>
        </div>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-2 py-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] font-medium flex items-center justify-between shadow-2xs"
              >
                <span>{item}</span>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </PullToRefresh>
      </div>
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIA 2: Estado de Refresco Forzado / Controlado Externamente
// ─────────────────────────────────────────────────────────────────────────────
export const RefreshingState: Story = {
  render: () => {
    const [isRefreshing, setIsRefreshing] = useState(true);

    return (
      <div className="w-full max-w-sm sm:max-w-md mx-auto p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--foreground)]">
            Estado de Recarga Activo
          </span>
          <button
            type="button"
            onClick={() => setIsRefreshing((prev) => !prev)}
            className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
          >
            {isRefreshing ? "Detener" : "Iniciar"}
          </button>
        </div>

        <PullToRefresh
          isRefreshing={isRefreshing}
          onRefresh={async () => {
            await delay(1000);
            setIsRefreshing(false);
          }}
        >
          <div className="p-4 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)]">
            Simulación de refresco en progreso...
          </div>
        </PullToRefresh>
      </div>
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIA 3: Agenda / Timeline de Citas con Pull-to-Refresh
// ─────────────────────────────────────────────────────────────────────────────
export const AgendaTimelinePullToRefresh: Story = {
  render: () => {
    const [appointments, setAppointments] = useState<AppointmentTimelineItemData[]>([
      {
        id: "apt-1",
        startTime: "05:00",
        durationMin: 45,
        status: "SCHEDULED",
        contactName: "María Fernández Cruz",
        serviceName: "Evaluación general",
        notes: "Prueba de cita real en BD",
      },
      {
        id: "apt-2",
        startTime: "05:45",
        durationMin: 30,
        status: "CONFIRMED",
        contactName: "Jorge Mamani Quispe",
        serviceName: "Limpieza dental",
      },
      {
        id: "apt-3",
        startTime: "06:30",
        durationMin: 60,
        status: "SCHEDULED",
        contactName: "Lucía Rojas Vargas",
        serviceName: "Endodoncia · control",
        notes: "Sensibilidad en molar inf. der.",
      },
    ]);

    const [expandedId, setExpandedId] = useState<string | null>("apt-1");

    const handleRefresh = async () => {
      await delay(1500);
      // Simular nueva cita al refrescar
      const newId = `apt-${Date.now()}`;
      setAppointments((prev) => [
        {
          id: newId,
          startTime: "04:30",
          durationMin: 30,
          status: "CONFIRMED",
          contactName: "Nueva Cita Actualizada",
          serviceName: "Urgencia dental",
          notes: "Ingreso por actualización en vivo",
        },
        ...prev,
      ]);
      setExpandedId(newId);
    };

    return (
      <div className="w-full max-w-sm sm:max-w-md mx-auto p-4 bg-zinc-950 text-zinc-100 rounded-3xl shadow-2xl border border-zinc-800/80">
        <div className="mb-4 px-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-zinc-100 font-display">
              Agenda Diaria (Pull-to-Refresh)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Desliza hacia abajo para sincronizar con backend
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            {appointments.length} citas
          </span>
        </div>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="flex flex-col">
            {appointments.map((apt, index) => (
              <AppointmentTimelineItem
                key={apt.id}
                appointment={apt}
                isExpanded={expandedId === apt.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === apt.id ? null : apt.id))
                }
                isLast={index === appointments.length - 1}
                onConfirm={() =>
                  setAppointments((prev) =>
                    prev.map((a) => (a.id === apt.id ? { ...a, status: "CONFIRMED" } : a))
                  )
                }
                onNoShow={() =>
                  setAppointments((prev) =>
                    prev.map((a) => (a.id === apt.id ? { ...a, status: "NO_SHOW" } : a))
                  )
                }
              />
            ))}
          </div>
        </PullToRefresh>
      </div>
    );
  },
};
