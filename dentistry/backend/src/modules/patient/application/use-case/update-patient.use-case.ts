import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Patient,
  PatientSex,
} from '../../domain/entities/patient.entity.js';
import { PatientRepository } from '../../domain/repositories/patient.repository.js';
import { validatePatient } from '../validate-patient.js';

export interface UpdatePatientCommand {
  id: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: Date | null;
  sex?: PatientSex | null;
  documentType?: string | null;
  documentNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  updatedByMembershipId: string;
}

@Injectable()
export class UpdatePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(command: UpdatePatientCommand): Promise<Patient> {
    const patient = await this.patientRepository.findById(
      command.id,
      command.organizationId,
    );

    if (!patient || patient.deletedAt !== null) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const updated: Patient = {
      ...patient,
      firstName:
        command.firstName === undefined
          ? patient.firstName
          : command.firstName.trim(),
      lastName:
        command.lastName === undefined
          ? patient.lastName
          : command.lastName.trim(),
      phone:
        command.phone === undefined
          ? patient.phone
          : (command.phone?.trim() ?? null),
      email:
        command.email === undefined
          ? patient.email
          : (command.email?.trim() ?? null),
      birthDate:
        command.birthDate === undefined ? patient.birthDate : command.birthDate,
      sex: command.sex === undefined ? patient.sex : command.sex,
      documentType:
        command.documentType === undefined
          ? patient.documentType
          : command.documentType?.trim() || null,
      documentNumber:
        command.documentNumber === undefined
          ? patient.documentNumber
          : command.documentNumber?.trim() || null,
      address:
        command.address === undefined
          ? patient.address
          : (command.address?.trim() ?? null),
      notes:
        command.notes === undefined
          ? patient.notes
          : (command.notes?.trim() ?? null),
      updatedByMembershipId: command.updatedByMembershipId,
    };

    validatePatient(updated);
    return this.patientRepository.update(updated);
  }
}
