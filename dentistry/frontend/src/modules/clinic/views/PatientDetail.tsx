import { useState } from "react";
import {
  getPatientById, getAppointmentsByPatient, getPaymentsByPatient,
  getClinicalByPatient, getSessionsByPatient,
  getServiceById, getProfessionalById,
  calcAge, formatCurrency, statusColors, statusLabels, paymentMethodLabels,
} from "@/shared/data/clinic-data";

type Tab = "resumen" | "historial" | "citas" | "sesiones" | "pagos";

export default function PatientDetail({
  onBack,
  patientId,
  onNavigate,
}: {
  onBack: () => void ;
  patientId: string;
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const patient = getPatientById(patientId);
  const [tab, setTab] = useState<Tab>("resumen");

  if (!patient) return null;

  const appts = getAppointmentsByPatient(patientId);
  const pays = getPaymentsByPatient(patientId);
  const clinical = getClinicalByPatient(patientId);
  const sessions = getSessionsByPatient(patientId);

  const totalPaid = pays.filter((p) => p.status === "pagado").reduce((s, p) => s + p.amountMinor, 0);
  const totalPending = pays.filter((p) => p.status === "pendiente").reduce((s, p) => s + p.amountMinor, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "historial", label: "Historial clínico" },
    { key: "citas", label: `Citas (${appts.length})` },
    { key: "sesiones", label: `Sesiones (${sessions.length})` },
    { key: "pagos", label: `Pagos (${pays.length})` },
  ];

  return (
    <div className="p-8 flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-start gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] font-display font-bold text-xl flex-shrink-0">
          {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-0.5">{patient.name}</h2>
          <p className="text-sm font-mono text-[var(--muted)]">{calcAge(patient.dob)} años · {patient.bloodType} · {patient.phone}</p>
          {patient.allergies.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              <span className="text-[10px] font-mono text-red-600 dark:text-red-400 uppercase tracking-wider">⚠ Alergias:</span>
              {patient.allergies.map((a) => (
                <span key={a} className="text-[10px] font-mono px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-[2px] uppercase tracking-wide">{a}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate("nueva-cita", { patientId })}
            className="h-9 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[3px] text-sm font-semibold hover:opacity-90"
          >
            + Agendar cita
          </button>
          <button
            onClick={() => onNavigate("registrar-pago", { patientId })}
            className="h-9 px-4 border border-[var(--border)] rounded-[3px] text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30"
          >
            Registrar pago
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--border)] mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-display font-semibold border-b-2 transition-colors -mb-px ${tab === t.key ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Resumen ── */}
      {tab === "resumen" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
              <div className="grid grid-cols-2">
                {[
                  { label: "Fecha de nacimiento", value: new Date(patient.dob).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" }) },
                  { label: "Tipo de sangre", value: patient.bloodType },
                  { label: "Correo", value: patient.email },
                  { label: "Teléfono", value: patient.phone },
                  { label: "Dirección", value: patient.address },
                  { label: "Paciente desde", value: new Date(patient.createdAt).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" }) },
                ].map((item, i) => (
                  <div key={item.label} className={`px-5 py-4 ${i % 2 === 0 ? "border-r border-[var(--border)]" : ""} ${i < 4 ? "border-b border-[var(--border)]" : ""}`}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">{item.label}</p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {patient.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-[4px] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">Notas clínicas</p>
                <p className="text-sm text-[var(--foreground)]">{patient.notes}</p>
              </div>
            )}

            {/* Recent clinical entries */}
            {clinical.length > 0 && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Último registro clínico</p>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5">
                  <p className="text-[11px] font-mono text-[var(--muted)] mb-1">{new Date(clinical[0].date).toLocaleDateString("es-BO")} · {getProfessionalById(clinical[0].professionalId)?.name}</p>
                  <p className="text-sm font-display font-semibold text-[var(--foreground)] mb-2">{clinical[0].title}</p>
                  <p className="text-sm text-[var(--muted)]">{clinical[0].notes}</p>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {clinical[0].tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-[2px] uppercase tracking-wide">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side: payment summary */}
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-4">Resumen de pagos</p>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">Total pagado</p>
                  <p className="text-2xl font-display font-bold text-[var(--primary)] mt-0.5">{formatCurrency(totalPaid)}</p>
                </div>
                {totalPending > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">Pendiente</p>
                    <p className="text-xl font-display font-bold text-[var(--danger)] mt-0.5">{formatCurrency(totalPending)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">Citas realizadas</p>
                  <p className="text-xl font-display font-bold text-[var(--foreground)] mt-0.5">{appts.filter((a) => a.status === "completada").length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">Sesiones totales</p>
                  <p className="text-xl font-display font-bold text-[var(--foreground)] mt-0.5">{sessions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Historial clínico ── */}
      {tab === "historial" && (
        <div className="flex flex-col gap-3 max-w-3xl">
          {clinical.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--border)] rounded-[4px]">Sin registros clínicos</div>
          ) : clinical.map((entry) => (
            <div key={entry.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-display font-bold text-[var(--foreground)]">{entry.title}</p>
                  <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
                    {new Date(entry.date).toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {getProfessionalById(entry.professionalId)?.name}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{entry.notes}</p>
              {entry.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-[2px] uppercase tracking-wide">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Citas ── */}
      {tab === "citas" && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden max-w-4xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                {["Fecha · Hora", "Servicio", "Profesional", "Estado", "Notas"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appts.map((apt) => (
                <tr key={apt.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] cursor-pointer transition-colors" onClick={() => onNavigate("cita-detalle", { citaId: apt.id })}>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--foreground)]">{new Date(apt.date).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })} · {apt.startTime}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{getServiceById(apt.serviceId)?.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted)]">{getProfessionalById(apt.professionalId)?.name.replace("Dra. ", "").replace("Dr. ", "").replace("Lic. ", "")}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusColors[apt.status]}`}>{statusLabels[apt.status]}</span></td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted)] max-w-xs truncate">{apt.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sesiones ── */}
      {tab === "sesiones" && (
        <div className="flex flex-col gap-3 max-w-3xl">
          {sessions.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--border)] rounded-[4px]">Sin sesiones registradas</div>
          ) : sessions.map((ses) => (
            <div key={ses.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-[3px] bg-[var(--primary-subtle)] flex items-center justify-center font-display font-bold text-[var(--primary)] text-sm flex-shrink-0">
                #{ses.sessionNumber}
              </div>
              <div className="flex-1">
                <p className="text-sm font-display font-semibold text-[var(--foreground)]">{getServiceById(ses.serviceId)?.name}</p>
                <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">{new Date(ses.date).toLocaleDateString("es-BO")} · {getProfessionalById(ses.professionalId)?.name}</p>
                {ses.notes && <p className="text-sm text-[var(--muted)] mt-2">{ses.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagos ── */}
      {tab === "pagos" && (
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">Total pagado</p>
              <p className="text-2xl font-display font-bold text-[var(--primary)]">{formatCurrency(totalPaid)}</p>
            </div>
            {totalPending > 0 && (
              <div className="bg-[var(--surface)] border border-red-200 dark:border-red-900 rounded-[4px] p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">Pendiente</p>
                <p className="text-2xl font-display font-bold text-[var(--danger)]">{formatCurrency(totalPending)}</p>
              </div>
            )}
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                  {["Fecha", "Concepto", "Monto", "Método", "Estado"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pays.map((pay) => (
                  <tr key={pay.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[var(--muted)]">{new Date(pay.date).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{pay.concept}</td>
                    <td className="px-4 py-3 text-sm font-display font-bold text-[var(--foreground)]">{formatCurrency(pay.amountMinor)}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-[var(--muted)]">{paymentMethodLabels[pay.method]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${pay.status === "pagado" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : pay.status === "pendiente" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-blue-100 text-blue-700"}`}>
                        {pay.status === "pagado" ? "Pagado" : pay.status === "pendiente" ? "Pendiente" : "Parcial"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
