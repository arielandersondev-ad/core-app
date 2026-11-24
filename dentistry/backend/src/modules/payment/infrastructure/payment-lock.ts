import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { db } from '../../../prisma/db.js';

/**
 * Serializa los cobros de una misma atención. El índice único parcial de la
 * base ya impide dos pagos vigentes, pero el bloqueo permite responder con un
 * error de dominio claro en vez de una violación de unicidad.
 *
 * Orden de bloqueos: primero la atención y después el tratamiento
 * (`lockTreatmentBalance`), siempre igual, para que dos cobros no se bloqueen
 * entre sí.
 */
export async function lockEncounterPayment(
  tx: TransactionContext,
  encounterId: string,
): Promise<void> {
  const lockKey = `dentistry:encounter-payment:${encounterId}`;
  await tx.execute(
    db.raw.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS locked`
      .returnsRow({ locked: 'pg/text@1' })
      .build(),
  );
}
