import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { db } from '../../../prisma/db.js';

/**
 * Serializa las operaciones que dependen del saldo de un tratamiento (cambiar
 * su presupuesto o registrar un pago). Debe llamarse dentro de la transacción,
 * antes de leer el dinero recibido: sin el bloqueo, un cambio de presupuesto y
 * un pago simultáneos leerían el mismo saldo y ambos pasarían su validación.
 */
export async function lockTreatmentBalance(
  tx: TransactionContext,
  treatmentId: string,
): Promise<void> {
  const lockKey = `dentistry:treatment-balance:${treatmentId}`;
  await tx.execute(
    db.raw.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS locked`
      .returnsRow({ locked: 'pg/text@1' })
      .build(),
  );
}
