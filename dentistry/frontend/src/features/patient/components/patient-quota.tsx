"use client";

import { usePatientQuota } from "@/features/patient/hooks/use-patient-quota";
import {
  isPatientLimitReached,
  PATIENT_LIMIT_MESSAGE,
  patientQuotaLabel,
} from "@/features/patient/utils/patient-quota";

/** "Pacientes del plan: N / 300". No se muestra si el plan no tiene cupo. */
export function PatientQuotaCounter() {
  const label = patientQuotaLabel(usePatientQuota().data);
  if (!label) return null;
  return (
    <span className="whitespace-nowrap text-xs text-muted" aria-label={`Pacientes del plan: ${label}`}>
      Pacientes del plan: <span className="font-mono font-medium text-foreground">{label}</span>
    </span>
  );
}

/** Aviso visible cuando la organización alcanzó el cupo de pacientes. */
export function PatientLimitNotice() {
  if (!isPatientLimitReached(usePatientQuota().data)) return null;
  return (
    <p role="status" className="rounded-lg border border-warning/30 bg-warning-subtle px-4 py-3 text-sm text-foreground">
      {PATIENT_LIMIT_MESSAGE}
    </p>
  );
}
