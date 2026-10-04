import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import { ClinicalEncounterRepository } from '../../domain/repositories/clinical-encounter.repository.js';

export interface CreateClinicalEncounterCommand {
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  appointmentId?: string | null;
  treatmentId?: string | null;
  startedAt: Date;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  procedurePerformed?: string | null;
  evolution?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
}

@Injectable()
export class CreateClinicalEncounterUseCase {
  constructor(private readonly clinicalEncounterRepository: ClinicalEncounterRepository) {}

  async execute(command: CreateClinicalEncounterCommand): Promise<ClinicalEncounter> {
    // appointmentId es único en el contrato: una cita genera como máximo una consulta.
    if (command.appointmentId) {
      const existing =
        await this.clinicalEncounterRepository.findByAppointmentId(command.appointmentId);

      if (existing) {
        throw new ConflictException(
          'La cita indicada ya tiene una consulta registrada.',
        );
      }
    }

    const encounter = new ClinicalEncounter({
      organizationId: command.organizationId,
      branchId: command.branchId,
      patientId: command.patientId,
      appointmentId: command.appointmentId,
      treatmentId: command.treatmentId,
      professionalMembershipId: command.professionalMembershipId,
      startedAt: command.startedAt,
      chiefComplaint: command.chiefComplaint,
      diagnosis: command.diagnosis,
      procedurePerformed: command.procedurePerformed,
      evolution: command.evolution,
      recommendations: command.recommendations,
      notes: command.notes,
      createdByMembershipId: command.createdByMembershipId,
    });

    try {
      return await this.clinicalEncounterRepository.create(encounter);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('La cita indicada ya tiene una consulta registrada.');
      }
      throw new BadRequestException(
        'No fue posible registrar la consulta. Verifique los datos enviados.',
      );
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    const candidate = error as { code?: string; message?: string } | null;
    if (!candidate) return false;
    if (candidate.code === 'P2002') return true;
    return typeof candidate.message === 'string' && candidate.message.includes('appointmentId');
  }
}