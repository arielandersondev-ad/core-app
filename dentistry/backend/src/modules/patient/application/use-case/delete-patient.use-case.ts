import { Injectable } from '@nestjs/common';
import type { Patient } from '../../domain/entities/patient.entity.js';
import { PatientRepository } from '../../domain/repositories/patient.repository.js';

@Injectable()
export class DeletePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  execute(command: {
    id: string;
    organizationId: string;
    deletedByMembershipId: string;
  }): Promise<Patient> {
    return this.patientRepository.softDelete(
      command.id,
      command.organizationId,
      command.deletedByMembershipId,
    );
  }
}
