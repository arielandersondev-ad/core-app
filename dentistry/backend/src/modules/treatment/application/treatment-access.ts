import { Injectable } from '@nestjs/common';
import { PatientRepository } from '../../patient/domain/repositories/patient.repository.js';
import type { TreatmentScope } from '../domain/repositories/treatment.repository.js';
import { TreatmentErrors } from './treatment.errors.js';

@Injectable()
export class TreatmentAccess {
  constructor(private readonly patientRepository: PatientRepository) {}

  /** 404 si el paciente no existe, está eliminado o es de otra organización. */
  async assertPatient(scope: TreatmentScope): Promise<void> {
    const patient = await this.patientRepository.findById(
      scope.patientId,
      scope.organizationId,
    );
    if (!patient || patient.deletedAt !== null) {
      throw TreatmentErrors.patientNotFound();
    }
  }
}
