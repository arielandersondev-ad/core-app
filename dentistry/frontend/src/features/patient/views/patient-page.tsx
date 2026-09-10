"use client";

import { useState } from "react";
import { patients, calcAge, type Patient } from "@/shared/data/clinic-data";
import { CreatePatientModal } from "@/shared/components/layout/create-patient-modal";
import { StatsBar } from "@/shared/components/layout/stats-bar";
import { Toolbar } from "@/shared/components/layout/toolbar";
import { Button } from "@/shared/components/ui/button";
import { DynamicTable, type ColumnConfig } from "@/shared/components/data-table";

const patientColumns: ColumnConfig<Patient>[] = [
  {
    key: "name",
    label: "Paciente",
    searchable: true,
    render: (_, row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-display font-bold flex-shrink-0">
          {row.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div>
          <p className="text-sm font-display font-semibold text-foreground">{row.name}</p>
          <p className="text-[11px] font-mono text-muted">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "dob",
    label: "Edad · Sangre",
    sortable: true,
    render: (_, row) => (
      <span className="text-sm text-muted">
        {calcAge(row.dob)} años · <span className="font-mono">{row.bloodType}</span>
      </span>
    ),
  },
  {
    key: "phone",
    label: "Teléfono",
    searchable: true,
    render: (value) => (
      <span className="text-sm font-mono text-foreground">{value as string}</span>
    ),
  },
  {
    key: "allergies",
    label: "Alergias",
    render: (value) => {
      const allergies = value as string[];
      if (allergies.length === 0) return <span className="text-[11px] text-muted">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {allergies.map((a) => (
            <span
              key={a}
              className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded-[2px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            >
              {a}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    key: "lastVisit",
    label: "Última visita",
    type: "date",
    sortable: true,
  },
];

export default function PatientPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <StatsBar
        stats={[
          { label: "Total pacientes", value: patients.length },
          { label: "Citas esta semana", value: 5 },
          { label: "Nuevos este mes", value: 2 },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por nombre, teléfono o correo…" }}
      >
        <Button onClick={() => setModalOpen(true)}>+ Nuevo paciente</Button>
      </Toolbar>

      <DynamicTable
        data={filtered}
        columns={patientColumns}
        showToolbar={false}
        showPagination={false}
        emptyMessage={`Sin resultados para "${search}"`}
      />

      <CreatePatientModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
