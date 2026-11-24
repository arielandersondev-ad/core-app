"use client";

import { useState } from "react";
import { PaymentModal } from "@/features/billing/components/payment-modal";
import { VoidPaymentModal } from "@/features/billing/components/void-payment-modal";
import {
  useEncounterPayment,
  useEncounterProposal,
  useRegisterEncounterPayment,
} from "@/features/billing/hooks/use-billing";
import type { Payment, PaymentProposal } from "@/features/billing/types/billing";
import { paymentMethodLabels } from "@/features/billing/utils/forms";
import { Panel } from "@/features/clinical-encounter/components/clinical-encounter-panel";
import { formatDateTimeShort } from "@/features/clinical-encounter/utils/dates";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { Button, Icons, Select } from "@/shared/components/ui";
import { isModuleEnabled } from "@/shared/plan/plan-access";
import { formatMinorCurrency } from "@/shared/utils/formatters";

function CollectionModal({
  patientId,
  encounterId,
  proposal,
  onClose,
  onRegistered,
}: {
  patientId: string;
  encounterId: string;
  proposal: PaymentProposal;
  onClose: () => void;
  onRegistered: (payment: Payment) => void;
}) {
  const register = useRegisterEncounterPayment(patientId);
  const payable = proposal.treatments.filter((treatment) => treatment.payable);
  const [treatmentId, setTreatmentId] = useState<string>(
    proposal.suggestedTreatmentId ?? (payable.length === 1 ? payable[0].id : ""),
  );
  const [error, setError] = useState<string | null>(null);

  const selected = payable.find((treatment) => treatment.id === treatmentId) ?? null;
  // Con varios tratamientos hay que elegir uno; sin ninguno es un cobro suelto.
  const mustChoose = payable.length > 1 && selected === null;
  const looseCharge = proposal.treatments.length === 0;
  const currency = selected?.currency ?? proposal.currency;
  const suggested = selected ? selected.suggestedAmountMinor : looseCharge ? proposal.suggestedAmountMinor : null;

  return (
    <PaymentModal
      // Cambiar de tratamiento reinicia el formulario con su monto sugerido.
      key={treatmentId}
      title="Cobro de la atención"
      description="Confirma el monto realmente recibido. Si no se cobra ahora, cierra este cuadro: la atención queda sin cobro y el saldo no cambia."
      submitLabel="Registrar cobro"
      currency={currency}
      maxMinor={selected?.balanceMinor ?? null}
      initialAmountMinor={suggested}
      askCurrency={looseCharge}
      defaultCurrency={proposal.currency ?? undefined}
      submitting={register.isPending}
      error={error}
      onClose={onClose}
      header={
        <div className="space-y-3">
          <p className="rounded-lg border border-border bg-surface-subtle px-3 py-2 text-xs text-muted">
            {proposal.proceduresTotalMinor !== null && proposal.currency
              ? `Realizado en esta atención: ${formatMinorCurrency(proposal.proceduresTotalMinor, proposal.currency)} (${proposal.pricedProcedureCount} de ${proposal.procedureCount} procedimiento(s) con precio). `
              : "Esta atención no tiene procedimientos con precio. "}
            Lo realizado no es lo cobrado: solo el dinero recibido baja el saldo.
          </p>
          {payable.length > 1 && (
            <Select
              id="collection-treatment"
              label="Tratamiento al que se abona"
              value={treatmentId}
              onChange={(event) => setTreatmentId(event.target.value)}
              options={[
                { value: "", label: "Selecciona un tratamiento" },
                ...payable.map((treatment) => ({
                  value: treatment.id,
                  label: `${treatment.title ?? "Tratamiento"} · saldo ${
                    treatment.balanceMinor !== null && treatment.currency
                      ? formatMinorCurrency(treatment.balanceMinor, treatment.currency)
                      : "—"
                  }`,
                })),
              ]}
              error={mustChoose ? "Elige el tratamiento antes de continuar." : undefined}
            />
          )}
        </div>
      }
      onSubmit={(input) => {
        if (mustChoose) {
          setError("Elige el tratamiento al que se abona.");
          return;
        }
        // La sucursal, la cita y la moneda las hereda el backend de la atención o del tratamiento.
        const { amountMinor, paymentMethod, currency: looseCurrency, reference, notes } = input;
        register.mutate(
          {
            encounterId,
            input: {
              amountMinor,
              paymentMethod,
              currency: looseCurrency,
              reference,
              notes,
              ...(selected ? { treatmentId: selected.id } : {}),
            },
          },
          {
            onSuccess: onRegistered,
            onError: (cause) => setError(cause instanceof Error ? cause.message : "No se pudo registrar el cobro."),
          },
        );
      }}
    />
  );
}

/**
 * Cobro de una atención (relación 1:1 con el pago). Muestra el pago vigente o
 * la ausencia de cobro (prórroga) y, tras completar, propone el monto.
 */
export function EncounterCollectionPanel({
  patientId,
  encounterId,
  status,
  autoPrompt,
  onNotice,
}: {
  patientId: string;
  encounterId: string;
  status: "IN_PROGRESS" | "COMPLETED" | "VOIDED";
  /** Abre el cobro propuesto en cuanto carga (tras completar la atención). */
  autoPrompt: boolean;
  onNotice: (message: string) => void;
}) {
  const session = useAuthenticatedSession();
  const can = (permission: string) => session.permissions.includes(permission);
  const enabled = isModuleEnabled(session.plan, "payments") && can("dentistry:payments:read");

  const payment = useEncounterPayment(patientId, encounterId, enabled);
  const proposal = useEncounterProposal(patientId, encounterId, enabled && status !== "VOIDED");
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [voiding, setVoiding] = useState(false);

  if (!enabled || status === "VOIDED") return null;

  const activePayment = payment.data ?? null;
  const canCollect = can("dentistry:payments:create") && status === "COMPLETED";
  const collectable = proposal.data?.collectable === true && activePayment === null;
  const showModal =
    canCollect && collectable && proposal.data !== undefined && (manualOpen || (autoPrompt && !dismissed));

  return (
    <Panel
      id="ce-detail-collection"
      title="Cobro"
      description="Abono recibido por esta atención."
      icon={Icons.payments}
      action={
        canCollect && collectable ? (
          <Button size="sm" variant="primary" leftIcon={Icons.payments} onClick={() => setManualOpen(true)}>
            Registrar cobro
          </Button>
        ) : undefined
      }
    >
      {payment.isPending ? (
        <p role="status" className="text-sm text-muted">Cargando cobro…</p>
      ) : payment.isError ? (
        <p role="alert" className="text-sm text-danger">
          No se pudo consultar el cobro.{" "}
          <button type="button" className="underline" onClick={() => void payment.refetch()}>Reintentar</button>
        </p>
      ) : activePayment ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatMinorCurrency(activePayment.amountMinor, activePayment.currency)}
              <span className="ml-2 font-normal text-muted">{paymentMethodLabels[activePayment.paymentMethod]}</span>
            </p>
            <p className="text-xs text-muted">
              {formatDateTimeShort(activePayment.paidAt)}
              {activePayment.reference ? ` · ${activePayment.reference}` : ""}
            </p>
          </div>
          {can("dentistry:payments:void") && (
            <Button size="sm" variant="outline" onClick={() => setVoiding(true)}>Anular pago</Button>
          )}
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          <p className="text-foreground">
            {status === "COMPLETED" ? "Sin cobro registrado (prórroga)." : "Se cobra al completar la atención."}
          </p>
          {proposal.data?.proceduresTotalMinor != null && proposal.data.currency && (
            <p className="text-xs text-muted">
              Realizado: {formatMinorCurrency(proposal.data.proceduresTotalMinor, proposal.data.currency)}
            </p>
          )}
        </div>
      )}

      {showModal && proposal.data && (
        <CollectionModal
          patientId={patientId}
          encounterId={encounterId}
          proposal={proposal.data}
          onClose={() => {
            setManualOpen(false);
            setDismissed(true);
          }}
          onRegistered={(registered) => {
            setManualOpen(false);
            setDismissed(true);
            onNotice(`Cobro de ${formatMinorCurrency(registered.amountMinor, registered.currency)} registrado.`);
          }}
        />
      )}
      {voiding && activePayment && (
        <VoidPaymentModal
          patientId={patientId}
          payment={activePayment}
          onClose={() => setVoiding(false)}
          onVoided={() => {
            setVoiding(false);
            onNotice("Pago anulado: la atención quedó sin cobro.");
          }}
        />
      )}
    </Panel>
  );
}
