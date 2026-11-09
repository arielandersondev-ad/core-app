import {
  mockAppointmentPractitioners,
  mockAppointments,
  mockBranches,
  mockPractitioners,
  mockTreatmentProcedures,
  mockTreatments,
  seedClinicalEncounters,
  seedClinicalFiles,
  seedPatientHealthProfile,
} from "@/features/clinical-encounter/data/mock";
import { ClinicalEncounterStateError } from "@/features/clinical-encounter/services/clinical-encounter.error";
import type { ClinicalEncounterDataSource } from "@/features/clinical-encounter/services/clinical-encounter.service";
import type {
  ClinicalEncounter,
  ClinicalEncounterProcedure,
  ClinicalFile,
  EncounterReferenceData,
  PatientHealthProfile,
} from "@/features/clinical-encounter/types/clinical-encounter";

const LATENCY_MIN_MS = 120;
const LATENCY_MAX_MS = 180;

let sequence = 0;

const encountersByPatient = new Map<string, ClinicalEncounter[]>();
const healthProfilesByPatient = new Map<string, PatientHealthProfile>();
const filesByPatient = new Map<string, ClinicalFile[]>();

function simulateLatency(): Promise<void> {
  const delay = LATENCY_MIN_MS + Math.round(Math.random() * (LATENCY_MAX_MS - LATENCY_MIN_MS));
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

function ensureSeeded(patientId: string): void {
  if (!encountersByPatient.has(patientId)) {
    encountersByPatient.set(patientId, seedClinicalEncounters(patientId));
  }
  if (!healthProfilesByPatient.has(patientId)) {
    healthProfilesByPatient.set(patientId, seedPatientHealthProfile(patientId));
  }
  if (!filesByPatient.has(patientId)) {
    filesByPatient.set(patientId, seedClinicalFiles(patientId));
  }
}

function cloneProcedure(procedure: ClinicalEncounterProcedure): ClinicalEncounterProcedure {
  return { ...procedure };
}

function cloneEncounter(encounter: ClinicalEncounter): ClinicalEncounter {
  return { ...encounter, procedures: encounter.procedures.map(cloneProcedure) };
}

function cloneHealthProfile(profile: PatientHealthProfile): PatientHealthProfile {
  return { ...profile };
}

function cloneFile(file: ClinicalFile): ClinicalFile {
  return { ...file };
}

function referenceData(): EncounterReferenceData {
  return {
    branches: mockBranches.map((item) => ({ ...item })),
    practitioners: mockPractitioners.map((item) => ({ ...item })),
    appointments: mockAppointments.map((item) => ({ ...item })),
    treatments: mockTreatments.map((item) => ({ ...item })),
    treatmentProcedures: mockTreatmentProcedures.map((item) => ({ ...item })),
  };
}

function findEncounter(patientId: string, encounterId: string): ClinicalEncounter {
  const encounter = encountersByPatient.get(patientId)?.find((item) => item.id === encounterId);
  if (!encounter) {
    throw new Error("Atención clínica no encontrada.");
  }
  return encounter;
}

export function createClinicalEncounterMockDataSource(): ClinicalEncounterDataSource {
  return {
    async list(patientId, filters = {}) {
      await simulateLatency();
      ensureSeeded(patientId);

      const search = filters.search?.trim().toLowerCase();
      const filtered = (encountersByPatient.get(patientId) ?? [])
        .filter((encounter) => {
          if (filters.status && encounter.status !== filters.status) return false;
          if (
            filters.practitionerMembershipId &&
            encounter.practitionerMembershipId !== filters.practitionerMembershipId
          ) {
            return false;
          }
          if (search) {
            const haystack = [
              encounter.chiefComplaint,
              encounter.examinationSummary,
              encounter.diagnosisSummary,
              encounter.procedureSummary,
              encounter.notes,
              encounter.practitionerName,
              encounter.branchName,
              ...encounter.procedures.map((procedure) => procedure.description),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            if (!haystack.includes(search)) return false;
          }
          return true;
        })
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt));

      const page = filters.page;
      const pageSize = filters.pageSize;
      const paginated =
        page && pageSize && page > 0 && pageSize > 0
          ? filtered.slice((page - 1) * pageSize, page * pageSize)
          : filtered;

      return paginated.map(cloneEncounter);
    },

    async get(patientId, encounterId) {
      await simulateLatency();
      ensureSeeded(patientId);
      return cloneEncounter(findEncounter(patientId, encounterId));
    },

    async create(input) {
      await simulateLatency();
      ensureSeeded(input.patientId);

      if (input.appointmentId) {
        const duplicatedAppointment = (encountersByPatient.get(input.patientId) ?? []).some(
          (item) => item.appointmentId === input.appointmentId && item.status !== "VOIDED",
        );
        if (duplicatedAppointment) {
          throw new ClinicalEncounterStateError(
            "Ya existe una atención no anulada para esta cita.",
          );
        }
      }

      const branch = mockBranches.find((item) => item.id === input.branchId);
      const practitionerId =
        (input.appointmentId && mockAppointmentPractitioners[input.appointmentId]) ||
        mockPractitioners[0].id;
      const practitioner =
        mockPractitioners.find((item) => item.id === practitionerId) ?? mockPractitioners[0];

      const encounterId = nextId(`${input.patientId}-encounter`);
      const encounter: ClinicalEncounter = {
        id: encounterId,
        patientId: input.patientId,
        branchId: input.branchId,
        branchName: branch?.label,
        practitionerMembershipId: practitioner.id,
        practitionerName: practitioner.label,
        startedAt: input.startedAt,
        chiefComplaint: input.chiefComplaint ?? null,
        examinationSummary: input.examinationSummary ?? null,
        diagnosisSummary: input.diagnosisSummary ?? null,
        procedureSummary: input.procedureSummary ?? null,
        progressNotes: input.progressNotes ?? null,
        patientInstructions: input.patientInstructions ?? null,
        notes: input.notes ?? null,
        status: "IN_PROGRESS",
        appointmentId: input.appointmentId,
        treatmentId: input.treatmentId,
        procedures: [],
        rowVersion: 1,
      };

      encountersByPatient.get(input.patientId)?.unshift(encounter);
      return cloneEncounter(encounter);
    },

    async complete(patientId, encounterId, input) {
      await simulateLatency();
      ensureSeeded(patientId);

      const encounter = findEncounter(patientId, encounterId);
      if (encounter.status !== "IN_PROGRESS") {
        throw new ClinicalEncounterStateError("Solo se puede completar una atención en curso.");
      }

      encounter.status = "COMPLETED";
      encounter.endedAt = input.endedAt;
      encounter.completedAt = new Date().toISOString();
      encounter.completedByMembershipId = encounter.practitionerMembershipId;
      encounter.completedByName = encounter.practitionerName;
      delete encounter.voidedAt;
      delete encounter.voidedByMembershipId;
      delete encounter.voidReason;
      if (input.procedureSummary !== undefined) {
        encounter.procedureSummary = input.procedureSummary;
      }
      encounter.rowVersion = (encounter.rowVersion ?? 1) + 1;

      return cloneEncounter(encounter);
    },

    async void(patientId, encounterId, input) {
      await simulateLatency();
      ensureSeeded(patientId);

      const encounter = findEncounter(patientId, encounterId);
      if (encounter.status === "VOIDED") {
        throw new ClinicalEncounterStateError("La atención ya está anulada.");
      }

      const reason = input.reason.trim();
      if (!reason) {
        throw new ClinicalEncounterStateError("El motivo de anulación es obligatorio.");
      }

      encounter.status = "VOIDED";
      encounter.voidedAt = new Date().toISOString();
      // Actor simulado: en el backend será el membership de la sesión autenticada.
      encounter.voidedByMembershipId = encounter.practitionerMembershipId;
      encounter.voidReason = reason;
      encounter.rowVersion = (encounter.rowVersion ?? 1) + 1;

      return cloneEncounter(encounter);
    },

    async addProcedures(patientId, encounterId, procedures) {
      await simulateLatency();
      ensureSeeded(patientId);

      const encounter = findEncounter(patientId, encounterId);
      if (encounter.status !== "IN_PROGRESS") {
        throw new ClinicalEncounterStateError(
          "Solo se pueden registrar procedimientos en una atención en curso.",
        );
      }

      const created = procedures.map<ClinicalEncounterProcedure>((draft, index) => ({
        id: `${encounter.id}-procedure-${Date.now().toString(36)}-${index + 1}`,
        clinicalEncounterId: encounter.id,
        targetType: draft.targetType,
        toothNumber: draft.toothNumber,
        targetDescription: draft.targetDescription,
        description: draft.description,
        treatmentProcedureId: draft.treatmentProcedureId,
        status: "RECORDED",
      }));

      encounter.procedures.push(...created);
      encounter.rowVersion = (encounter.rowVersion ?? 1) + 1;

      return created.map(cloneProcedure);
    },

    async getHealthProfile(patientId) {
      await simulateLatency();
      ensureSeeded(patientId);
      return cloneHealthProfile(healthProfilesByPatient.get(patientId)!);
    },

    async saveHealthProfile(patientId, input) {
      await simulateLatency();
      ensureSeeded(patientId);

      const current = healthProfilesByPatient.get(patientId)!;
      const profile: PatientHealthProfile = {
        ...input,
        patientId,
        updatedAt: new Date().toISOString(),
        rowVersion: (current.rowVersion ?? 0) + 1,
      };

      healthProfilesByPatient.set(patientId, profile);
      return cloneHealthProfile(profile);
    },

    async listFiles(patientId, encounterId) {
      await simulateLatency();
      ensureSeeded(patientId);

      return (filesByPatient.get(patientId) ?? [])
        .filter((file) => (encounterId ? file.clinicalEncounterId === encounterId : true))
        .map(cloneFile);
    },

    async addFile(patientId, input) {
      await simulateLatency();
      ensureSeeded(patientId);

      const file: ClinicalFile = {
        ...input,
        id: nextId(`${patientId}-file`),
        patientId,
        createdAt: new Date().toISOString(),
        uploadStatus: "READY",
      };

      filesByPatient.get(patientId)?.unshift(file);
      return cloneFile(file);
    },

    async removeFile(patientId, fileId) {
      await simulateLatency();
      ensureSeeded(patientId);

      const files = filesByPatient.get(patientId) ?? [];
      const index = files.findIndex((file) => file.id === fileId);
      if (index < 0) {
        throw new Error("Archivo clínico no encontrado.");
      }

      files.splice(index, 1);
    },

    async getReferenceData() {
      await simulateLatency();
      return referenceData();
    },
  };
}
