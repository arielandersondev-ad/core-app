import Link from "next/link";
import type { PatientDto } from "@/features/patient/types/patient";

export function PatientTable({ patients }: { patients: PatientDto[] }) {
  return (
    <>
      {/* Vista Móvil: Tarjetas (< 768px / md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {patients.map((patient) => (
          <article
            key={patient.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-display font-bold shrink-0"
                >
                  {`${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/patients/${encodeURIComponent(patient.id)}`}
                    className="text-sm font-display font-semibold text-primary hover:underline truncate block"
                  >
                    {patient.fullName}
                  </Link>
                  <p className="text-[11px] font-mono text-muted truncate">
                    {patient.email || "—"}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium shrink-0 ${
                  patient.status === "ACTIVE"
                    ? "bg-success-subtle text-success"
                    : "bg-neutral-subtle text-muted"
                }`}
              >
                {patient.status === "ACTIVE" ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-border pt-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-0.5">
                  Teléfono
                </span>
                {patient.phone ? (
                  <a
                    href={`tel:${patient.phone}`}
                    className="font-mono text-primary font-medium hover:underline inline-block"
                  >
                    {patient.phone}
                  </a>
                ) : (
                  <span className="font-mono text-muted">—</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-0.5">
                  Documento
                </span>
                <span className="text-foreground">
                  {patient.documentNumber
                    ? `${patient.documentType || "CI"} ${patient.documentNumber}`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block mb-0.5">
                  F. Nacimiento
                </span>
                <span className="text-muted">
                  {patient.birthDate?.split("-").reverse().join("/") || "—"}
                </span>
              </div>
              <div className="flex items-end justify-end">
                <Link
                  href={`/patients/${encodeURIComponent(patient.id)}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Expediente →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Vista Desktop: Tabla tradicional (>= 768px / md) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left">
          <caption className="sr-only">Listado de pacientes</caption>
          <thead>
            <tr className="border-b border-border bg-background/50">
              {["Paciente", "Teléfono", "Documento", "Fecha de nacimiento", "Estado"].map((label) => (
                <th key={label} scope="col" className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-muted">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-background/60 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div aria-hidden="true" className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-display font-bold shrink-0">
                      {`${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase()}
                    </div>
                    <div>
                      <Link href={`/patients/${encodeURIComponent(patient.id)}`} className="text-sm font-display font-semibold text-primary hover:underline">{patient.fullName}</Link>
                      <p className="text-[11px] font-mono text-muted">{patient.email || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm font-mono text-foreground">{patient.phone || "—"}</td>
                <td className="px-4 py-3.5 text-sm text-muted">{patient.documentNumber ? `${patient.documentType} ${patient.documentNumber}` : "—"}</td>
                <td className="px-4 py-3.5 text-sm text-muted">{patient.birthDate?.split("-").reverse().join("/") || "—"}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${patient.status === "ACTIVE" ? "bg-success-subtle text-success" : "bg-neutral-subtle text-muted"}`}>
                    {patient.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
