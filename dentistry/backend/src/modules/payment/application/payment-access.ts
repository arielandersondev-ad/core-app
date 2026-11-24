import { Injectable } from '@nestjs/common';
import { PatientRepository } from '../../patient/domain/repositories/patient.repository.js';
import type { PaymentScope } from '../domain/repositories/payment.repository.js';
import { PaymentErrors } from './payment.errors.js';

@Injectable()
export class PaymentAccess {
  constructor(private readonly patientRepository: PatientRepository) {}

  /** 404 si el paciente no existe, está eliminado o es de otra organización. */
  async assertPatient(scope: PaymentScope): Promise<void> {
    const patient = await this.patientRepository.findById(
      scope.patientId,
      scope.organizationId,
    );
    if (!patient || patient.deletedAt !== null) {
      throw PaymentErrors.patientNotFound();
    }
  }
}
