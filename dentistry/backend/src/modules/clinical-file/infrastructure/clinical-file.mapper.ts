import type {
  ClinicalFile,
  ClinicalFileUploadStatus,
} from '../domain/entities/clinical-file.entity.js';
import type {
  ClinicalFileCategory,
  ClinicalFileMimeType,
} from '../domain/value-objects/clinical-file-type.js';

export interface ClinicalFileRow {
  id: string;
  organizationId: string;
  patientId: string;
  clinicalEncounterId: string | null;
  treatmentId: string | null;
  appointmentId: string | null;
  category: string;
  storageProvider: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
  capturedAt: Date | null;
  description: string | null;
  uploadedByMembershipId: string;
  uploadStatus: string;
  uploadExpiresAt: Date | null;
  uploadedAt: Date | null;
  deletedAt: Date | null;
  deletedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Los CHECK de la tabla garantizan categoría y estado; el tipo lo valida el servidor al reservar. */
export function toClinicalFileEntity(row: ClinicalFileRow): ClinicalFile {
  return {
    ...row,
    category: row.category as ClinicalFileCategory,
    mimeType: row.mimeType as ClinicalFileMimeType,
    uploadStatus: row.uploadStatus as ClinicalFileUploadStatus,
  };
}
