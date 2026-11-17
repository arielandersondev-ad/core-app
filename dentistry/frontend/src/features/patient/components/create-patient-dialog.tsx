"use client";

import { ResponsiveModal, Icons } from "@/shared/components/ui";
import { PatientForm } from "@/features/patient/components/forms/patient-form";
import { useCreatePatient } from "@/features/patient/hooks/use-create-patient";
import type { CreatePatientRequest, PatientDto } from "@/features/patient/types/patient";

type Props = { onClose: () => void; onCreated: (patient: PatientDto) => void };

export function CreatePatientDialog({ onClose, onCreated }: Props) {
  const mutation = useCreatePatient();
  const handleClose = () => { if (!mutation.isPending) onClose(); };

  async function handleCreate(values: CreatePatientRequest) {
    try {
      const patient = await mutation.mutateAsync(values);
      onCreated(patient);
      onClose();
    } catch {
      // The mutation exposes the error; keep the form mounted with its values.
    }
  }

  return (
    <ResponsiveModal
      open
      onClose={handleClose}
      title="Nuevo paciente"
      description="Registra los datos personales y de contacto del paciente."
      icon={Icons.users}
      breakpoint={768}
      snapPoint="auto"
      maxWidth="max-w-2xl"
    >
      <PatientForm onSubmit={handleCreate} onCancel={handleClose} isSubmitting={mutation.isPending} error={mutation.error} />
    </ResponsiveModal>
  );
}
