"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  appointments,
  patients,
  payments,
  getPatientById,
  getServiceById,
  getProfessionalById,
  statusColors,
  statusLabels,
  formatCurrency,
  inventoryStatus,
  inventory,
  TODAY_DATE,
} from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { StatCard, Icons } from "@/shared/components/ui";
import {
  CreateAppointmentModal,
  CreatePatientModal,
  RegisterPaymentModal,
} from "@/modules/clinic/components";

const todayAppts = appointments
  .filter((a) => a.date === TODAY_DATE && a.status !== "cancelada")
  .sort((a, b) => a.startTime.localeCompare(b.startTime));

const totalHoy = payments
  .filter((p) => p.date === TODAY_DATE && p.status === "pagado")
  .reduce((s, p) => s + p.amount, 0);

const pendingPayments = payments.filter((p) => p.status === "pendiente").length;
const alertItems = inventory.filter((i) => inventoryStatus(i) !== "ok");

const completedToday = todayAppts.filter(
  (a) => a.status === "completada",
).length;
const inCourse = todayAppts.filter((a) => a.status === "en_curso").length;

export default function ClinicDashboard({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const router = useRouter();
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const formattedDate = new Date(TODAY_DATE + "T12:00:00").toLocaleDateString(
    "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Buenos días"
        description="Resumen operativo de la jornada clínica, agenda del día y métricas clave"
        badge={
          <span className="px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)] text-xs font-mono capitalize">
            Hoy · {formattedDate}
          </span>
        }
      />

      {/* 2. Acciones Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          {
            label: "Nueva cita",
            icon: "📅",
            action: () => setIsApptModalOpen(true),
          },
          {
            label: "Nuevo paciente",
            icon: "👤",
            action: () => setIsPatientModalOpen(true),
          },
          {
            label: "Registrar pago",
            icon: "💳",
            action: () => setIsPaymentModalOpen(true),
          },
          {
            label: "Ver agenda",
            icon: "📋",
            action: () => onNavigate("agenda"),
          },
        ].map((a) => {
          return (
            <button
              key={a.label}
              onClick={a.action}
              className="flex items-center gap-3.5 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/40 hover:bg-[var(--primary-subtle)]/30 transition-all shadow-xs group text-left cursor-pointer active:scale-[0.99]"
            >
              <span className="text-2xl p-2 bg-[var(--surface-subtle)] rounded-lg group-hover:scale-105 transition-transform">
                {a.icon}
              </span>
              <div>
                <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                  {a.label}
                </p>
                <p className="text-[11px] text-[var(--muted)]">Acceso directo</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Métricas y KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Citas Hoy"
          value={todayAppts.length}
          sublabel={`${completedToday} concluidas · ${inCourse} en sala`}
          icon={Icons.calendar}
          onClick={() => onNavigate("agenda")}
        />
        <StatCard
          label="Ingresos del Día"
          value={formatCurrency(totalHoy)}
          sublabel={`${pendingPayments} cobro(s) pendiente(s)`}
          variant="accent"
          icon={Icons.dollarSign}
          onClick={() => router.push("/payments")}
        />
        <StatCard
          label="Pacientes Activos"
          value={patients.length}
          sublabel="En base de datos"
          icon={Icons.users}
          onClick={() => onNavigate("pacientes")}
        />
        <StatCard
          label="Alertas Inventario"
          value={alertItems.length}
          sublabel={
            alertItems.length > 0 ? "Insumos bajo mínimo" : "Stock en orden"
          }
          variant={alertItems.length > 0 ? "danger" : "success"}
          icon={Icons.alertTriangle}
          onClick={() => onNavigate("inventario")}
        />
      </div>

      {/* 4. Contenido Principal en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda de hoy */}
        <div className="lg:col-span-2 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Agenda de hoy
            </h2>
            <button
              onClick={() => onNavigate("agenda")}
              className="text-xs text-[var(--primary)] font-mono hover:underline cursor-pointer"
            >
              Ver agenda completa →
            </button>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            {todayAppts.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">
                Sin citas programadas para el día de hoy
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                      {[
                        "Hora",
                        "Paciente",
                        "Servicio",
                        "Profesional",
                        "Estado",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {todayAppts.map((apt) => {
                      const patient = getPatientById(apt.patientId);
                      const svc = getServiceById(apt.serviceId);
                      const pro = getProfessionalById(apt.professionalId);
                      return (
                        <tr
                          key={apt.id}
                          onClick={() =>
                            onNavigate("cita-detalle", { citaId: apt.id })
                          }
                          className="hover:bg-[var(--background)]/60 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3.5 text-xs font-mono font-medium text-[var(--foreground)] whitespace-nowrap">
                            {apt.startTime} – {apt.endTime}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                              {patient?.name.split(" ").slice(0, 2).join(" ")}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                            {svc?.name}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                            {pro?.name
                              .replace("Dra. ", "")
                              .replace("Dr. ", "")
                              .replace("Lic. ", "")}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${statusColors[apt.status]}`}
                            >
                              {statusLabels[apt.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Alertas y Pacientes Recientes */}
        <div className="flex flex-col gap-6">
          {alertItems.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                  Alertas de stock
                </h2>
                <button
                  onClick={() => onNavigate("inventario")}
                  className="text-xs text-[var(--primary)] font-mono hover:underline cursor-pointer"
                >
                  Inventario →
                </button>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs divide-y divide-[var(--border)]">
                {alertItems.map((item) => {
                  const st = inventoryStatus(item);
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--background)]/60 transition-colors"
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          st === "critico" ? "bg-red-500" : "bg-amber-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-semibold text-[var(--foreground)] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--muted)]">
                          {item.stock} {item.unit} · mín {item.minStock}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pacientes recientes */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                Pacientes recientes
              </h2>
              <button
                onClick={() => onNavigate("pacientes")}
                className="text-xs text-[var(--primary)] font-mono hover:underline cursor-pointer"
              >
                Ver todos →
              </button>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs divide-y divide-[var(--border)]">
              {patients.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    onNavigate("paciente-detalle", { patientId: p.id })
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--background)]/60 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] text-xs font-display font-bold flex-shrink-0">
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-[var(--foreground)] truncate">
                      {p.name.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--muted)]">
                      {p.phone}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modales de Creación Rápida */}
      <CreateAppointmentModal
        open={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        onSuccess={() => {
          onNavigate("agenda");
        }}
      />

      <CreatePatientModal
        open={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={(newPat) => {
          onNavigate("pacientes");
        }}
      />

      <RegisterPaymentModal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </PageContainer>
  );
}
