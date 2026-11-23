import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { ClinicalFile } from '../entities/clinical-file.entity.js';
import type { ClinicalFileCategory } from '../value-objects/clinical-file-type.js';

export type ClinicalFileScope = {
  organizationId: string;
  patientId: string;
};

export type ClinicalFileReservation = ClinicalFileScope & {
  clinicalEncounterId: string | null;
  category: ClinicalFile['category'];
  storageProvider: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: ClinicalFile['mimeType'];
  sizeBytes: number;
  capturedAt: Date | null;
  description: string | null;
  uploadedByMembershipId: string;
  uploadExpiresAt: Date;
};

/** Cupos del plan vigente; ambos son obligatorios para reservar. */
export type ClinicalFileQuota = {
  fileStorageBytes: number;
  filesPerPatient: number;
};

export type ClinicalFileUsage = {
  usedBytes: number;
};

export type FindClinicalFilesFilters = ClinicalFileScope & {
  clinicalEncounterId?: string;
  category?: ClinicalFileCategory;
  page?: number;
  pageSize?: number;
};

/** Atención a la que se vincula un archivo; null si no es del paciente. */
export type EncounterReference = {
  branchId: string;
  status: string;
};

export abstract class ClinicalFileRepository {
  /**
   * Crea el registro PENDING dentro de una transacción que serializa por
   * organización y comprueba ambos cupos (archivos READY y reservas vigentes).
   */
  abstract reserve(
    data: ClinicalFileReservation,
    quota: ClinicalFileQuota,
    now: Date,
  ): Promise<ClinicalFile>;

  /** Archivo no eliminado del paciente, en cualquier estado de subida. */
  abstract findById(scope: ClinicalFileScope, id: string): Promise<ClinicalFile | null>;

  /** Solo archivos READY no eliminados, del más reciente al más antiguo. */
  abstract findPage(filters: FindClinicalFilesFilters): Promise<PaginatedResult<ClinicalFile>>;

  /** PENDING → READY y registro de auditoría; null si ya no estaba PENDING. */
  abstract markReady(
    scope: ClinicalFileScope,
    id: string,
    change: { checksumSha256: string; uploadedAt: Date; actorMembershipId: string },
  ): Promise<ClinicalFile | null>;

  /** PENDING → FAILED; libera la reserva. */
  abstract markFailed(scope: ClinicalFileScope, id: string): Promise<void>;

  /** Retirada lógica y auditoría; null si ya estaba eliminado. */
  abstract softDelete(
    scope: ClinicalFileScope,
    id: string,
    actorMembershipId: string,
    now: Date,
  ): Promise<ClinicalFile | null>;

  abstract usage(organizationId: string, now: Date): Promise<ClinicalFileUsage>;

  abstract findEncounter(
    scope: ClinicalFileScope,
    encounterId: string,
  ): Promise<EncounterReference | null>;
}
