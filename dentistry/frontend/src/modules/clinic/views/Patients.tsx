"use client";

import { useState } from "react";
import { patients, calcAge } from "@/modules/clinic/__mocks__/data";
import { displayDate } from "@/features/clinical-history/data/history";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import { StatCard, Button, Input, EmptyState, Icons } from "@/shared/components/ui";
import { CreatePatientModal } from "@/modules/clinic/components";

export default function Patients({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [search, setSearch] = useState("");
  const [patientsList, setPatientsList] = useState(patients);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = patientsList.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Pacientes"
        description="Gestión del padrón de pacientes, expedientes clínicos e historial de consultas"
        action={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="font-semibold text-xs shadow-xs"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nuevo paciente
          </Button>
        }
      />

      {/* 2. KPIs y Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard
          label="Total Pacientes"
          value={patients.length}
          sublabel="Registrados en el sistema"
          icon={Icons.users}
        />
        <StatCard
          label="Citas Esta Semana"
          value={5}
          sublabel="Atenciones programadas"
          variant="accent"
          icon={Icons.calendar}
        />
        <StatCard
          label="Nuevos Este Mes"
          value={2}
          sublabel="Incorporaciones recientes"
          variant="success"
          icon={Icons.plus}
        />
      </div>

      {/* 3. Filtros y Búsqueda */}
      <FilterToolbar>
        <div className="relative flex-1 max-w-md">
          <Input
            inputSize="sm"
            leftIcon={Icons.search}
            placeholder="Buscar por nombre, teléfono o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs font-mono text-[var(--muted)]">
          Mostrando {filtered.length} de {patients.length} pacientes
        </p>
      </FilterToolbar>

      {/* 4. Tabla de Datos */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                {[
                  "Paciente",
                  "Edad · Sangre",
                  "Teléfono",
                  "Alergias",
                  "Última visita",
                  "",
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
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() =>
                    onNavigate("paciente-detalle", { patientId: p.id })
                  }
                  className="hover:bg-[var(--background)]/60 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] text-xs font-display font-bold flex-shrink-0">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onNavigate("paciente-detalle", { patientId: p.id });
                          }}
                          className="text-left text-sm font-display font-semibold text-[var(--foreground)] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          {p.name}
                        </button>
                        <p className="text-[11px] font-mono text-[var(--muted)]">
                          {p.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                    {calcAge(p.dob)} años ·{" "}
                    <span className="font-mono text-xs font-medium text-[var(--foreground)]">
                      {p.bloodType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-mono text-[var(--foreground)]">
                    {p.phone}
                  </td>
                  <td className="px-4 py-3.5">
                    {p.allergies.length === 0 ? (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.allergies.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded-md bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)]">
                    {displayDate(p.lastVisit)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-block transform group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState message={`Sin resultados para "${search}"`} />
        )}

        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--background)]/30 flex items-center justify-between text-xs font-mono text-[var(--muted)]">
          <span>{filtered.length} registros</span>
          <span>Sincronizado con base de datos</span>
        </div>
      </div>

      <CreatePatientModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newPat) => {
          setPatientsList([...patients]);
          onNavigate("paciente-detalle", { patientId: newPat.id });
        }}
      />
    </PageContainer>
  );
}
