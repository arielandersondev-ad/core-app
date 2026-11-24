import type {
  ClinicalFileCategory,
  ClinicalFileMimeType,
} from '../value-objects/clinical-file-type.js';

export const CLINICAL_FILE_UPLOAD_STATUSES = ['PENDING', 'READY', 'FAILED'] as const;
export type ClinicalFileUploadStatus = (typeof CLINICAL_FILE_UPLOAD_STATUSES)[number];

/** Metadatos de un objeto privado del almacenamiento (target-schema-dictionary §5.6). */
export type ClinicalFile = {
  id: string;
  organizationId: string;
  patientId: string;
  clinicalEncounterId: string | null;
  treatmentId: string | null;
  appointmentId: string | null;
  category: ClinicalFileCategory;
  storageProvider: string;
  bucket: string;
  objectKey: string;
  originalFilename: string;
  mimeType: ClinicalFileMimeType;
  sizeBytes: number;
  checksumSha256: string | null;
  capturedAt: Date | null;
  description: string | null;
  uploadedByMembershipId: string;
  uploadStatus: ClinicalFileUploadStatus;
  uploadExpiresAt: Date | null;
  uploadedAt: Date | null;
  deletedAt: Date | null;
  deletedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
