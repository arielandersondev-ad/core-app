import Link from "next/link";
import type { PatientDto } from "@/features/patient/types/patient";

export function PatientTable({ patients }: { patients: PatientDto[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
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
  );
}
