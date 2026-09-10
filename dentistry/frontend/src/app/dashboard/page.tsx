"use client";

import Link from "next/link";
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
  TODAY_DATE,
} from "@/shared/data/clinic-data";

const todayAppts = appointments
  .filter((a) => a.date === TODAY_DATE && a.status !== "cancelada")
  .sort((a, b) => a.startTime.localeCompare(b.startTime));

const totalHoy = payments
  .filter((p) => p.date === TODAY_DATE && p.status === "pagado")
  .reduce((s, p) => s + p.amount, 0);

const pendingPayments = payments.filter((p) => p.status === "pendiente").length;
const completedToday = todayAppts.filter((a) => a.status === "completada").length;
const inCourse = todayAppts.filter((a) => a.status === "en_curso").length;

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
          Hoy ·{" "}
          {new Date(TODAY_DATE + "T12:00:00").toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Buenos días
        </h1>
        <p className="text-sm text-muted mt-1">
          Resumen de la jornada clínica
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Nueva cita", icon: "📅", href: "/dashboard/agenda", color: "var(--primary)" },
          { label: "Nuevo paciente", icon: "👤", href: "/dashboard/pacientes", color: "var(--secondary)" },
          { label: "Registrar pago", icon: "💳", href: "/dashboard/pagos", color: "var(--gold-accent)" },
          { label: "Citas de hoy", icon: "📋", href: "/dashboard/agenda", color: "var(--muted)" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-start gap-3 p-4 bg-surface border border-border rounded-[4px] hover:border-primary/40 hover:bg-primary-subtle transition-colors group text-left"
          >
            <span className="text-2xl">{a.icon}</span>
            <p className="text-sm font-display font-semibold text-foreground">
              {a.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Citas hoy", value: todayAppts.length, sub: `${completedToday} completadas · ${inCourse} en curso` },
          { label: "Ingresos del día", value: formatCurrency(totalHoy), sub: `${pendingPayments} pago(s) pendiente(s)` },
          { label: "Pacientes activos", value: patients.length, sub: "En el sistema" },
          { label: "Servicios activos", value: 8, sub: "En catálogo" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-[4px] p-5"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
              {s.label}
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {s.value}
            </p>
            <p className="text-[11px] text-muted mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's agenda */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Agenda de hoy
            </p>
            <Link
              href="/dashboard/agenda"
              className="text-xs text-primary font-mono hover:underline"
            >
              Ver agenda →
            </Link>
          </div>
          <div className="bg-surface border border-border rounded-[4px] overflow-hidden">
            {todayAppts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted">
                Sin citas para hoy
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      {["Hora", "Paciente", "Servicio", "Profesional", "Estado"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppts.map((apt) => {
                      const patient = getPatientById(apt.patientId);
                      const svc = getServiceById(apt.serviceId);
                      const pro = getProfessionalById(apt.professionalId);
                      return (
                        <tr
                          key={apt.id}
                          className="border-b border-border last:border-0 hover:bg-background cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-mono font-medium text-foreground whitespace-nowrap">
                            {apt.startTime} – {apt.endTime}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-display font-semibold text-foreground">
                              {patient?.name.split(" ").slice(0, 2).join(" ")}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted">
                            {svc?.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted">
                            {pro?.name
                              .replace("Dra. ", "")
                              .replace("Dr. ", "")
                              .replace("Lic. ", "")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusColors[apt.status]}`}
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

        {/* Recent patients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
              Pacientes recientes
            </p>
            <Link
              href="/dashboard/patient"
              className="text-xs text-primary font-mono hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="bg-surface border border-border rounded-[4px] overflow-hidden">
            {patients.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors ${i < 4 ? "border-b border-border" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-display font-bold flex-shrink-0">
                  {p.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-foreground truncate">
                    {p.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="text-[10px] font-mono text-muted">{p.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
