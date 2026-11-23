import { Injectable } from '@nestjs/common';
import type { TreatmentWithBalance } from '../../domain/entities/treatment.entity.js';
import {
  TreatmentRepository,
  type TreatmentScope,
} from '../../domain/repositories/treatment.repository.js';
import { TreatmentAccess } from '../treatment-access.js';
import { assertValidBudget, normalizeText } from '../treatment-rules.js';
import { TreatmentErrors } from '../treatment.errors.js';

export type CreateTreatmentCommand = TreatmentScope & {
  serviceId?: string | null;
  estimatedSessions?: number | null;
  agreedPriceMinor?: number | null;
  currency?: string | null;
  diagnosisSummary?: string | null;
  notes?: string | null;
  actorMembershipId: string;
};

@Injectable()
export class CreateTreatmentUseCase {
  constructor(
    private readonly access: TreatmentAccess,
    private readonly treatments: TreatmentRepository,
  ) {}

  async execute(command: CreateTreatmentCommand): Promise<TreatmentWithBalance> {
    const scope: TreatmentScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);

    const agreedPriceMinor = command.agreedPriceMinor ?? null;
    const currency = agreedPriceMinor === null ? null : (command.currency ?? null);
    // Una moneda suelta, sin presupuesto, se rechaza en vez de ignorarse.
    assertValidBudget({
      agreedPriceMinor,
      currency: command.currency ?? null,
    });

    const serviceId = command.serviceId ?? null;
    if (
      serviceId &&
      !(await this.treatments.serviceExists(command.organizationId, serviceId))
    ) {
      throw TreatmentErrors.serviceNotFound();
    }

    return this.treatments.create({
      ...scope,
      serviceId,
      // El profesional responsable es siempre la membresía de la sesión.
      practitionerMembershipId: command.actorMembershipId,
      estimatedSessions: command.estimatedSessions ?? null,
      agreedPriceMinor,
      currency,
      diagnosisSummary: normalizeText(command.diagnosisSummary),
      notes: normalizeText(command.notes),
      createdByMembershipId: command.actorMembershipId,
    });
  }
}
