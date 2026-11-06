import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/infrastructure/prisma.service.js';
import type { Patient } from '../../../patient/domain/entities/patient.entity.js';
import { validatePatient } from '../../../patient/application/validate-patient.js';
import { toPatientEntity } from '../../../patient/infrastructure/patient.mapper.js';

export interface ConvertPersonToPatientCommand {
  organizationId: string;
  personId: string;
  membershipId: string;
  patientData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string | null;
    birthDate?: Date | null;
    sex?: string | null;
    documentType?: string | null;
    documentNumber?: string | null;
    address?: string | null;
    notes?: string | null;
  };
}

export interface ConvertPersonToPatientResult {
  patient: Patient;
  reassignedAppointmentsCount: number;
}

@Injectable()
export class ConvertPersonToPatientUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    command: ConvertPersonToPatientCommand,
  ): Promise<ConvertPersonToPatientResult> {
    const { organizationId, personId, membershipId, patientData = {} } = command;

    return this.prisma.transaction(async (tx) => {
      const personRow = await tx.orm.dentistry.Person.first({
        id: personId,
        organizationId,
      });

      if (!personRow || personRow.deletedAt) {
        throw new NotFoundException('Persona no encontrada o dada de baja.');
      }

      if (personRow.convertedToPatientId) {
        throw new ConflictException(
          'La persona ya fue convertida a paciente previamente.',
        );
      }

      const firstName = patientData.firstName?.trim() || personRow.firstName;
      const lastName =
        patientData.lastName?.trim() ||
        (personRow.lastName ? personRow.lastName.trim() : '') ||
        '-';
      const phone =
        patientData.phone !== undefined
          ? (patientData.phone?.trim() || null)
          : (personRow.phone ?? null);
      const email =
        patientData.email !== undefined
          ? (patientData.email?.trim() || null)
          : personRow.email;
      const notes =
        patientData.notes !== undefined
          ? (patientData.notes?.trim() || null)
          : personRow.notes;
      const birthDate = patientData.birthDate ?? null;
      const sex = patientData.sex ?? null;
      const documentType = patientData.documentType?.trim() || null;
      const documentNumber = patientData.documentNumber?.trim() || null;
      const address = patientData.address?.trim() || null;

      const patientCandidate = {
        organizationId,
        firstName,
        lastName,
        phone,
        email,
        birthDate,
        sex: (sex as 'MALE' | 'FEMALE' | 'OTHER' | null),
        documentType,
        documentNumber,
        address,
        notes,
        status: 'ACTIVE' as const,
        createdByMembershipId: membershipId,
        updatedByMembershipId: membershipId,
      };

      validatePatient(patientCandidate);

      if (documentType && documentNumber) {
        const existingDoc = await tx.orm.dentistry.Patient.first({
          organizationId,
          documentType,
          documentNumber,
        });
        if (existingDoc && !existingDoc.deletedAt) {
          throw new ConflictException(
            'Ya existe un paciente con el mismo documento en la organización.',
          );
        }
      }

      const createdPatientRow = await tx.orm.dentistry.Patient.create({
        organizationId,
        firstName,
        lastName,
        phone,
        email,
        birthDate,
        sex,
        documentType,
        documentNumber,
        address,
        notes,
        status: 'ACTIVE',
        createdByMembershipId: membershipId,
        updatedByMembershipId: membershipId,
      });

      const now = new Date();
      await tx.orm.dentistry.Person.where({
        id: personId,
        organizationId,
      }).update({
        convertedToPatientId: createdPatientRow.id,
        convertedAt: now,
        updatedByMembershipId: membershipId,
      });

      const appointmentsToUpdate = await tx.orm.dentistry.Appointment.where({
        organizationId,
        personId: personRow.id,
      }).all();

      if (appointmentsToUpdate.length > 0) {
        await tx.orm.dentistry.Appointment.where({
          organizationId,
          personId: personRow.id,
        }).update({
          patientId: createdPatientRow.id,
          updatedByMembershipId: membershipId,
        });
      }

      return {
        patient: toPatientEntity(createdPatientRow),
        reassignedAppointmentsCount: appointmentsToUpdate.length,
      };
    });
  }
}
