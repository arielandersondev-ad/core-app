import type {
  AccountMovement,
  EncounterSnapshot,
  Payment,
  PaymentMethod,
  TreatmentAccount,
  TreatmentSnapshot,
} from '../domain/entities/payment.entity.js';
import type {
  PaymentInsert,
  PaymentScope,
  RegistrationContext,
} from '../domain/repositories/payment.repository.js';
import { PaymentErrors } from './payment.errors.js';

/** Importe en unidades menores; `int4` en la base. */
export const MAX_PAYMENT_MINOR = 2_147_483_647;
/** Tolerancia por diferencia de reloj entre el cliente y el servidor. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
/** Un tratamiento rechazado o cancelado ya no admite cobros. */
const NOT_PAYABLE_TREATMENT_STATUSES = ['DECLINED', 'CANCELED'];

export function normalizeText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type PaymentInput = {
  amountMinor: number;
  paymentMethod: PaymentMethod;
  /** Solo para pagos sin tratamiento; con tratamiento se toma el suyo. */
  currency?: string | null;
  paidAt?: Date;
  reference?: string | null;
  notes?: string | null;
};

type Common = PaymentScope & {
  input: PaymentInput;
  authorizedBranchIds: string[];
  actorMembershipId: string;
  now: Date;
};

function assertAmount(amountMinor: number): void {
  if (
    !Number.isInteger(amountMinor) ||
    amountMinor < 1 ||
    amountMinor > MAX_PAYMENT_MINOR
  ) {
    throw PaymentErrors.invalidAmount();
  }
}

function resolvePaidAt(paidAt: Date | undefined, now: Date): Date {
  if (paidAt === undefined) return now;
  if (
    Number.isNaN(paidAt.getTime()) ||
    paidAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS
  ) {
    throw PaymentErrors.invalidPaidAt();
  }
  return paidAt;
}

/** Sin sucursal indicada solo se asume la única sucursal autorizada. */
export function resolveBranch(
  requested: string | undefined,
  authorizedBranchIds: string[],
): string {
  if (requested !== undefined) {
    if (!authorizedBranchIds.includes(requested)) {
      throw PaymentErrors.branchForbidden();
    }
    return requested;
  }
  if (authorizedBranchIds.length === 1) return authorizedBranchIds[0];
  throw PaymentErrors.branchRequired();
}

/**
 * Valida que el tratamiento pueda recibir este pago y devuelve su moneda.
 * El saldo se calcula sobre el dinero ya recibido, leído bajo bloqueo.
 */
function assertTreatmentCanReceive(
  treatment: TreatmentSnapshot,
  amountMinor: number,
  requestedCurrency: string | null | undefined,
): string {
  if (NOT_PAYABLE_TREATMENT_STATUSES.includes(treatment.status)) {
    throw PaymentErrors.treatmentNotPayable();
  }
  if (treatment.agreedPriceMinor === null || treatment.currency === null) {
    throw PaymentErrors.treatmentWithoutBudget();
  }
  if (
    requestedCurrency !== undefined &&
    requestedCurrency !== null &&
    requestedCurrency !== treatment.currency
  ) {
    throw PaymentErrors.currencyMismatch(treatment.currency);
  }
  const balanceMinor = treatment.agreedPriceMinor - treatment.paidMinor;
  if (amountMinor > balanceMinor) {
    throw PaymentErrors.exceedsBalance(Math.max(balanceMinor, 0));
  }
  return treatment.currency;
}

function buildInsert(
  common: Common,
  fields: {
    branchId: string;
    treatmentId: string | null;
    appointmentId: string | null;
    clinicalEncounterId: string | null;
    currency: string;
  },
): PaymentInsert {
  return {
    organizationId: common.organizationId,
    patientId: common.patientId,
    branchId: fields.branchId,
    treatmentId: fields.treatmentId,
    appointmentId: fields.appointmentId,
    clinicalEncounterId: fields.clinicalEncounterId,
    amountMinor: common.input.amountMinor,
    currency: fields.currency,
    paymentMethod: common.input.paymentMethod,
    reference: normalizeText(common.input.reference),
    notes: normalizeText(common.input.notes),
    paidAt: resolvePaidAt(common.input.paidAt, common.now),
    receivedByMembershipId: common.actorMembershipId,
  };
}

/** Anticipo, pago al contado o abono entre visitas: ligado solo al tratamiento. */
export function decideTreatmentPayment(
  context: RegistrationContext,
  command: Common & { treatmentId: string; branchId?: string },
): PaymentInsert {
  assertAmount(command.input.amountMinor);
  const treatment = context.treatment;
  if (!treatment) throw PaymentErrors.treatmentNotFound();
  const branchId = resolveBranch(command.branchId, command.authorizedBranchIds);
  const currency = assertTreatmentCanReceive(
    treatment,
    command.input.amountMinor,
    command.input.currency,
  );
  return buildInsert(command, {
    branchId,
    treatmentId: treatment.id,
    appointmentId: null,
    clinicalEncounterId: null,
    currency,
  });
}

/**
 * Pago de una atención (1:1). Reduce el saldo del tratamiento elegido; si no
 * hay tratamiento, es un cobro suelto que no afecta ningún saldo.
 */
export function decideEncounterPayment(
  context: RegistrationContext,
  command: Common & {
    /** Tratamiento pedido de forma explícita (p. ej. al cobrar). */
    requestedTreatmentId?: string;
  },
): PaymentInsert {
  assertAmount(command.input.amountMinor);
  const encounter: EncounterSnapshot | null = context.encounter;
  if (!encounter) throw PaymentErrors.encounterNotFound();
  if (encounter.status === 'VOIDED') throw PaymentErrors.encounterVoided();
  if (encounter.activePaymentId !== null) {
    throw PaymentErrors.encounterAlreadyPaid();
  }
  if (!command.authorizedBranchIds.includes(encounter.branchId)) {
    throw PaymentErrors.branchForbidden();
  }

  const wantsTreatment =
    command.requestedTreatmentId !== undefined || encounter.treatmentId !== null;
  let currency: string;
  let treatmentId: string | null = null;
  if (wantsTreatment) {
    if (!context.treatment) throw PaymentErrors.treatmentNotFound();
    currency = assertTreatmentCanReceive(
      context.treatment,
      command.input.amountMinor,
      command.input.currency,
    );
    treatmentId = context.treatment.id;
  } else {
    if (!command.input.currency) throw PaymentErrors.currencyRequired();
    currency = command.input.currency;
  }

  return buildInsert(command, {
    branchId: encounter.branchId,
    treatmentId,
    appointmentId: encounter.appointmentId,
    clinicalEncounterId: encounter.id,
    currency,
  });
}

/** Estado de cuenta: saldo tras cada pago vigente; los anulados no restan. */
export function buildAccount(
  treatment: TreatmentSnapshot,
  payments: Payment[],
): TreatmentAccount {
  const ordered = [...payments].sort(
    (a, b) =>
      a.paidAt.getTime() - b.paidAt.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.id.localeCompare(b.id),
  );
  let received = 0;
  const movements: AccountMovement[] = ordered.map((payment) => {
    if (payment.status !== 'COMPLETED') {
      return { payment, runningBalanceMinor: null };
    }
    received += payment.amountMinor;
    return {
      payment,
      runningBalanceMinor:
        treatment.agreedPriceMinor === null
          ? null
          : treatment.agreedPriceMinor - received,
    };
  });
  return {
    treatment: { ...treatment, paidMinor: received },
    movements,
    balanceMinor:
      treatment.agreedPriceMinor === null
        ? null
        : treatment.agreedPriceMinor - received,
  };
}

export function requireVoidReason(reason: string | null | undefined): string {
  const normalized = normalizeText(reason);
  if (normalized === null) throw PaymentErrors.voidReasonRequired();
  return normalized;
}
