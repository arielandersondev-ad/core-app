import {
  CLOSED_TREATMENT_STATUSES,
  type TreatmentStatus,
  type TreatmentWithBalance,
} from '../domain/entities/treatment.entity.js';
import type { TreatmentChange } from '../domain/repositories/treatment.repository.js';
import { TreatmentErrors } from './treatment.errors.js';

/** El presupuesto se guarda como entero `int4` de unidades menores (centavos). */
export const MAX_AGREED_PRICE_MINOR = 2_147_483_647;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** Recorta y convierte la cadena vacía en null. */
export function normalizeText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type Budget = { agreedPriceMinor: number | null; currency: string | null };

/**
 * Presupuesto y moneda van juntos: sin importe no hay moneda y con importe la
 * moneda es obligatoria (misma regla que la restricción de la base).
 */
export function assertValidBudget(budget: Budget): void {
  const { agreedPriceMinor, currency } = budget;
  if (agreedPriceMinor === null) {
    if (currency !== null) {
      throw TreatmentErrors.invalidBudget(
        'No se puede indicar una moneda sin presupuesto.',
      );
    }
    return;
  }
  if (
    !Number.isInteger(agreedPriceMinor) ||
    agreedPriceMinor < 0 ||
    agreedPriceMinor > MAX_AGREED_PRICE_MINOR
  ) {
    throw TreatmentErrors.invalidBudget(
      'El presupuesto debe ser un entero mayor o igual a cero, en unidades menores.',
    );
  }
  if (currency === null || !CURRENCY_PATTERN.test(currency)) {
    throw TreatmentErrors.invalidBudget(
      'La moneda es obligatoria con presupuesto y debe tener 3 letras mayúsculas (ej. BOB).',
    );
  }
}

export type TreatmentPatch = {
  status?: TreatmentStatus;
  estimatedSessions?: number | null;
  agreedPriceMinor?: number | null;
  currency?: string | null;
  diagnosisSummary?: string | null;
  notes?: string | null;
};

/**
 * Decide el cambio de un tratamiento ya leído bajo bloqueo (con su dinero
 * recibido). Lanza el error de dominio correspondiente si la regla no se cumple.
 */
export function decideTreatmentChange(
  current: TreatmentWithBalance,
  patch: TreatmentPatch,
  actorMembershipId: string,
  now: Date,
): TreatmentChange {
  if (CLOSED_TREATMENT_STATUSES.includes(current.status)) {
    throw TreatmentErrors.closed();
  }

  const change: TreatmentChange = { updatedByMembershipId: actorMembershipId };

  if (patch.estimatedSessions !== undefined) {
    change.estimatedSessions = patch.estimatedSessions;
  }
  if (patch.diagnosisSummary !== undefined) {
    change.diagnosisSummary = normalizeText(patch.diagnosisSummary);
  }
  if (patch.notes !== undefined) change.notes = normalizeText(patch.notes);

  if (patch.agreedPriceMinor !== undefined || patch.currency !== undefined) {
    const next: Budget = {
      agreedPriceMinor:
        patch.agreedPriceMinor !== undefined
          ? patch.agreedPriceMinor
          : current.agreedPriceMinor,
      currency:
        patch.currency !== undefined ? patch.currency : current.currency,
    };
    // Retirar el presupuesto retira también su moneda; una moneda enviada sin
    // presupuesto, en cambio, es un error y no se descarta en silencio.
    if (patch.agreedPriceMinor === null && patch.currency === undefined) {
      next.currency = null;
    }
    assertValidBudget(next);

    if (current.paidMinor > 0) {
      // Primero el importe: retirar el presupuesto de lo ya cobrado no es un
      // problema de moneda.
      if (next.agreedPriceMinor === null || next.agreedPriceMinor < current.paidMinor) {
        throw TreatmentErrors.budgetBelowPaid(current.paidMinor);
      }
      if (next.currency !== current.currency) {
        throw TreatmentErrors.currencyLocked();
      }
    }
    change.agreedPriceMinor = next.agreedPriceMinor;
    change.currency = next.currency;
  }

  if (patch.status !== undefined && patch.status !== current.status) {
    change.status = patch.status;
    if (patch.status === 'IN_PROGRESS' && current.startedAt === null) {
      change.startedAt = now;
    }
    if (patch.status === 'COMPLETED') {
      change.startedAt = current.startedAt ?? now;
      change.endedAt = now;
    }
    // La base exige inicio para registrar un fin: solo se cierra lo ya iniciado.
    if (patch.status === 'CANCELED' && current.startedAt !== null) {
      change.endedAt = now;
    }
  }

  return change;
}
