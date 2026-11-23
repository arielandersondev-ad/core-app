import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { TreatmentWithBalance } from '../../domain/entities/treatment.entity.js';
import {
  TreatmentRepository,
  type FindTreatmentsFilters,
} from '../../domain/repositories/treatment.repository.js';
import { TreatmentAccess } from '../treatment-access.js';

@Injectable()
export class ListTreatmentsUseCase {
  constructor(
    private readonly access: TreatmentAccess,
    private readonly treatments: TreatmentRepository,
  ) {}

  async execute(
    filters: FindTreatmentsFilters,
  ): Promise<PaginatedResult<TreatmentWithBalance>> {
    await this.access.assertPatient(filters);
    return this.treatments.findPage(filters);
  }
}
