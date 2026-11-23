import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type FindClinicalFilesFilters,
} from '../../domain/repositories/clinical-file.repository.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';

/**
 * Galería del paciente: solo archivos READY no eliminados. Filtrar por una
 * atención exige acceso a su sucursal, como el detalle de la atención.
 */
@Injectable()
export class ListClinicalFilesUseCase {
  constructor(
    private readonly access: ClinicalFileAccess,
    private readonly fileRepository: ClinicalFileRepository,
  ) {}

  async execute(
    filters: FindClinicalFilesFilters,
    authorizedBranchIds: readonly string[],
  ): Promise<PaginatedResult<ClinicalFile>> {
    await this.access.assertPatient(filters);
    if (filters.clinicalEncounterId) {
      await this.access.assertEncounterBranch(
        filters,
        filters.clinicalEncounterId,
        authorizedBranchIds,
      );
    }
    return this.fileRepository.findPage(filters);
  }
}
