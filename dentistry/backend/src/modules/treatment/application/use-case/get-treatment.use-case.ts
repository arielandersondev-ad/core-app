import { Injectable } from '@nestjs/common';
import type { TreatmentWithBalance } from '../../domain/entities/treatment.entity.js';
import {
  TreatmentRepository,
  type TreatmentScope,
} from '../../domain/repositories/treatment.repository.js';
import { TreatmentAccess } from '../treatment-access.js';
import { TreatmentErrors } from '../treatment.errors.js';

@Injectable()
export class GetTreatmentUseCase {
  constructor(
    private readonly access: TreatmentAccess,
    private readonly treatments: TreatmentRepository,
  ) {}

  async execute(
    scope: TreatmentScope,
    treatmentId: string,
  ): Promise<TreatmentWithBalance> {
    await this.access.assertPatient(scope);
    const treatment = await this.treatments.findById(scope, treatmentId);
    if (!treatment) throw TreatmentErrors.treatmentNotFound();
    return treatment;
  }
}
