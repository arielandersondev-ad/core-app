import { Injectable, NotFoundException } from '@nestjs/common';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PatientRepository } from '../../domain/repositories/patient.repository.js';

@Injectable()
export class GetPatientByIdUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(id: string, organizationId: string): Promise<Patient> {
    const patient = await this.patientRepository.findById(id, organizationId);
    if (!patient || patient.deleted) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return patient;
  }
}
