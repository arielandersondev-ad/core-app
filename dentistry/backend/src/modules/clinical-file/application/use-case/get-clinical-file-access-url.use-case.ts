import { Injectable } from '@nestjs/common';
import type { ClinicalFileScope } from '../../domain/repositories/clinical-file.repository.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';
import { ClinicalFileErrors } from '../clinical-file.errors.js';
import type { PresignedRequest } from '../ports/file-storage.js';

/** Vigencia del enlace de lectura: suficiente para abrirlo, no para compartirlo. */
export const ACCESS_URL_SECONDS = 2 * 60;

export type GetClinicalFileAccessUrlCommand = ClinicalFileScope & {
  fileId: string;
  disposition: 'inline' | 'attachment';
};

@Injectable()
export class GetClinicalFileAccessUrlUseCase {
  constructor(private readonly access: ClinicalFileAccess) {}

  async execute(command: GetClinicalFileAccessUrlCommand): Promise<PresignedRequest> {
    this.access.assertStorageAvailable();
    const file = await this.access.loadFile(command, command.fileId);
    if (file.uploadStatus !== 'READY') throw ClinicalFileErrors.notReady();
    const storage = this.access.storage;
    return this.access.callStorage('presign-download', () =>
      storage.createDownloadRequest({
        objectKey: file.objectKey,
        contentType: file.mimeType,
        filename: file.originalFilename,
        disposition: command.disposition,
        expiresInSeconds: ACCESS_URL_SECONDS,
      }),
    );
  }
}
