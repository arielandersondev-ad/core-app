import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CompactStatSummary, type CompactStatItem } from "./CompactStatSummary";
import { Icons } from "./Icons";

const meta: Meta<typeof CompactStatSummary> = {
  title: "UI/CompactStatSummary",
  component: CompactStatSummary,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Resumen minimalista de métricas para vistas móviles. En dispositivos móviles (< 768px), los StatCards convencionales consumen la mitad de la pantalla vertical. CompactStatSummary (o MinimalStatStrip) condensa las micro-métricas en una franja horizontal estilizada de 38px a 42px de altura con scroll suave, icono, valor numérico destacado y label breve.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CompactStatSummary>;

/**
 * 1. Resumen de Tratamientos Clínicos (HAG-23)
 * Muestra las 4 métricas clave de tratamientos en una sola franja horizontal compacta:
 * - Total Servicios
 * - Servicios Activos
 * - Categorías
 * - Precio Promedio (con prefijo monetario)
 */
export const TreatmentsCatalogMetrics: Story = {
  render: () => {
    const items: CompactStatItem[] = [
      {
        id: "total",
        label: "Total Servicios",
        value: 18,
        icon: Icons.shield,
        variant: "default",
      },
      {
        id: "active",
        label: "Servicios Activos",
        value: 15,
        icon: Icons.check,
        variant: "success",
      },
      {
        id: "categories",
        label: "Categorías",
        value: 5,
        icon: Icons.branch,
        variant: "warning",
      },
      {
        id: "avgPrice",
        label: "Precio Promedio",
        value: "185.00",
        prefix: "Bs.",
        icon: Icons.trending,
        variant: "accent",
      },
    ];

    return (
      <div className="p-4 max-w-md mx-auto border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
        <p className="text-xs text-[var(--muted)] font-mono mb-2">
          Catálogo de Tratamientos Móvil (Franja compacta ~38px)
        </p>
        <CompactStatSummary items={items} />
      </div>
    );
  },
};

/**
 * 2. Resumen de Turnos Clínicos (Dentistry Agenda)
 */
export const ClinicAgendaMetrics: Story = {
  render: () => {
    const items: CompactStatItem[] = [
      {
        id: "total",
        label: "Total Citas",
        value: 24,
        icon: Icons.calendar,
        variant: "default",
      },
      {
        id: "confirmed",
        label: "Confirmadas",
        value: 16,
        icon: Icons.check,
        variant: "success",
      },
      {
        id: "pending",
        label: "En Espera",
        value: 5,
        icon: Icons.clock,
        variant: "warning",
      },
      {
        id: "cancelled",
        label: "Canceladas",
        value: 3,
        icon: Icons.close,
        variant: "danger",
      },
    ];

    return (
      <div className="p-4 max-w-md mx-auto border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
        <p className="text-xs text-[var(--muted)] font-mono mb-2">
          Vista móvil: Franja horizontal de 38px de altura
        </p>
        <CompactStatSummary items={items} />
      </div>
    );
  },
};

/**
 * 3. Filtros Interactivos con Estado Activo
 */
export const InteractiveFilterChips: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>("all");

    const items: CompactStatItem[] = [
      {
        id: "all",
        label: "Todos",
        value: 120,
        active: selected === "all",
        onClick: () => setSelected("all"),
      },
      {
        id: "active",
        label: "Activos",
        value: 98,
        variant: "success",
        active: selected === "active",
        onClick: () => setSelected("active"),
      },
      {
        id: "inactive",
        label: "Inactivos",
        value: 22,
        variant: "neutral",
        active: selected === "inactive",
        onClick: () => setSelected("inactive"),
      },
    ];

    return (
      <div className="p-4 max-w-md mx-auto border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
        <p className="text-xs text-[var(--muted)] font-mono mb-2">
          Filtro seleccionado: <strong className="text-[var(--primary)]">{selected}</strong>
        </p>
        <CompactStatSummary items={items} />
      </div>
    );
  },
};

/**
 * 4. Variante Card Compacta
 */
export const CardVariant: Story = {
  render: () => {
    const items: CompactStatItem[] = [
      {
        label: "Pacientes",
        value: 342,
        icon: Icons.user,
        variant: "accent",
      },
      {
        label: "Tratamientos",
        value: 18,
        icon: Icons.activity,
        variant: "default",
      },
      {
        label: "Facturación",
        value: "$14.2k",
        icon: Icons.trending,
        variant: "success",
      },
    ];

    return (
      <div className="p-4 max-w-md mx-auto border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
        <CompactStatSummary items={items} variant="card" />
      </div>
    );
  },
};
