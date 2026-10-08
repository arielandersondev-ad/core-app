import { useState } from "react";
import {
  getPatientById,
  getAppointmentsByPatient,
  getPaymentsByPatient,
  getClinicalByPatient,
  getSessionsByPatient,
  getServiceById,
  getProfessionalById,
  calcAge,
  formatCurrency,
  statusColors,
  statusLabels,
  paymentMethodLabels,
} from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Button, StatCard, Icons } from "@/shared/components/ui";
import {
  CreateAppointmentModal,
  RegisterPaymentModal,
} from "@/modules/clinic/components";

type Tab = "resumen" | "historial" | "citas" | "sesiones" | "pagos";

export default function PatientDetail({
  onBack,
  patientId,
  onNavigate,
}: {
  onBack: () => void;
  patientId: string;
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const patient = getPatientById(patientId);
  const [tab, setTab] = useState<Tab>("resumen");
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (!patient) return null;

  const [appts, setAppts] = useState(() => getAppointmentsByPatient(patientId));
  const [pays, setPays] = useState(() => getPaymentsByPatient(patientId));
  const clinical = getClinicalByPatient(patientId);
  const sessions = getSessionsByPatient(patientId);

  const totalPaid = pays
    .filter((p) => p.status === "pagado")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = pays
    .filter((p) => p.status === "pendiente")
    .reduce((s, p) => s + p.amount, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "historial", label: "Historial clínico" },
    { key: "citas", label: `Citas (${appts.length})` },
    { key: "sesiones", label: `Sesiones (${sessions.length})` },
    { key: "pagos", label: `Pagos (${pays.length})` },
  ];

  return (
    <PageContainer>
      {/* 1. Cabecera con Breadcrumb */}
      <PageHeader
        title={patient.name}
        description={`${calcAge(patient.dob)} años · Grupo ${patient.bloodType} · Teléfono: ${patient.phone}`}
        breadcrumbs={[
          { label: "Pacientes", onClick: onBack },
          { label: patient.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setIsApptModalOpen(true)}
              className="text-xs font-semibold shadow-xs"
            >
              + Agendar cita
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs font-semibold shadow-xs"
            >
              Registrar pago
            </Button>
          </div>
        }
      />

      {/* Alergias en caso de existir */}
      {patient.allergies.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl">
          <span className="text-xs font-mono font-bold text-[var(--danger)] uppercase tracking-wider flex items-center gap-1">
            ⚠ Alergias del paciente:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.map((a) => (
              <span
                key={a}
                className="text-xs font-mono px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-md font-medium"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Navegación por Pestañas */}
      <div className="flex gap-2 border-b border-[var(--border)] overflow-x-auto scrollbar-none pb-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-display font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px ${
              tab === t.key
                ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3. Contenido de las Pestañas */}
      {/* ── Resumen ── */}
      {tab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                <div className="divide-y divide-[var(--border)]">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                      Fecha de nacimiento
                    </p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                      {new Date(patient.dob).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                      Tipo de sangre
                    </p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                      {patient.bloodType}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                      Correo electrónico
                    </p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                      {patient.email || "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                      Teléfono
                    </p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                      {patient.phone}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                      Dirección
                    </p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                      {patient.address || "No registrada"}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                      Paciente desde
                    </p>
                    <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                      {new Date(patient.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {patient.notes && (
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 shadow-xs">
                <p className="text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-1">
                  Notas clínicas y observaciones
                </p>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {patient.notes}
                </p>
              </div>
            )}

            {/* Último registro clínico */}
            {clinical.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                  Último registro clínico
                </h3>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs">
                  <p className="text-xs font-mono text-[var(--muted)] mb-1">
                    {new Date(clinical[0].date).toLocaleDateString("es-PE")} ·{" "}
                    {getProfessionalById(clinical[0].professionalId)?.name}
                  </p>
                  <p className="text-sm font-display font-semibold text-[var(--foreground)] mb-2">
                    {clinical[0].title}
                  </p>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {clinical[0].notes}
                  </p>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {clinical[0].tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-md uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen lateral de finanzas y citas */}
          <div className="flex flex-col gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs flex flex-col gap-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                Estado de cuenta
              </h3>
              <div className="flex flex-col gap-3 divide-y divide-[var(--border)]">
                <div className="pt-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Total pagado
                  </p>
                  <p className="text-2xl font-display font-bold text-[var(--primary)] mt-0.5">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                {totalPending > 0 && (
                  <div className="pt-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                      Saldo pendiente
                    </p>
                    <p className="text-2xl font-display font-bold text-[var(--danger)] mt-0.5">
                      {formatCurrency(totalPending)}
                    </p>
                  </div>
                )}
                <div className="pt-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Citas completadas
                  </p>
                  <p className="text-xl font-display font-bold text-[var(--foreground)] mt-0.5">
                    {appts.filter((a) => a.status === "completada").length}
                  </p>
                </div>
                <div className="pt-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Sesiones acumuladas
                  </p>
                  <p className="text-xl font-display font-bold text-[var(--foreground)] mt-0.5">
                    {sessions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Historial clínico ── */}
      {tab === "historial" && (
        <div className="flex flex-col gap-4 max-w-4xl">
          {clinical.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]">
              Sin registros clínicos archivados
            </div>
          ) : (
            clinical.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-display font-bold text-[var(--foreground)]">
                      {entry.title}
                    </p>
                    <p className="text-xs font-mono text-[var(--muted)] mt-0.5">
                      {new Date(entry.date).toLocaleDateString("es-PE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {getProfessionalById(entry.professionalId)?.name}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {entry.notes}
                </p>
                {entry.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-md uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Citas ── */}
      {tab === "citas" && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                  {[
                    "Fecha · Hora",
                    "Servicio",
                    "Profesional",
                    "Estado",
                    "Notas",
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
                {appts.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-[var(--background)]/60 cursor-pointer transition-colors"
                    onClick={() =>
                      onNavigate("cita-detalle", { citaId: apt.id })
                    }
                  >
                    <td className="px-4 py-3.5 text-xs font-mono text-[var(--foreground)] whitespace-nowrap">
                      {new Date(apt.date).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      · {apt.startTime}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">
                      {getServiceById(apt.serviceId)?.name}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                      {getProfessionalById(apt.professionalId)
                        ?.name.replace("Dra. ", "")
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
                    <td className="px-4 py-3.5 text-xs text-[var(--muted)] max-w-xs truncate">
                      {apt.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sesiones ── */}
      {tab === "sesiones" && (
        <div className="flex flex-col gap-4 max-w-4xl">
          {sessions.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--muted)] border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]">
              Sin sesiones registradas
            </div>
          ) : (
            sessions.map((ses) => (
              <div
                key={ses.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex items-start gap-4 shadow-xs"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center font-display font-bold text-[var(--primary)] text-sm flex-shrink-0">
                  #{ses.sessionNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                    {getServiceById(ses.serviceId)?.name}
                  </p>
                  <p className="text-xs font-mono text-[var(--muted)] mt-0.5">
                    {new Date(ses.date).toLocaleDateString("es-PE")} ·{" "}
                    {getProfessionalById(ses.professionalId)?.name}
                  </p>
                  {ses.notes && (
                    <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
                      {ses.notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Pagos ── */}
      {tab === "pagos" && (
        <div className="flex flex-col gap-4 max-w-4xl">
          <div className="grid grid-cols-2 gap-3.5">
            <StatCard
              label="Total Pagado"
              value={formatCurrency(totalPaid)}
              sublabel="Historial acumulado"
              variant="accent"
              icon={Icons.dollarSign}
            />
            {totalPending > 0 && (
              <StatCard
                label="Saldo Pendiente"
                value={formatCurrency(totalPending)}
                sublabel="Por cancelar"
                variant="danger"
                icon={Icons.alertTriangle}
              />
            )}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                    {["Fecha", "Concepto", "Monto", "Método", "Estado"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pays.map((pay) => (
                    <tr
                      key={pay.id}
                      className="hover:bg-[var(--background)]/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)]">
                        {new Date(pay.date).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--foreground)] font-medium">
                        {pay.concept}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-display font-bold text-[var(--foreground)]">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)]">
                        {paymentMethodLabels[pay.method]}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${
                            pay.status === "pagado"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : pay.status === "pendiente"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {pay.status === "pagado"
                            ? "Pagado"
                            : pay.status === "pendiente"
                              ? "Pendiente"
                              : "Parcial"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modales de Agendamiento y Cobro */}
      <CreateAppointmentModal
        open={isApptModalOpen}
        initialPatientId={patientId}
        onClose={() => setIsApptModalOpen(false)}
        onSuccess={() => {
          setAppts(getAppointmentsByPatient(patientId));
        }}
      />

      <RegisterPaymentModal
        open={isPaymentModalOpen}
        initialPatientId={patientId}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setPays(getPaymentsByPatient(patientId));
        }}
      />
    </PageContainer>
  );
}
