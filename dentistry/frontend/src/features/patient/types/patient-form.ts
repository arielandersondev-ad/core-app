import type { z } from "zod";
import type { createPatientSchema } from "@/features/patient/schemas/create-patient.schema";
import type { PatientDto } from "@/features/patient/types/patient";

export type PatientFormValues = z.input<typeof createPatientSchema>;

export const initialPatientValues: PatientFormValues = {
  firstName: "", lastName: "", phone: "", email: "", birthDate: "", sex: "",
  documentType: "", documentNumber: "", address: "", notes: "",
};

export function patientToFormValues(patient: PatientDto): PatientFormValues {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    birthDate: patient.birthDate?.slice(0, 10) ?? "",
    sex: patient.sex ?? "",
    documentType: patient.documentType ?? "",
    documentNumber: patient.documentNumber ?? "",
    address: patient.address ?? "",
    notes: patient.notes ?? "",
  };
}
