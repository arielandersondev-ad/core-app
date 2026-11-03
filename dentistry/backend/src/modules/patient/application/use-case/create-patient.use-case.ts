import { Injectable } from '@nestjs/common';
import type { Patient } from '../../domain/entities/patient.entity.js';
import {
  PatientRepository,
  type PatientCreateData,
} from '../../domain/repositories/patient.repository.js';
import { validatePatient } from '../validate-patient.js';
import type { CreatePatientInput } from '../contracts/create-patient.input.js';

@Injectable()
export class CreatePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(command: CreatePatientInput): Promise<Patient> {
    const patient: PatientCreateData = {
      organizationId: command.organizationId,
      firstName: command.firstName.trim(),
      lastName: command.lastName.trim(),
      phone: command.phone?.trim() ?? null,
      email: command.email?.trim() ?? null,
      birthDate: command.birthDate ?? null,
      sex: command.sex ?? null,
      documentType: command.documentType?.trim() || null,
      documentNumber: command.documentNumber?.trim() || null,
      address: command.address?.trim() ?? null,
      notes: command.notes?.trim() ?? null,
      status: command.status ?? 'ACTIVE',
      createdByMembershipId: command.createdByMembershipId,
      updatedByMembershipId: null,
      deletedAt: null,
    };

    validatePatient(patient);
    return this.patientRepository.create(patient);
  }
}
