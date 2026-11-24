import { Injectable } from '@nestjs/common';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type ClinicalFileDetailsChange,
  type ClinicalFileScope,
} from '../../domain/repositories/clinical-file.repository.js';
import type { ClinicalFileCategory } from '../../domain/value-objects/clinical-file-type.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';
import { ClinicalFileErrors } from '../clinical-file.errors.js';

export type UpdateClinicalFileCommand = ClinicalFileScope & {
  fileId: string;
  authorizedBranchIds: readonly string[];
  actorMembershipId: string;
  /** `updatedAt` que leyó el cliente; si cambió, la edición se rechaza. */
  expectedUpdatedAt: Date;
  /** undefined conserva el valor; null borra descripción o fecha de captura. */
  category?: ClinicalFileCategory;
  description?: string | null;
  capturedAt?: Date | null;
};

/**
 * Edita solo los datos descriptivos guardados en la base. El objeto del
 * almacenamiento, el paciente y la atención del archivo no cambian.
 */
@Injectable()
export class UpdateClinicalFileUseCase {
  constructor(
    private readonly access: ClinicalFileAccess,
    private readonly fileRepository: ClinicalFileRepository,
  ) {}

  async execute(command: UpdateClinicalFileCommand): Promise<ClinicalFile> {
    const file = await this.access.loadFile(command, command.fileId);
    if (file.uploadStatus !== 'READY') throw ClinicalFileErrors.notReady();
    if (file.clinicalEncounterId) {
      await this.access.assertEncounterBranch(
        command,
        file.clinicalEncounterId,
        command.authorizedBranchIds,
      );
    }
    if (file.updatedAt.getTime() !== command.expectedUpdatedAt.getTime()) {
      throw ClinicalFileErrors.conflict();
    }

    const change = changedDetails(file, command);
    // Sin diferencias no hay nada que escribir ni auditar.
    if (Object.keys(change).length === 0) return file;

    const updated = await this.fileRepository.updateDetails(
      command,
      command.fileId,
      change,
      file.updatedAt,
      command.actorMembershipId,
    );
    if (!updated) throw ClinicalFileErrors.conflict();
    return updated;
  }
}

function changedDetails(
  file: ClinicalFile,
  command: UpdateClinicalFileCommand,
): ClinicalFileDetailsChange {
  const change: ClinicalFileDetailsChange = {};
  if (command.category !== undefined && command.category !== file.category) {
    change.category = command.category;
  }
  if (command.description !== undefined) {
    const description = command.description?.trim() || null;
    if (description !== file.description) change.description = description;
  }
  if (
    command.capturedAt !== undefined &&
    (command.capturedAt?.getTime() ?? null) !== (file.capturedAt?.getTime() ?? null)
  ) {
    change.capturedAt = command.capturedAt;
  }
  return change;
}
