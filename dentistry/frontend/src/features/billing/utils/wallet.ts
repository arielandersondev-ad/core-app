import type { Treatment } from "@/features/billing/types/billing";
import { treatmentAcceptsPayments } from "@/features/billing/utils/forms";

/** Totales de la cartera en una moneda (importes en unidades menores). */
export interface WalletTotals {
  currency: string;
  agreedMinor: number;
  paidMinor: number;
  balanceMinor: number;
  /** 0–100; 0 si no hay presupuesto. */
  percentPaid: number;
}

export interface WalletSummary {
  /** Tratamientos que cuentan en la cartera: ni rechazados ni cancelados. */
  treatments: Treatment[];
  /** Un total por moneda: nunca se suman monedas distintas. */
  totals: WalletTotals[];
  /** Rechazados o cancelados, que no cuentan. */
  excludedCount: number;
}

export function summarizeWallet(items: Treatment[]): WalletSummary {
  const treatments = items.filter((treatment) => treatmentAcceptsPayments(treatment.status));
  const byCurrency = new Map<string, { agreedMinor: number; paidMinor: number; balanceMinor: number }>();

  for (const treatment of treatments) {
    if (treatment.agreedPriceMinor === null || treatment.currency === null) continue;
    const entry = byCurrency.get(treatment.currency) ?? { agreedMinor: 0, paidMinor: 0, balanceMinor: 0 };
    entry.agreedMinor += treatment.agreedPriceMinor;
    entry.paidMinor += treatment.paidMinor;
    entry.balanceMinor += Math.max(0, treatment.balanceMinor ?? treatment.agreedPriceMinor - treatment.paidMinor);
    byCurrency.set(treatment.currency, entry);
  }

  const totals = [...byCurrency.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, entry]) => ({
      currency,
      ...entry,
      percentPaid:
        entry.agreedMinor > 0 ? Math.min(100, Math.floor((entry.paidMinor / entry.agreedMinor) * 100)) : 0,
    }));

  return { treatments, totals, excludedCount: items.length - treatments.length };
}

/** Tratamientos a los que se puede abonar: con presupuesto, vigentes y con saldo pendiente. */
export function collectableTreatments(items: Treatment[]): Treatment[] {
  return items.filter(
    (treatment) =>
      treatmentAcceptsPayments(treatment.status) &&
      treatment.agreedPriceMinor !== null &&
      treatment.currency !== null &&
      (treatment.balanceMinor ?? 0) > 0,
  );
}
