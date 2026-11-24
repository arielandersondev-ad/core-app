import type {
  CreateTreatmentInput,
  PaymentMethod,
  RegisterPaymentInput,
  TreatmentStatus,
} from "@/features/billing/types/billing";
import { DEFAULT_CURRENCY, normalizeCurrency, parseAmountToMinor } from "@/features/billing/utils/money";

export const MAX_TITLE_LENGTH = 120;

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  QR: "QR",
  CARD: "Tarjeta",
};

export const paymentMethodOptions = (Object.keys(paymentMethodLabels) as PaymentMethod[]).map((value) => ({
  value,
  label: paymentMethodLabels[value],
}));

export const treatmentStatusLabels: Record<TreatmentStatus, string> = {
  PROPOSED: "Propuesto",
  ACCEPTED: "Aceptado",
  IN_PROGRESS: "En curso",
  ON_HOLD: "En pausa",
  COMPLETED: "Finalizado",
  DECLINED: "Rechazado",
  CANCELED: "Cancelado",
};

/** Un tratamiento rechazado o cancelado ya no admite cobros (igual que el backend). */
export function treatmentAcceptsPayments(status: TreatmentStatus): boolean {
  return status !== "DECLINED" && status !== "CANCELED";
}

export interface TreatmentFormValues {
  title: string;
  budget: string;
  currency: string;
}

export type FormResult<T> = { input: T } | { error: string };

export function toCreateTreatmentInput(values: TreatmentFormValues): FormResult<CreateTreatmentInput> {
  const title = values.title.trim();
  if (!title) return { error: "Indica el nombre del tratamiento." };
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `El nombre no puede superar ${MAX_TITLE_LENGTH} caracteres.` };
  }
  const budgetText = values.budget.trim();
  if (!budgetText) return { input: { title } };

  const agreedPriceMinor = parseAmountToMinor(budgetText);
  if (agreedPriceMinor === null) {
    return { error: "El presupuesto debe ser un importe válido, con hasta dos decimales." };
  }
  const currency = normalizeCurrency(values.currency || DEFAULT_CURRENCY);
  if (!currency) return { error: "La moneda debe tener tres letras (ej. BOB)." };
  return { input: { title, agreedPriceMinor, currency } };
}

export interface PaymentFormValues {
  amount: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  branchId: string;
  /** Solo en un cobro sin tratamiento. */
  currency: string;
}

export interface PaymentFormLimits {
  /** Saldo del tratamiento: nunca se cobra más (el backend lo vuelve a comprobar). */
  maxMinor: number | null;
  /** El cobro no está ligado a un tratamiento con presupuesto: la moneda se pide. */
  askCurrency: boolean;
  /** Hay varias sucursales y el cobro no hereda la de una atención. */
  needsBranch: boolean;
}

export function toPaymentInput(
  values: PaymentFormValues,
  limits: PaymentFormLimits,
): FormResult<Omit<RegisterPaymentInput, "branchId"> & { branchId?: string }> {
  const amountMinor = parseAmountToMinor(values.amount);
  if (amountMinor === null || amountMinor < 1) {
    return { error: "Indica un importe mayor a cero, con hasta dos decimales." };
  }
  if (limits.maxMinor !== null && amountMinor > limits.maxMinor) {
    return { error: "El importe supera el saldo pendiente del tratamiento." };
  }
  let currency: string | undefined;
  if (limits.askCurrency) {
    const normalized = normalizeCurrency(values.currency || DEFAULT_CURRENCY);
    if (!normalized) return { error: "La moneda debe tener tres letras (ej. BOB)." };
    currency = normalized;
  }
  if (limits.needsBranch && !values.branchId) return { error: "Selecciona la sucursal que recibe el pago." };

  const reference = values.reference.trim();
  const notes = values.notes.trim();
  return {
    input: {
      amountMinor,
      paymentMethod: values.method,
      ...(currency ? { currency } : {}),
      ...(reference ? { reference } : {}),
      ...(notes ? { notes } : {}),
      ...(limits.needsBranch ? { branchId: values.branchId } : {}),
    },
  };
}
