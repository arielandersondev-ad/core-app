import { Injectable } from '@nestjs/common';
import { PlanEntitlementsReader } from '../../../auth/application/ports/plan-entitlements.reader.js';
import { PatientRepository } from '../../domain/repositories/patient.repository.js';

export type PatientQuota = {
  /** Pacientes no eliminados de la organización. */
  used: number;
  /** null: el plan no define cupo de pacientes. */
  limit: number | null;
};

@Injectable()
export class GetPatientQuotaUseCase {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly entitlements: PlanEntitlementsReader,
  ) {}

  async execute(organizationId: string): Promise<PatientQuota> {
    const [used, plan] = await Promise.all([
      this.patientRepository.countSeats(organizationId),
      this.entitlements.read(organizationId),
    ]);
    return { used, limit: plan?.limits.patients ?? null };
  }
}
