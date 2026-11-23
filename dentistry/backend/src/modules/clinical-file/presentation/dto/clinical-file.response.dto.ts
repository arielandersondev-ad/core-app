import type { PresignedRequest } from '../../application/ports/file-storage.js';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';

/** No expone proveedor, bucket ni clave del objeto: el acceso es por enlace firmado. */
export class ClinicalFileResponseDto {
  id: string;
  patientId: string;
  clinicalEncounterId: string | null;
  category: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  capturedAt: string | null;
  description: string | null;
  uploadStatus: string;
  uploadedAt: string | null;
  uploadedByMembershipId: string;
  createdAt: string;
  /** Se reenvía como `expectedUpdatedAt` al editar. */
  updatedAt: string;

  static fromEntity(file: ClinicalFile): ClinicalFileResponseDto {
    const dto = new ClinicalFileResponseDto();
    dto.id = file.id;
    dto.patientId = file.patientId;
    dto.clinicalEncounterId = file.clinicalEncounterId;
    dto.category = file.category;
    dto.originalFilename = file.originalFilename;
    dto.mimeType = file.mimeType;
    dto.sizeBytes = file.sizeBytes;
    dto.capturedAt = file.capturedAt?.toISOString() ?? null;
    dto.description = file.description;
    dto.uploadStatus = file.uploadStatus;
    dto.uploadedAt = file.uploadedAt?.toISOString() ?? null;
    dto.uploadedByMembershipId = file.uploadedByMembershipId;
    dto.createdAt = file.createdAt.toISOString();
    dto.updatedAt = file.updatedAt.toISOString();
    return dto;
  }
}

export class PresignedRequestResponseDto {
  url: string;
  method: 'PUT' | 'GET';
  headers: Record<string, string>;
  expiresAt: string;

  static fromRequest(request: PresignedRequest): PresignedRequestResponseDto {
    const dto = new PresignedRequestResponseDto();
    dto.url = request.url;
    dto.method = request.method;
    dto.headers = request.headers;
    dto.expiresAt = request.expiresAt.toISOString();
    return dto;
  }
}

export class ClinicalFileUploadResponseDto {
  file: ClinicalFileResponseDto;
  upload: PresignedRequestResponseDto;
}
