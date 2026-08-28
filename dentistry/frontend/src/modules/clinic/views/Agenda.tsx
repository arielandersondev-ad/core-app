import { useState } from "react";
import { appointments, getPatientById, getServiceById, getProfessionalById, getAppointmentsByDate, statusColors, statusLabels, professionals, TODAY_DATE } from "@/modules/clinic/__mocks__/data";

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function Agenda({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [date, setDate] = useState(TODAY_DATE);
  const [proFilter, setProFilter] = useState("all");

  const dayAppts = getAppointmentsByDate(date).filter(
    (a) => proFilter === "all" || a.professionalId === proFilter
  );

  const dayStart = 8 * 60;
  const totalMinutes = 12 * 60;

  const formatDateLabel = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            className="w-8 h-8 flex items-center justify-center border border-[var(--border)] rounded-[3px] hover:bg-[var(--surface)] text-[var(--muted)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            onClick={() => setDate(TODAY_DATE)}
            className={`px-3 h-8 text-xs font-mono font-medium rounded-[3px] border transition-colors ${date === TODAY_DATE ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)]"}`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            className="w-8 h-8 flex items-center justify-center border border-[var(--border)] rounded-[3px] hover:bg-[var(--surface)] text-[var(--muted)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <h2 className="font-display text-lg font-bold text-[var(--foreground)] capitalize">{formatDateLabel(date)}</h2>

        <div className="ml-auto flex items-center gap-3">
          <select
            value={proFilter}
            onChange={(e) => setProFilter(e.target.value)}
            className="h-8 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-[3px] text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">Todos los profesionales</option>
            {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={() => onNavigate("nueva-cita")}
            className="h-8 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[3px] text-xs font-semibold hover:opacity-90"
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-4">
        {[
          { label: "Programadas", count: dayAppts.filter((a) => a.status === "programada").length },
          { label: "En curso", count: dayAppts.filter((a) => a.status === "en_curso").length },
          { label: "Completadas", count: dayAppts.filter((a) => a.status === "completada").length },
          { label: "Canceladas", count: dayAppts.filter((a) => a.status === "cancelada").length },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] px-4 py-2.5 flex items-center gap-2">
            <p className="text-xl font-display font-bold text-[var(--foreground)]">{s.count}</p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-4">
        {/* Time column */}
        <div className="flex flex-col" style={{ width: 64 }}>
          <div style={{ height: 36 }} />
          {HOURS.map((h) => (
            <div key={h} className="flex items-start justify-end pr-3" style={{ height: 80 }}>
              <span className="text-[11px] font-mono text-[var(--muted)] -translate-y-2">{h}</span>
            </div>
          ))}
        </div>

        {/* Calendar body */}
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
          {/* Pro headers */}
          <div className="grid border-b border-[var(--border)]" style={{ gridTemplateColumns: proFilter === "all" ? `repeat(${professionals.length}, 1fr)` : "1fr" }}>
            {(proFilter === "all" ? professionals : professionals.filter((p) => p.id === proFilter)).map((pro) => (
              <div key={pro.id} className="px-4 py-2.5 border-r last:border-0 border-[var(--border)] text-center">
                <p className="text-xs font-display font-semibold text-[var(--foreground)]" style={{ color: pro.color }}>{pro.name.replace("Dra. ", "Dra. ").split(" ").slice(0, 2).join(" ")}</p>
                <p className="text-[10px] font-mono text-[var(--muted)]">{pro.specialty}</p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div
            className="relative"
            style={{ height: HOURS.length * 80 }}
          >
            {/* Hour lines */}
            {HOURS.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[var(--border)]"
                style={{ top: i * 80 }}
              />
            ))}

            {/* Column dividers */}
            {proFilter === "all" && professionals.slice(0, -1).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-r border-[var(--border)]"
                style={{ left: `${((i + 1) / professionals.length) * 100}%` }}
              />
            ))}

            {/* Appointments */}
            {dayAppts.map((apt) => {
              const visiblePros = proFilter === "all" ? professionals : professionals.filter((p) => p.id === proFilter);
              const proIndex = visiblePros.findIndex((p) => p.id === apt.professionalId);
              if (proIndex === -1) return null;

              const start = timeToMinutes(apt.startTime) - dayStart;
              const duration = timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime);
              const top = (start / 60) * 80;
              const height = Math.max((duration / 60) * 80 - 4, 28);
              const left = `calc(${(proIndex / visiblePros.length) * 100}% + 4px)`;
              const width = `calc(${(1 / visiblePros.length) * 100}% - 8px)`;

              const patient = getPatientById(apt.patientId);
              const svc = getServiceById(apt.serviceId);
              const pro = professionals.find((p) => p.id === apt.professionalId);

              return (
                <button
                  key={apt.id}
                  onClick={() => onNavigate("cita-detalle", { citaId: apt.id })}
                  className="absolute rounded-[3px] px-2 py-1.5 text-left hover:opacity-90 transition-opacity overflow-hidden"
                  style={{
                    top,
                    left,
                    width,
                    height,
                    backgroundColor: apt.status === "cancelada" ? "#f1f5f1" : `${pro?.color}18`,
                    borderLeft: `3px solid ${apt.status === "cancelada" ? "#ccc" : pro?.color}`,
                    opacity: apt.status === "cancelada" ? 0.6 : 1,
                  }}
                >
                  <p className="text-[11px] font-display font-semibold truncate" style={{ color: apt.status === "cancelada" ? "var(--muted)" : pro?.color }}>
                    {patient?.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  {height > 40 && (
                    <p className="text-[10px] font-mono truncate text-[var(--muted)]">{svc?.name}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List view below */}
      {dayAppts.length > 0 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Lista del día ({dayAppts.length} citas)</p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                  {["Hora", "Paciente", "Servicio", "Profesional", "Estado", "Notas"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayAppts.map((apt) => {
                  const patient = getPatientById(apt.patientId);
                  const svc = getServiceById(apt.serviceId);
                  const pro = getProfessionalById(apt.professionalId);
                  return (
                    <tr
                      key={apt.id}
                      onClick={() => onNavigate("cita-detalle", { citaId: apt.id })}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono font-medium text-[var(--foreground)] whitespace-nowrap">{apt.startTime} – {apt.endTime}</td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); onNavigate("paciente-detalle", { patientId: apt.patientId }); }} className="text-sm font-display font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                          {patient?.name.split(" ").slice(0, 2).join(" ")}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">{svc?.name}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">{pro?.name.replace("Dra. ", "").replace("Dr. ", "").replace("Lic. ", "")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusColors[apt.status]}`}>
                          {statusLabels[apt.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[var(--muted)] max-w-xs truncate">{apt.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dayAppts.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-[4px] text-[var(--muted)]">
          <p className="text-sm">Sin citas para este día</p>
          <button onClick={() => onNavigate("nueva-cita")} className="mt-3 text-xs text-[var(--primary)] hover:underline font-mono">+ Crear cita</button>
        </div>
      )}
    </div>
  );
}
