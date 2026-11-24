import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type ClinicalFileScope,
} from '../../domain/repositories/clinical-file.repository.js';
import {
  contentMatchesMimeType,
  MAX_CLINICAL_FILE_BYTES,
} from '../../domain/value-objects/clinical-file-type.js';
import { StoredObjectTooLargeError } from '../../domain/errors/file-storage.errors.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';
import { ClinicalFileErrors } from '../clinical-file.errors.js';

export type CompleteClinicalFileUploadCommand = ClinicalFileScope & {
  fileId: string;
  actorMembershipId: string;
};

/**
 * Verifica el objeto subido antes de publicarlo: tamaño exacto, firma de bytes
 * del tipo declarado y SHA-256 calculado por el servidor (no el ETag).
 */
@Injectable()
export class CompleteClinicalFileUploadUseCase {
  constructor(
    private readonly access: ClinicalFileAccess,
    private readonly fileRepository: ClinicalFileRepository,
  ) {}

  async execute(
    command: CompleteClinicalFileUploadCommand,
    now: Date = new Date(),
  ): Promise<ClinicalFile> {
    this.access.assertStorageAvailable();
    const scope: ClinicalFileScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    const file = await this.access.loadFile(scope, command.fileId);
    if (file.uploadStatus === 'READY') return file;
    if (file.uploadStatus !== 'PENDING') throw ClinicalFileErrors.notPending();
    if (file.uploadExpiresAt && file.uploadExpiresAt <= now) {
      await this.reject(scope, file);
      throw ClinicalFileErrors.uploadExpired();
    }

    const storage = this.access.storage;
    const info = await this.access.callStorage('head', () =>
      storage.getObjectInfo(file.objectKey),
    );
    // Puede que el PUT aún no haya terminado: la reserva sigue vigente.
    if (!info) throw ClinicalFileErrors.uploadMissing();
    if (info.sizeBytes !== file.sizeBytes) {
      await this.reject(scope, file);
      throw ClinicalFileErrors.uploadRejected();
    }

    let bytes: Uint8Array;
    try {
      bytes = await this.access.callStorage('read', () =>
        storage.readObject(file.objectKey, MAX_CLINICAL_FILE_BYTES),
      );
    } catch (error) {
      if (!(error instanceof StoredObjectTooLargeError)) throw error;
      await this.reject(scope, file);
      throw ClinicalFileErrors.uploadRejected();
    }
    if (
      bytes.byteLength !== file.sizeBytes ||
      !contentMatchesMimeType(file.mimeType, bytes)
    ) {
      await this.reject(scope, file);
      throw ClinicalFileErrors.uploadRejected();
    }

    const ready = await this.fileRepository.markReady(scope, file.id, {
      checksumSha256: createHash('sha256').update(bytes).digest('hex'),
      uploadedAt: now,
      actorMembershipId: command.actorMembershipId,
    });
    if (ready) return ready;
    // Otra confirmación simultánea ganó: devolver su resultado si quedó listo.
    const current = await this.fileRepository.findById(scope, file.id);
    if (current?.uploadStatus === 'READY') return current;
    throw ClinicalFileErrors.notPending();
  }

  private async reject(scope: ClinicalFileScope, file: ClinicalFile): Promise<void> {
    await this.fileRepository.markFailed(scope, file.id);
    await this.access.discardObject(file.objectKey);
  }
}
