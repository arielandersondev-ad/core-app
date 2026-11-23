import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { ClinicalFile } from '../../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type FindClinicalFilesFilters,
} from '../../domain/repositories/clinical-file.repository.js';
import { ClinicalFileAccess } from '../clinical-file-access.js';

/** Galería del paciente: solo archivos READY no eliminados. */
@Injectable()
export class ListClinicalFilesUseCase {
  constructor(
    private readonly access: ClinicalFileAccess,
    private readonly fileRepository: ClinicalFileRepository,
  ) {}

  async execute(filters: FindClinicalFilesFilters): Promise<PaginatedResult<ClinicalFile>> {
    await this.access.assertPatient(filters);
    return this.fileRepository.findPage(filters);
  }
}
