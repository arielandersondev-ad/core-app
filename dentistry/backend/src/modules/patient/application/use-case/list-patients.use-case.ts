import { Injectable } from '@nestjs/common';
import type { Patient } from '../../domain/entities/patient.entity.js';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import {
  FindPatientsFilters,
  PatientRepository,
} from '../../domain/repositories/patient.repository.js';

@Injectable()
export class ListPatientsUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute( filters: FindPatientsFilters ): Promise<PaginatedResult<Patient>> {
    return this.patientRepository.findByFilters(filters);
  }
}
