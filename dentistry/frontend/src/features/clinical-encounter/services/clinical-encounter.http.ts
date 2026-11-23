import { CLINICAL_ENCOUNTER_ENDPOINTS } from "@/features/clinical-encounter/api/endpoints";
import type { ClinicalEncounterDataSource } from "@/features/clinical-encounter/services/clinical-encounter.service";
import type {
  ClinicalEncounter,
  ClinicalEncounterProcedure,
  ClinicalFile,
  ClinicalFileQuota,
  EncounterReferenceData,
  PatientHealthProfile,
  SignedRequest,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { requestJson } from "@/infrastructure/http/request-json";
import { uploadToSignedUrl } from "@/infrastructure/http/signed-upload";
import type { PaginatedResult } from "@/shared/types/pagination";

/** Forma JSON del backend: los opcionales llegan como `null`. */
type Nullable<T> = { [K in keyof T]: T[K] | null };
type ClinicalEncounterProcedureDto = Nullable<ClinicalEncounterProcedure>;
type ClinicalEncounterDto = Nullable<Omit<ClinicalEncounter, "procedures">> & {
  procedures: ClinicalEncounterProcedureDto[];
};
type PatientHealthProfileDto = Nullable<PatientHealthProfile>;
type ClinicalFileDto = Nullable<ClinicalFile>;
type ClinicalFileUploadDto = { file: ClinicalFileDto; upload: SignedRequest };

/** Galería completa de un paciente o atención en una sola página. */
const FILES_PAGE_SIZE = 100;

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Convierte `null` en ausencia para respetar los tipos opcionales de la UI. */
function withoutNulls<T>(dto: Nullable<T>): T {
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== null),
  ) as T;
}

function toProcedure(dto: ClinicalEncounterProcedureDto): ClinicalEncounterProcedure {
  return withoutNulls<ClinicalEncounterProcedure>(dto);
}

function toEncounter({ procedures, ...dto }: ClinicalEncounterDto): ClinicalEncounter {
  // Los textos clínicos admiten `null` en el tipo de la UI; se conservan tal cual.
  return {
    ...withoutNulls<Omit<ClinicalEncounter, "procedures">>(dto),
    chiefComplaint: dto.chiefComplaint,
    examinationSummary: dto.examinationSummary,
    diagnosisSummary: dto.diagnosisSummary,
    procedureSummary: dto.procedureSummary,
    progressNotes: dto.progressNotes,
    patientInstructions: dto.patientInstructions,
    notes: dto.notes,
    procedures: procedures.map(toProcedure),
  };
}

function toHealthProfile(dto: PatientHealthProfileDto): PatientHealthProfile {
  return {
    patientId: dto.patientId ?? "",
    medicalHistory: dto.medicalHistory,
    allergies: dto.allergies,
    currentMedications: dto.currentMedications,
    dentalHistory: dto.dentalHistory,
    relevantConditions: dto.relevantConditions,
    observations: dto.observations,
    ...(dto.updatedAt ? { updatedAt: dto.updatedAt } : {}),
    ...(dto.rowVersion !== null ? { rowVersion: dto.rowVersion } : {}),
  };
}

function postJson<T>(url: string, body: unknown, method = "POST"): Promise<T> {
  return requestJson<T>(url, { method, headers: JSON_HEADERS, body: JSON.stringify(body) });
}

function toClinicalFile(dto: ClinicalFileDto): ClinicalFile {
  return withoutNulls<ClinicalFile>(dto);
}

export function createClinicalEncounterHttpDataSource(): ClinicalEncounterDataSource {
  return {
    async list(patientId, filters = {}) {
      const query = new URLSearchParams();
      for (const key of ["status", "practitionerMembershipId", "appointmentId", "search", "page", "pageSize"] as const) {
        const value = filters[key];
        if (value !== undefined && value !== "") query.set(key, String(value));
      }
      const suffix = query.size ? `?${query.toString()}` : "";
      const result = await requestJson<PaginatedResult<ClinicalEncounterDto>>(
        `${CLINICAL_ENCOUNTER_ENDPOINTS.collection(patientId)}${suffix}`,
      );
      return { items: result.items.map(toEncounter), pagination: result.pagination };
    },

    async get(patientId, encounterId) {
      return toEncounter(
        await requestJson<ClinicalEncounterDto>(CLINICAL_ENCOUNTER_ENDPOINTS.byId(patientId, encounterId)),
      );
    },

    async create(input) {
      return toEncounter(
        await postJson<ClinicalEncounterDto>(CLINICAL_ENCOUNTER_ENDPOINTS.collection(input.patientId), input),
      );
    },

    async registerQuickProcedure(patientId, input) {
      return toEncounter(
        await postJson<ClinicalEncounterDto>(CLINICAL_ENCOUNTER_ENDPOINTS.quick(patientId), input),
      );
    },

    async complete(patientId, encounterId, input) {
      return toEncounter(
        await postJson<ClinicalEncounterDto>(CLINICAL_ENCOUNTER_ENDPOINTS.complete(patientId, encounterId), input),
      );
    },

    async void(patientId, encounterId, input) {
      return toEncounter(
        await postJson<ClinicalEncounterDto>(CLINICAL_ENCOUNTER_ENDPOINTS.void(patientId, encounterId), input),
      );
    },

    async addProcedures(patientId, encounterId, procedures) {
      const created = await postJson<ClinicalEncounterProcedureDto[]>(
        CLINICAL_ENCOUNTER_ENDPOINTS.procedures(patientId, encounterId),
        { procedures },
      );
      return created.map(toProcedure);
    },

    async getHealthProfile(patientId) {
      return toHealthProfile(
        await requestJson<PatientHealthProfileDto>(CLINICAL_ENCOUNTER_ENDPOINTS.healthProfile(patientId)),
      );
    },

    async saveHealthProfile(patientId, input) {
      return toHealthProfile(
        await postJson<PatientHealthProfileDto>(CLINICAL_ENCOUNTER_ENDPOINTS.healthProfile(patientId), input, "PATCH"),
      );
    },

    getReferenceData(patientId) {
      return requestJson<EncounterReferenceData>(CLINICAL_ENCOUNTER_ENDPOINTS.referenceData(patientId));
    },

    async listFiles(patientId, encounterId) {
      const query = new URLSearchParams({ pageSize: String(FILES_PAGE_SIZE) });
      if (encounterId) query.set("clinicalEncounterId", encounterId);
      const result = await requestJson<PaginatedResult<ClinicalFileDto>>(
        `${CLINICAL_ENCOUNTER_ENDPOINTS.files(patientId)}?${query.toString()}`,
      );
      return result.items.map(toClinicalFile);
    },

    async addFile(patientId, { file, category, clinicalEncounterId, description, capturedAt, onProgress }) {
      // 1) Reserva y URL firmada; 2) el binario va directo al bucket; 3) el backend lo verifica.
      const { file: reserved, upload } = await postJson<ClinicalFileUploadDto>(
        CLINICAL_ENCOUNTER_ENDPOINTS.fileUploads(patientId),
        {
          category,
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          ...(clinicalEncounterId ? { clinicalEncounterId } : {}),
          ...(description?.trim() ? { description: description.trim() } : {}),
          ...(capturedAt ? { capturedAt } : {}),
        },
      );
      await uploadToSignedUrl(upload, file, { onProgress });
      return toClinicalFile(
        await postJson<ClinicalFileDto>(
          CLINICAL_ENCOUNTER_ENDPOINTS.fileComplete(patientId, reserved.id ?? ""),
          {},
        ),
      );
    },

    async removeFile(patientId, fileId) {
      await requestJson<ClinicalFileDto>(CLINICAL_ENCOUNTER_ENDPOINTS.fileById(patientId, fileId), {
        method: "DELETE",
      });
    },

    async getFileAccessUrl(patientId, fileId, disposition) {
      const query = new URLSearchParams({ disposition });
      return requestJson<SignedRequest>(
        `${CLINICAL_ENCOUNTER_ENDPOINTS.fileAccessUrl(patientId, fileId)}?${query.toString()}`,
      );
    },

    getFileQuota() {
      return requestJson<ClinicalFileQuota>(CLINICAL_ENCOUNTER_ENDPOINTS.fileQuota);
    },
  };
}
