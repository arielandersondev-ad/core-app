import { Injectable } from '@nestjs/common';
import { Patient } from '../../domain/entities/patient.entity.js';
import {
  FindPatientsFilters,
  PatientRepository,
} from '../../domain/repositories/patient.repository.js';

@Injectable()
export class ListPatientsUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(filters: FindPatientsFilters): Promise<Patient[]> {
    return this.patientRepository.findByFilters(filters);
  }
}
