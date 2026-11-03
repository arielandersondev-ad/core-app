"use client";

import { Modal, Icons } from "@/shared/components/ui";
import { PatientForm } from "@/features/patient/components/forms/patient-form";
import { useUpdatePatient } from "@/features/patient/hooks/use-update-patient";
import type { PatientDto, UpdatePatientRequest } from "@/features/patient/types/patient";

type Props = { patient: PatientDto; onClose: () => void; onUpdated: (patient: PatientDto) => void };

export function UpdatePatientDialog({ patient, onClose, onUpdated }: Props) {
  const mutation = useUpdatePatient(patient.id);
  const handleClose = () => { if (!mutation.isPending) onClose(); };

  async function handleUpdate(values: UpdatePatientRequest) {
    try {
      const updated = await mutation.mutateAsync({
        ...values,
        phone: values.phone ?? null,
        email: values.email ?? null,
        birthDate: values.birthDate ?? null,
        sex: values.sex ?? null,
        documentType: values.documentType ?? null,
        documentNumber: values.documentNumber ?? null,
        address: values.address ?? null,
        notes: values.notes ?? null,
      });
      onUpdated(updated);
      onClose();
    } catch {
      // Keep the form mounted so the user can review the error and retry.
    }
  }

  return (
    <Modal open onClose={handleClose} title="Editar paciente" description={`Actualiza los datos de ${patient.fullName}.`} icon={Icons.users} maxWidth="max-w-2xl">
      <PatientForm patient={patient} onSubmit={handleUpdate} onCancel={handleClose} isSubmitting={mutation.isPending} error={mutation.error} />
    </Modal>
  );
}
