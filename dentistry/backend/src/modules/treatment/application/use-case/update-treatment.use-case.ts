import { Injectable } from '@nestjs/common';
import type { TreatmentWithBalance } from '../../domain/entities/treatment.entity.js';
import {
  TreatmentRepository,
  type TreatmentScope,
} from '../../domain/repositories/treatment.repository.js';
import { TreatmentAccess } from '../treatment-access.js';
import { decideTreatmentChange, type TreatmentPatch } from '../treatment-rules.js';
import { TreatmentErrors } from '../treatment.errors.js';

export type UpdateTreatmentCommand = TreatmentScope &
  TreatmentPatch & {
    treatmentId: string;
    actorMembershipId: string;
  };

@Injectable()
export class UpdateTreatmentUseCase {
  constructor(
    private readonly access: TreatmentAccess,
    private readonly treatments: TreatmentRepository,
  ) {}

  async execute(command: UpdateTreatmentCommand): Promise<TreatmentWithBalance> {
    const scope: TreatmentScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);

    const patch: TreatmentPatch = {
      status: command.status,
      estimatedSessions: command.estimatedSessions,
      agreedPriceMinor: command.agreedPriceMinor,
      currency: command.currency,
      diagnosisSummary: command.diagnosisSummary,
      notes: command.notes,
    };
    const updated = await this.treatments.update(
      scope,
      command.treatmentId,
      (current) =>
        decideTreatmentChange(
          current,
          patch,
          command.actorMembershipId,
          new Date(),
        ),
    );
    if (!updated) throw TreatmentErrors.treatmentNotFound();
    return updated;
  }
}
