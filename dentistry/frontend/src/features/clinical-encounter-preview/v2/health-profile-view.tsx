"use client";

import { Button, Icons } from "@/shared/components/ui";
import { PageHeader } from "./page-header";
import type { HealthProfile, Patient } from "../types";
import { computeAge, HEALTH_PROFILE_FIELDS } from "./demo-store";
import { DemoTags, Panel, TextBlock } from "./demo-ui";

export function HealthProfileView({
  patient,
  profile,
  onBack,
  onEdit,
}: {
  patient: Patient;
  profile: HealthProfile;
  onBack: () => void;
  onEdit: () => void;
}) {
  const hasAllergies = Boolean(profile.allergies.trim());

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 py-2 text-sm text-primary transition-colors hover:underline"
      >
        <span className="inline-flex rotate-180">{Icons.chevronRight}</span>
        Volver al historial
      </button>

      <PageHeader
        title="Perfil de salud"
        description={`Antecedentes persistentes de ${patient.fullName} · ${computeAge(patient.birthDate)} años`}
        breadcrumbs={[{ label: patient.fullName }, { label: "Atenciones" }, { label: "Perfil de salud" }]}
        action={
          <Button variant="primary" leftIcon={DemoTags.edit} onClick={onEdit}>
            Editar perfil
          </Button>
        }
      />

      {hasAllergies ? (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 text-danger">
          <span className="mt-0.5 shrink-0">{Icons.alertTriangle}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide">Alerta de alergias</p>
            <p className="mt-0.5 text-sm leading-relaxed">{profile.allergies}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-muted">
          <span className="mt-0.5 shrink-0">{DemoTags.pulse}</span>
          <p className="text-sm">Sin alergias registradas. Vacío significa "sin registrar", no "sin alergias".</p>
        </div>
      )}

      <Panel id="ce-health-fields" title="Antecedentes registrados" description="Seis textos opcionales del perfil persistente (PatientHealthProfile)." icon={DemoTags.pulse}>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {HEALTH_PROFILE_FIELDS.map((field) => (
            <TextBlock key={field.key} label={field.label} value={profile[field.key]} />
          ))}
        </div>
      </Panel>
    </>
  );
}
