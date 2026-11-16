import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { db } from '../../../prisma/db.js';
import { PlanLimitReachedException } from '../../auth/application/contracts/plan-limit-reached.exception.js';

/** Ocupan cupo todos los pacientes no eliminados; inactivar un paciente no lo libera. */
export async function countPatientSeats(
  client: Pick<TransactionContext, 'orm'>,
  organizationId: string,
): Promise<number> {
  const { totalItems } = await client.orm.dentistry.Patient.where({
    organizationId,
    deletedAt: null,
  }).aggregate((aggregate) => ({ totalItems: aggregate.count() }));
  return totalItems;
}

/**
 * Debe llamarse dentro de la transacción que crea el paciente, antes del INSERT.
 * El bloqueo por organización serializa las altas simultáneas: sin él, dos
 * transacciones leerían el mismo conteo y ambas pasarían el cupo.
 */
export async function assertPatientSeatAvailable(
  tx: TransactionContext,
  organizationId: string,
  limit: number | null,
): Promise<void> {
  if (limit === null) return;
  const lockKey = `dentistry:patient-seats:${organizationId}`;
  await tx.execute(
    db.raw.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS locked`
      .returnsRow({ locked: 'pg/text@1' })
      .build(),
  );
  if ((await countPatientSeats(tx, organizationId)) >= limit) {
    throw new PlanLimitReachedException('patients', limit);
  }
}
