import type {
  ClinicalEncounter,
  ClinicalFile,
  EncounterReferenceOption,
  PatientHealthProfile,
  TreatmentProcedureOption,
} from "@/features/clinical-encounter/types/clinical-encounter";

export const mockBranches: EncounterReferenceOption[] = [
  { id: "branch-centro", label: "Sucursal Centro" },
  { id: "branch-norte", label: "Sucursal Norte" },
];

export const mockPractitioners: EncounterReferenceOption[] = [
  { id: "membership-torres", label: "Dra. Ana Torres" },
  { id: "membership-mena", label: "Dr. Luis Mena" },
];

export const mockAppointments: EncounterReferenceOption[] = [
  { id: "appointment-control", label: "Cita de control · 02 nov 2026, 10:00" },
  { id: "appointment-urgency", label: "Cita de urgencia · 28 oct 2026, 15:30" },
];

export const mockTreatments: EncounterReferenceOption[] = [
  { id: "treatment-ortho", label: "Tratamiento ortodóntico" },
  { id: "treatment-rehab", label: "Rehabilitación estética" },
];

export const mockTreatmentProcedures: TreatmentProcedureOption[] = [
  { id: "treatment-procedure-corona", label: "Corona 16", treatmentId: "treatment-ortho" },
  { id: "treatment-procedure-endodoncia", label: "Endodoncia 36", treatmentId: "treatment-ortho" },
  { id: "treatment-procedure-blanqueamiento", label: "Blanqueamiento", treatmentId: "treatment-rehab" },
];

/**
 * Asociación de presentación cita → practitioner. `CreateClinicalEncounterInput`
 * no recibe practitioner; el mock lo resuelve desde la cita y, si no hay cita,
 * usa el primer practitioner de referencia.
 */
export const mockAppointmentPractitioners: Record<string, string> = {
  "appointment-control": "membership-torres",
  "appointment-urgency": "membership-mena",
};

export function seedClinicalEncounters(patientId: string): ClinicalEncounter[] {
  const completedId = `${patientId}-encounter-completed`;
  const inProgressId = `${patientId}-encounter-in-progress`;
  const voidedId = `${patientId}-encounter-voided`;

  return [
    {
      id: completedId,
      patientId,
      branchId: "branch-centro",
      branchName: "Sucursal Centro",
      practitionerMembershipId: "membership-torres",
      practitionerName: "Dra. Ana Torres",
      startedAt: "2026-10-28T14:15:00.000Z",
      endedAt: "2026-10-28T15:05:00.000Z",
      chiefComplaint: "Dolor leve en zona posterior derecha.",
      examinationSummary:
        "Paciente refiere dolor leve en zona posterior derecha. Exploración: caries oclusal en 16, sin movilidad. Tejidos blandos sin alteraciones.",
      diagnosisSummary: "Caries oclusal en pieza 16.",
      procedureSummary: "Obturación con resina en 16. Profilaxis del cuadrante superior derecho.",
      progressNotes: "Se indica control en 6 meses.",
      patientInstructions: "Evitar alimentos duros durante 24 horas.",
      notes: "Atención documentada sin incidencias.",
      status: "COMPLETED",
      appointmentId: "appointment-control",
      treatmentId: "treatment-ortho",
      procedures: [
        {
          id: `${completedId}-procedure-1`,
          clinicalEncounterId: completedId,
          targetType: "TOOTH",
          toothNumber: "16",
          description: "Obturación con resina compuesta",
          treatmentProcedureId: "treatment-procedure-corona",
          status: "RECORDED",
        },
        {
          id: `${completedId}-procedure-2`,
          clinicalEncounterId: completedId,
          targetType: "REGION",
          targetDescription: "Cuadrante superior derecho",
          description: "Profilaxis profesional",
          status: "RECORDED",
        },
      ],
      completedAt: "2026-10-28T15:06:00.000Z",
      completedByMembershipId: "membership-torres",
      completedByName: "Dra. Ana Torres",
      rowVersion: 2,
    },
    {
      id: inProgressId,
      patientId,
      branchId: "branch-norte",
      branchName: "Sucursal Norte",
      practitionerMembershipId: "membership-mena",
      practitionerName: "Dr. Luis Mena",
      startedAt: "2026-11-03T15:00:00.000Z",
      chiefComplaint: "Control post-tratamiento.",
      examinationSummary: "Evolución favorable, sin dolor. Se revisa oclusión y tejidos blandos.",
      diagnosisSummary: "Sin hallazgos nuevos.",
      progressNotes: "Pendiente de cierre clínico.",
      status: "IN_PROGRESS",
      appointmentId: "appointment-urgency",
      procedures: [],
      rowVersion: 1,
    },
    {
      id: voidedId,
      patientId,
      branchId: "branch-centro",
      branchName: "Sucursal Centro",
      practitionerMembershipId: "membership-torres",
      practitionerName: "Dra. Ana Torres",
      startedAt: "2026-10-20T13:30:00.000Z",
      chiefComplaint: "Registro duplicado.",
      examinationSummary: "Atención registrada por duplicado.",
      status: "VOIDED",
      procedures: [],
      voidedAt: "2026-10-20T13:45:00.000Z",
      voidedByMembershipId: "membership-torres",
      voidReason: "Registro duplicado: la atención ya había sido documentada.",
      rowVersion: 2,
    },
  ];
}

export function seedPatientHealthProfile(patientId: string): PatientHealthProfile {
  return {
    patientId,
    medicalHistory: "Hipertensión controlada. Sin cirugías previas.",
    allergies: "Penicilina (erupción cutánea). Látex (leve).",
    currentMedications: "Losartán 50 mg cada 24 h.",
    dentalHistory: "Ortodoncia finalizada en 2021. Extracción de cordales en 2019.",
    relevantConditions: "Bruxismo nocturno. Sensibilidad dental generalizada.",
    observations: "Paciente colaboradora. Preferencia por citas matutinas.",
    updatedAt: "2026-10-28T14:20:00.000Z",
    rowVersion: 1,
  };
}

export function seedClinicalFiles(patientId: string): ClinicalFile[] {
  const encounterId = `${patientId}-encounter-completed`;

  return [
    {
      id: `${patientId}-file-radiograph`,
      patientId,
      clinicalEncounterId: encounterId,
      originalFilename: "radiografia-panoramica-2026-10.jpg",
      category: "RADIOGRAPH",
      mimeType: "image/jpeg",
      sizeBytes: 1_240_000,
      createdAt: "2026-10-28T14:20:00.000Z",
      uploadStatus: "READY",
      radiographType: "PANORAMIC",
      region: "Maxilar completo",
      laterality: "BILATERAL",
      capturedAt: "2026-10-28T14:18:00.000Z",
      notes: "Sin hallazgos relevantes.",
    },
    {
      id: `${patientId}-file-document`,
      patientId,
      clinicalEncounterId: encounterId,
      treatmentId: "treatment-ortho",
      originalFilename: "consentimiento-informado.pdf",
      category: "DOCUMENT",
      mimeType: "application/pdf",
      sizeBytes: 245_000,
      createdAt: "2026-10-28T14:05:00.000Z",
      uploadStatus: "READY",
      notes: "Consentimiento firmado por la paciente.",
    },
  ];
}
