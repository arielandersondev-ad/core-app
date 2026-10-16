import { Injectable, BadRequestException } from '@nestjs/common';
import {
  Patient,
  PatientSex,
  PatientStatus,
} from '../../domain/entities/patient.entity.js';
import { PatientRepository } from '../../domain/repositories/patient.repository.js';

export interface CreatePatientCommand {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: Date | null;
  sex?: PatientSex | string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: PatientStatus;
  createdByMembershipId: string;
}

@Injectable()
export class CreatePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(command: CreatePatientCommand): Promise<Patient> {
    if (!command.firstName || !command.firstName.trim()) {
      throw new BadRequestException('El nombre del paciente es obligatorio.');
    }
    if (!command.lastName || !command.lastName.trim()) {
      throw new BadRequestException('El apellido del paciente es obligatorio.');
    }

    const patient = new Patient({
      organizationId: command.organizationId,
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone,
      email: command.email,
      birthDate: command.birthDate,
      sex: command.sex,
      documentType: command.documentType,
      documentNumber: command.documentNumber,
      address: command.address,
      notes: command.notes,
      status: command.status ?? 'ACTIVE',
      createdByMembershipId: command.createdByMembershipId,
    });

    return this.patientRepository.create(patient);
  }
}
