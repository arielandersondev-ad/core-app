"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  ClinicalEncounter,
  ClinicalFile,
  EncounterProcedure,
  HealthProfile,
  Patient,
} from "../types";
import {
  mockAppointments,
  mockBranches,
  mockEncounters,
  mockFiles,
  mockHealthProfile,
  mockPatient,
  mockProfessionals,
  mockTreatmentProcedures,
  mockTreatments,
} from "../data/mock";

/** Tono visual del aviso efímero. */
export type ToastTone = "success" | "info" | "warning" | "danger";

export interface DemoToast {
  id: string;
  message: string;
  tone: ToastTone;
}

/** Borrador de atención que se completará en la vista de creación. */
export interface EncounterDraft {
  branchName: string;
  professionalName: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  appointmentId?: string;
  treatmentId?: string;
  examinationSummary: string;
  clinicalNotes: string;
  procedureSummary: string;
  procedures: EncounterProcedure[];
}

export interface CompleteEncounterInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  procedureSummary: string;
}

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

export function buildInstant(date: string, time: string): string {
  if (!date) return new Date().toISOString();
  const safeTime = time || "00:00";
  const parsed = new Date(`${date}T${safeTime}:00`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/** Campos editables del perfil de salud persistente. */
export const HEALTH_PROFILE_FIELDS: { key: keyof HealthProfile; label: string; hint: string }[] = [
  { key: "medicalHistory", label: "Antecedentes médicos", hint: "Enfermedades sistémicas, cirugías, hospitalizaciones." },
  { key: "allergies", label: "Alergias", hint: "Medicamentos, látex, anestésicos u otras." },
  { key: "currentMedications", label: "Medicación actual", hint: "Nombre, dosis y frecuencia." },
  { key: "dentalHistory", label: "Antecedentes odontológicos", hint: "Tratamientos previos relevantes." },
  { key: "relevantConditions", label: "Condiciones relevantes", hint: "Bruxismo, sensibilidad, hábitos." },
  { key: "observations", label: "Observaciones", hint: "Notas generales del perfil." },
];

export const emptyHealthProfile: HealthProfile = {
  medicalHistory: "",
  allergies: "",
  currentMedications: "",
  dentalHistory: "",
  relevantConditions: "",
  observations: "",
};

/**
 * Estado en memoria del prototipo. No hay validación, red ni persistencia:
 * solo permite navegar y simular las transiciones para refinar la interfaz.
 */
export function useDemoStore() {
  const patient: Patient = mockPatient;

  const [encounters, setEncounters] = useState<ClinicalEncounter[]>(() => mockEncounters);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(mockHealthProfile);
  const [files, setFiles] = useState<ClinicalFile[]>(mockFiles);
  const [toasts, setToasts] = useState<DemoToast[]>([]);

  const pushToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId("toast");
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const createEncounter = useCallback((draft: EncounterDraft): string => {
    const id = nextId("enc");
    const encounter: ClinicalEncounter = {
      id,
      patientId: patient.id,
      branchName: draft.branchName,
      professionalName: draft.professionalName,
      startedAt: buildInstant(draft.startDate, draft.startTime),
      examinationSummary: draft.examinationSummary,
      procedureSummary: draft.procedureSummary || undefined,
      clinicalNotes: draft.clinicalNotes || undefined,
      status: "IN_PROGRESS",
      appointmentId: draft.appointmentId || undefined,
      treatmentId: draft.treatmentId || undefined,
      procedures: draft.procedures,
    };
    setEncounters((current) => [encounter, ...current]);
    return id;
  }, [patient.id]);

  const completeEncounter = useCallback((id: string, input: CompleteEncounterInput) => {
    setEncounters((current) =>
      current.map((encounter) =>
        encounter.id === id
          ? {
              ...encounter,
              status: "COMPLETED",
              endedAt: buildInstant(input.date, input.time),
              completedBy: encounter.professionalName,
              procedureSummary: input.procedureSummary || encounter.procedureSummary,
            }
          : encounter,
      ),
    );
  }, []);

  const voidEncounter = useCallback((id: string, reason: string) => {
    setEncounters((current) =>
      current.map((encounter) =>
        encounter.id === id ? { ...encounter, status: "VOIDED", voidReason: reason } : encounter,
      ),
    );
  }, []);

  const addProcedure = useCallback((encounterId: string, procedure: EncounterProcedure) => {
    setEncounters((current) =>
      current.map((encounter) =>
        encounter.id === encounterId
          ? { ...encounter, procedures: [...encounter.procedures, procedure] }
          : encounter,
      ),
    );
  }, []);

  const addFile = useCallback((file: ClinicalFile) => {
    setFiles((current) => [file, ...current]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const saveHealthProfile = useCallback((profile: HealthProfile) => {
    setHealthProfile(profile);
  }, []);

  const getEncounter = useCallback(
    (id: string | null) => encounters.find((encounter) => encounter.id === id),
    [encounters],
  );

  return useMemo(
    () => ({
      patient,
      encounters,
      healthProfile,
      files,
      toasts,
      branches: mockBranches,
      professionals: mockProfessionals,
      treatments: mockTreatments,
      treatmentProcedures: mockTreatmentProcedures,
      appointments: mockAppointments,
      getEncounter,
      createEncounter,
      completeEncounter,
      voidEncounter,
      addProcedure,
      addFile,
      removeFile,
      saveHealthProfile,
      pushToast,
      dismissToast,
    }),
    [
      patient,
      encounters,
      healthProfile,
      files,
      toasts,
      getEncounter,
      createEncounter,
      completeEncounter,
      voidEncounter,
      addProcedure,
      addFile,
      removeFile,
      saveHealthProfile,
      pushToast,
      dismissToast,
    ],
  );
}

export type DemoStore = ReturnType<typeof useDemoStore>;

export const statusLabels: Record<ClinicalEncounter["status"], string> = {
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  VOIDED: "Anulada",
};

export const targetTypeLabels: Record<EncounterProcedure["targetType"], string> = {
  TOOTH: "Pieza dental",
  REGION: "Región",
  WHOLE_MOUTH: "Boca completa",
  OTHER: "Otro",
};

/** Edad derivada de la fecha de nacimiento (fecha civil, sin desfase de zona). */
export function computeAge(birthDate: string): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function formatDateTimeShort(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDateOnly(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
}

export function formatTimeOnly(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function durationLabel(startIso: string, endIso?: string): string {
  if (!endIso) return "En curso";
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "—";
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
