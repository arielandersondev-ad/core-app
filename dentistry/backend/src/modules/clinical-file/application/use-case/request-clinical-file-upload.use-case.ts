import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PlanEntitlementsReader } from '../../../auth/application/ports/plan-entitlements.reader.js';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type ClinicalFileScope,
} from '../../domain/repositories/clinical-file.repository.js';
import { buildClinicalFileObjectKey } from '../../domain/value-objects/clinical-file-object-key.js';
import {
  extensionFor,
  isClinicalFileMimeType,
  MAX_CLINICAL_FILE_BYTES,
  type ClinicalFileCategory,
} from '../../domain/value-objects/clinical-file-type.js';
import { sanitizeFilename } from '../../domain/value-objects/filename.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';
import { ClinicalFileErrors } from '../clinical-file.errors.js';
import type { PresignedRequest } from '../ports/file-storage.js';

/** Vigencia de la URL de subida. */
export const UPLOAD_URL_SECONDS = 5 * 60;
/** La reserva dura más que la URL para dar tiempo a confirmar tras subir. */
export const UPLOAD_RESERVATION_SECONDS = 15 * 60;

export type RequestClinicalFileUploadCommand = ClinicalFileScope & {
  authorizedBranchIds: string[];
  actorMembershipId: string;
  category: ClinicalFileCategory;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  clinicalEncounterId?: string;
  capturedAt?: Date;
  description?: string | null;
};

export type ClinicalFileUploadTicket = {
  file: ClinicalFile;
  upload: PresignedRequest;
};

@Injectable()
export class RequestClinicalFileUploadUseCase {
  constructor(
    private readonly access: ClinicalFileAccess,
    private readonly fileRepository: ClinicalFileRepository,
    private readonly entitlements: PlanEntitlementsReader,
  ) {}

  async execute(
    command: RequestClinicalFileUploadCommand,
    now: Date = new Date(),
  ): Promise<ClinicalFileUploadTicket> {
    this.access.assertStorageAvailable();
    const { mimeType } = command;
    if (!isClinicalFileMimeType(mimeType)) throw ClinicalFileErrors.unsupportedType();
    if (command.sizeBytes > MAX_CLINICAL_FILE_BYTES) throw ClinicalFileErrors.tooLarge();

    const scope: ClinicalFileScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);

    if (command.clinicalEncounterId) {
      const encounter = await this.access.assertEncounterBranch(
        scope,
        command.clinicalEncounterId,
        command.authorizedBranchIds,
      );
      if (encounter.status === 'VOIDED') throw ClinicalFileErrors.encounterVoided();
    }

    // Un cupo ausente es inválido, no ilimitado (target-schema-dictionary §7.1).
    const plan = await this.entitlements.read(command.organizationId, now);
    const fileStorageBytes = plan?.limits.fileStorageBytes ?? null;
    const filesPerPatient = plan?.limits.filesPerPatient ?? null;
    if (fileStorageBytes === null || filesPerPatient === null) {
      throw ClinicalFileErrors.quotaNotConfigured();
    }

    const storage = this.access.storage;
    const file = await this.fileRepository.reserve(
      {
        ...scope,
        clinicalEncounterId: command.clinicalEncounterId ?? null,
        category: command.category,
        storageProvider: storage.provider,
        bucket: storage.bucket,
        objectKey: buildClinicalFileObjectKey({
          ...scope,
          objectId: randomUUID(),
          extension: extensionFor(mimeType),
        }),
        originalFilename: sanitizeFilename(command.originalFilename),
        mimeType,
        sizeBytes: command.sizeBytes,
        capturedAt: command.capturedAt ?? null,
        description: command.description?.trim() || null,
        uploadedByMembershipId: command.actorMembershipId,
        uploadExpiresAt: new Date(now.getTime() + UPLOAD_RESERVATION_SECONDS * 1000),
      },
      { fileStorageBytes, filesPerPatient },
      now,
    );

    try {
      const upload = await this.access.callStorage('presign-upload', () =>
        storage.createUploadRequest({
          objectKey: file.objectKey,
          contentType: file.mimeType,
          sizeBytes: file.sizeBytes,
          expiresInSeconds: UPLOAD_URL_SECONDS,
        }),
      );
      return { file, upload };
    } catch (error) {
      await this.fileRepository.markFailed(scope, file.id);
      throw error;
    }
  }
}
