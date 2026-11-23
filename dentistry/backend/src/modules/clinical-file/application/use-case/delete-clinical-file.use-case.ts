import { Injectable } from '@nestjs/common';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type ClinicalFileScope,
} from '../../domain/repositories/clinical-file.repository.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';
import { ClinicalFileErrors } from '../clinical-file.errors.js';

export type DeleteClinicalFileCommand = ClinicalFileScope & {
  fileId: string;
  authorizedBranchIds: readonly string[];
  actorMembershipId: string;
};

/**
 * Retirada lógica: el objeto se conserva en el almacenamiento hasta que exista
 * una política de retención clínica (target-schema-dictionary §5.6). Un
 * archivo de una atención exige acceso a la sucursal de esa atención.
 */
@Injectable()
export class DeleteClinicalFileUseCase {
  constructor(
    private readonly access: ClinicalFileAccess,
    private readonly fileRepository: ClinicalFileRepository,
  ) {}

  async execute(
    command: DeleteClinicalFileCommand,
    now: Date = new Date(),
  ): Promise<ClinicalFile> {
    const file = await this.access.loadFile(command, command.fileId);
    if (file.clinicalEncounterId) {
      await this.access.assertEncounterBranch(
        command,
        file.clinicalEncounterId,
        command.authorizedBranchIds,
      );
    }
    const deleted = await this.fileRepository.softDelete(
      command,
      command.fileId,
      command.actorMembershipId,
      now,
    );
    if (!deleted) throw ClinicalFileErrors.fileNotFound();
    return deleted;
  }
}
