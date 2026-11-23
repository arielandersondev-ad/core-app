import { Injectable } from '@nestjs/common';
import { PlanEntitlementsReader } from '../../../auth/application/ports/plan-entitlements.reader.js';
import { ClinicalFileRepository } from '../../domain/repositories/clinical-file.repository.js';
import {
  CLINICAL_FILE_MIME_TYPES,
  MAX_CLINICAL_FILE_BYTES,
} from '../../domain/value-objects/clinical-file-type.js';

export type ClinicalFileQuotaView = {
  usedBytes: number;
  limitBytes: number | null;
  filesPerPatient: number | null;
  maxFileBytes: number;
  allowedMimeTypes: string[];
  /** False si el backend arrancó sin almacenamiento configurado. */
  storageAvailable: boolean;
};

@Injectable()
export class GetClinicalFileQuotaUseCase {
  constructor(
    private readonly fileRepository: ClinicalFileRepository,
    private readonly entitlements: PlanEntitlementsReader,
  ) {}

  async execute(
    organizationId: string,
    storageAvailable: boolean,
    now: Date = new Date(),
  ): Promise<ClinicalFileQuotaView> {
    const [plan, usage] = await Promise.all([
      this.entitlements.read(organizationId, now),
      this.fileRepository.usage(organizationId, now),
    ]);
    return {
      usedBytes: usage.usedBytes,
      limitBytes: plan?.limits.fileStorageBytes ?? null,
      filesPerPatient: plan?.limits.filesPerPatient ?? null,
      maxFileBytes: MAX_CLINICAL_FILE_BYTES,
      allowedMimeTypes: [...CLINICAL_FILE_MIME_TYPES],
      storageAvailable,
    };
  }
}
