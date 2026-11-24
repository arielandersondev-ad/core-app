"use client";

import Link from "next/link";
import { useTreatments } from "@/features/billing/hooks/use-billing";
import type { Treatment } from "@/features/billing/types/billing";
import { treatmentStatusLabels } from "@/features/billing/utils/forms";
import { collectableTreatments, summarizeWallet, type WalletTotals } from "@/features/billing/utils/wallet";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { Badge, Button, Icons } from "@/shared/components/ui";
import { isModuleEnabled } from "@/shared/plan/plan-access";
import { formatMinorCurrency } from "@/shared/utils/formatters";

/** Filas de tratamientos visibles antes de remitir a la cuenta completa. */
const VISIBLE_ROWS = 3;

function Figure({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`truncate ${emphasis ? "text-lg font-semibold text-foreground" : "text-sm text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}

function TotalsBlock({ totals, showCurrency }: { totals: WalletTotals; showCurrency: boolean }) {
  return (
    <div className="space-y-2">
      {showCurrency && <p className="text-xs font-medium text-muted">{totals.currency}</p>}
      <dl className="grid grid-cols-3 gap-4">
        <Figure label="Presupuesto" value={formatMinorCurrency(totals.agreedMinor, totals.currency)} />
        <Figure label="Cobrado" value={formatMinorCurrency(totals.paidMinor, totals.currency)} />
        <Figure label="Saldo" value={formatMinorCurrency(totals.balanceMinor, totals.currency)} emphasis />
      </dl>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={`Cobrado ${totals.percentPaid}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={totals.percentPaid}
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${totals.percentPaid}%` }} />
        </div>
        <span className="shrink-0 text-xs text-muted">{totals.percentPaid}% cobrado</span>
      </div>
    </div>
  );
}

function TreatmentRow({ treatment }: { treatment: Treatment }) {
  const hasBudget = treatment.agreedPriceMinor !== null && treatment.currency !== null;
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-foreground">
          {treatment.title ?? treatment.serviceName ?? "Tratamiento sin nombre"}
        </span>
        <Badge variant={treatment.status === "COMPLETED" ? "success" : "primary"} size="sm">
          {treatmentStatusLabels[treatment.status]}
        </Badge>
      </div>
      <span className="shrink-0 text-sm font-medium text-foreground">
        {hasBudget && treatment.balanceMinor !== null && treatment.currency
          ? formatMinorCurrency(treatment.balanceMinor, treatment.currency)
          : "Sin presupuesto"}
      </span>
    </li>
  );
}

/**
 * Cartera del paciente: lo presupuestado, lo cobrado y el saldo, con un renglón por tratamiento.
 * Se oculta si el usuario no puede ver tratamientos o el plan no los incluye.
 */
export function PatientWalletCard({
  patientId,
  onRegisterPayment,
}: {
  patientId: string;
  /** Abre el abono; si hay varios tratamientos con saldo, quien llama decide a cuál. */
  onRegisterPayment: () => void;
}) {
  const session = useAuthenticatedSession();
  const can = (permission: string) => session.permissions.includes(permission);
  const enabled = isModuleEnabled(session.plan, "treatments") && can("dentistry:treatments:read");
  const treatments = useTreatments(patientId, enabled);

  if (!enabled) return null;

  const accountHref = `/patients/${encodeURIComponent(patientId)}/account`;
  const canCollect = isModuleEnabled(session.plan, "payments") && can("dentistry:payments:create");

  return (
    <section aria-labelledby="patient-wallet-heading" className="rounded-xl border border-border bg-surface px-5 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
        <h2 id="patient-wallet-heading" className="font-display text-base font-semibold text-foreground">
          Cartera
        </h2>
        {treatments.data && collectableTreatments(treatments.data.items).length > 0 && canCollect && (
          <Button variant="primary" size="sm" leftIcon={Icons.payments} onClick={onRegisterPayment}>
            Registrar abono
          </Button>
        )}
      </div>

      {treatments.isPending ? (
        <p role="status" className="pt-4 text-sm text-muted">Cargando cartera…</p>
      ) : treatments.isError ? (
        <p role="alert" className="pt-4 text-sm text-danger">
          No se pudo cargar la cartera.{" "}
          <button type="button" className="underline" onClick={() => void treatments.refetch()}>Reintentar</button>
        </p>
      ) : (
        <WalletBody
          items={treatments.data.items}
          accountHref={accountHref}
          canCreate={can("dentistry:treatments:create")}
        />
      )}
    </section>
  );
}

function WalletBody({
  items,
  accountHref,
  canCreate,
}: {
  items: Treatment[];
  accountHref: string;
  canCreate: boolean;
}) {
  const summary = summarizeWallet(items);

  if (summary.treatments.length === 0) {
    return (
      <div className="space-y-2 pt-4 text-sm">
        <p className="text-foreground">Este paciente aún no tiene tratamientos.</p>
        <p className="text-muted">
          {canCreate
            ? "Crea uno con su presupuesto para registrar el anticipo y los abonos."
            : "Cuando se registre un tratamiento, aquí verás su saldo."}
        </p>
        {canCreate && (
          <Link href={accountHref} className="inline-block font-medium text-primary hover:underline">
            Crear tratamiento →
          </Link>
        )}
      </div>
    );
  }

  const rows = summary.treatments.slice(0, VISIBLE_ROWS);
  const hiddenRows = summary.treatments.length - rows.length;

  return (
    <div className="space-y-4 pt-4">
      {summary.totals.length > 0 ? (
        summary.totals.map((totals) => (
          <TotalsBlock key={totals.currency} totals={totals} showCurrency={summary.totals.length > 1} />
        ))
      ) : (
        <p className="text-sm text-muted">Ningún tratamiento tiene presupuesto definido todavía.</p>
      )}
      <ul className="divide-y divide-border border-t border-border">
        {rows.map((treatment) => (
          <TreatmentRow key={treatment.id} treatment={treatment} />
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {hiddenRows > 0 ? `+${hiddenRows} tratamiento(s) más. ` : ""}
          {summary.excludedCount > 0 ? `${summary.excludedCount} cancelado(s) o rechazado(s) no cuentan.` : ""}
        </span>
        <Link href={accountHref} className="text-sm font-medium text-primary hover:underline">
          Ver cuenta →
        </Link>
      </div>
    </div>
  );
}
