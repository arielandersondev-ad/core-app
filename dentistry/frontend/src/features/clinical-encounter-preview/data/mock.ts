import type {
  Patient,
  ClinicalEncounter,
  HealthProfile,
  ClinicalFile,
} from "../types";

export const mockPatient: Patient = {
  id: "pat-preview-1",
  fullName: "María Fernanda López",
  firstName: "María Fernanda",
  lastName: "López",
  birthDate: "1992-04-18",
  sex: "Femenino",
  phone: "+593 99 123 4567",
  email: "maria.lopez@example.com",
  address: "Av. Amazonas 123, Quito",
  status: "ACTIVE",
};

export const mockBranches = ["Sucursal Centro", "Sucursal Norte"];
export const mockProfessionals = ["Dra. Ana Torres", "Dr. Luis Mena"];
export const mockTreatments = [
  { id: "trt-1", label: "Tratamiento ortodóntico 2025" },
  { id: "trt-2", label: "Rehabilitación estética" },
];
export const mockTreatmentProcedures = [
  { id: "tp-1", label: "tp-1 · Corona 16", treatmentId: "trt-1" },
  { id: "tp-2", label: "tp-2 · Endodoncia 36", treatmentId: "trt-1" },
  { id: "tp-3", label: "tp-3 · Blanqueamiento", treatmentId: "trt-2" },
];

export const mockAppointments = [
  { id: "apt-1", label: "Cita 2026-11-02 10:00 · Control" },
  { id: "apt-2", label: "Cita 2026-10-28 15:30 · Urgencia" },
];

export const mockHealthProfile: HealthProfile = {
  medicalHistory: "Hipertensión controlada. Sin cirugías previas.",
  allergies: "Penicilina (erupción cutánea). Látex (leve).",
  currentMedications: "Losartán 50 mg cada 24 h.",
  dentalHistory: "Ortodoncia finalizada en 2021. Extracción de cordales en 2019.",
  relevantConditions: "Bruxismo nocturno. Sensibilidad dental generalizada.",
  observations: "Paciente colaboradora. Preferencia por citas matutinas.",
};

export const mockEncounters: ClinicalEncounter[] = [
  {
    id: "enc-1",
    patientId: mockPatient.id,
    branchName: "Sucursal Centro",
    professionalName: "Dra. Ana Torres",
    startedAt: "2026-10-28T10:15:00.000Z",
    endedAt: "2026-10-28T11:05:00.000Z",
    examinationSummary:
      "Paciente refiere dolor leve en zona posterior derecha. Exploración: caries oclusal en 16, sin movilidad. Tejidos blandos sin alteraciones.",
    procedureSummary: "Obturación con resina en 16. Ajuste oclusal.",
    clinicalNotes: "Se indica control en 6 meses.",
    status: "COMPLETED",
    appointmentId: "apt-2",
    treatmentId: "trt-1",
    procedures: [
      {
        id: "proc-1",
        targetType: "TOOTH",
        toothNumber: "16",
        description: "Obturación con resina compuesta",
        treatmentProcedureId: "tp-1",
      },
    ],
    completedBy: "Dra. Ana Torres",
  },
  {
    id: "enc-2",
    patientId: mockPatient.id,
    branchName: "Sucursal Norte",
    professionalName: "Dr. Luis Mena",
    startedAt: "2026-11-03T09:00:00.000Z",
    examinationSummary: "Control post-tratamiento. Evolución favorable, sin dolor.",
    status: "IN_PROGRESS",
    procedures: [],
  },
];

export const mockFiles: ClinicalFile[] = [
  {
    id: "file-1",
    name: "radiografia-panoramica-2026-10.jpg",
    category: "RADIOGRAPH",
    mimeType: "image/jpeg",
    sizeBytes: 1_240_000,
    createdAt: "2026-10-28T10:20:00.000Z",
    radiographType: "PANORAMIC",
    region: "Maxilar completo",
    notes: "Sin hallazgos relevantes.",
  },
  {
    id: "file-2",
    name: "consentimiento-informado.pdf",
    category: "ATTACHMENT",
    mimeType: "application/pdf",
    sizeBytes: 245_000,
    createdAt: "2026-10-28T10:05:00.000Z",
  },
];