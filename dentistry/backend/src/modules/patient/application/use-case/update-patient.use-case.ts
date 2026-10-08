import { Injectable, NotFoundException } from '@nestjs/common';
import { Patient } from '../../domain/entities/patient.entity.js';
import { PatientRepository } from '../../domain/repositories/patient.repository.js';

export interface UpdatePatientCommand {
  id: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: Date | null;
  sex?: string | null;
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

    if (!patient || patient.deleted) {
      throw new NotFoundException('Paciente no encontrado');
    }

    patient.updateDetails({
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
      updatedByMembershipId: command.updatedByMembershipId,
    });

    return this.patientRepository.update(patient);
  }
}
