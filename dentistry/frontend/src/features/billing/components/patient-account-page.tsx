"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { encounterReferenceDataOptions } from "@/features/clinical-encounter/api/query-options";
import { PatientContextBoundary } from "@/features/clinical-encounter/components/patient-context-boundary";
import { PaymentModal } from "@/features/billing/components/payment-modal";
import { TreatmentModal } from "@/features/billing/components/treatment-modal";
import { VoidPaymentModal } from "@/features/billing/components/void-payment-modal";
import { useRegisterTreatmentPayment, useTreatmentAccount, useTreatments } from "@/features/billing/hooks/use-billing";
import type { AccountMovement, Payment, Treatment } from "@/features/billing/types/billing";
import {
  paymentMethodLabels,
  treatmentAcceptsPayments,
  treatmentStatusLabels,
} from "@/features/billing/utils/forms";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Badge, Button, Icons, StatusMessage } from "@/shared/components/ui";
import { formatMinorCurrency } from "@/shared/utils/formatters";
import { isModuleEnabled } from "@/shared/plan/plan-access";

function money(amountMinor: number | null, currency: string | null): string {
  return amountMinor === null || currency === null ? "—" : formatMinorCurrency(amountMinor, currency);
}

function formatPaidAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Figure({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`text-sm ${emphasis ? "font-semibold text-foreground" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}

function MovementRow({
  movement,
  currency,
  canVoid,
  onVoid,
}: {
  movement: AccountMovement;
  currency: string | null;
  canVoid: boolean;
  onVoid: (payment: Payment) => void;
}) {
  const voided = movement.status === "VOIDED";
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-3 first:border-t-0">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${voided ? "text-muted line-through" : "text-foreground"}`}>
          {formatMinorCurrency(movement.amountMinor, movement.currency)}
          <span className="ml-2 font-normal text-muted">{paymentMethodLabels[movement.paymentMethod]}</span>
        </p>
        <p className="text-xs text-muted">
          {formatPaidAt(movement.paidAt)}
          {movement.clinicalEncounterId ? " · abono de una atención" : " · abono al tratamiento"}
          {movement.reference ? ` · ${movement.reference}` : ""}
        </p>
        {voided && movement.voidReason && <p className="text-xs text-muted">Anulado: {movement.voidReason}</p>}
      </div>
      <div className="flex items-center gap-3">
        {voided ? (
          <Badge variant="neutral" size="sm">Anulado</Badge>
        ) : (
          <>
            <span className="text-xs text-muted">Saldo: {money(movement.runningBalanceMinor, currency)}</span>
            {canVoid && (
              <Button variant="outline" size="sm" onClick={() => onVoid(movement)}>
                Anular
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

function Movements({
  patientId,
  treatment,
  canVoid,
  onVoid,
}: {
  patientId: string;
  treatment: Treatment;
  canVoid: boolean;
  onVoid: (payment: Payment) => void;
}) {
  const account = useTreatmentAccount(patientId, treatment.id);
  if (account.isPending) return <p className="py-3 text-sm text-muted">Cargando movimientos…</p>;
  if (account.isError) {
    return (
      <p role="alert" className="py-3 text-sm text-danger">
        No se pudo cargar el estado de cuenta.{" "}
        <button type="button" className="underline" onClick={() => void account.refetch()}>
          Reintentar
        </button>
      </p>
    );
  }
  if (account.data.movements.length === 0) {
    return <p className="py-3 text-sm text-muted">Todavía no hay pagos registrados.</p>;
  }
  return (
    <ul>
      {account.data.movements.map((movement) => (
        <MovementRow
          key={movement.id}
          movement={movement}
          currency={treatment.currency}
          canVoid={canVoid}
          onVoid={onVoid}
        />
      ))}
    </ul>
  );
}

function TreatmentCard({
  patientId,
  treatment,
  canCollect,
  canVoid,
  onCollect,
  onVoid,
}: {
  patientId: string;
  treatment: Treatment;
  canCollect: boolean;
  canVoid: boolean;
  onCollect: (treatment: Treatment) => void;
  onVoid: (payment: Payment) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasBudget = treatment.agreedPriceMinor !== null && treatment.currency !== null;
  const collectable =
    canCollect && hasBudget && treatmentAcceptsPayments(treatment.status) && (treatment.balanceMinor ?? 0) > 0;

  return (
    <li className="rounded-xl border border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {treatment.title ?? treatment.serviceName ?? "Tratamiento sin nombre"}
          </h3>
          <Badge variant={treatment.status === "COMPLETED" ? "success" : "primary"} size="sm">
            {treatmentStatusLabels[treatment.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {collectable && (
            <Button variant="primary" size="sm" leftIcon={Icons.payments} onClick={() => onCollect(treatment)}>
              Registrar abono
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
            {open ? "Ocultar movimientos" : "Ver movimientos"}
          </Button>
        </div>
      </div>
      {hasBudget ? (
        <dl className="mt-3 grid grid-cols-3 gap-4">
          <Figure label="Presupuesto" value={money(treatment.agreedPriceMinor, treatment.currency)} />
          <Figure label="Cobrado" value={money(treatment.paidMinor, treatment.currency)} />
          <Figure label="Saldo" value={money(treatment.balanceMinor, treatment.currency)} emphasis />
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted">Sin presupuesto definido: aún no admite abonos.</p>
      )}
      {open && <Movements patientId={patientId} treatment={treatment} canVoid={canVoid} onVoid={onVoid} />}
    </li>
  );
}

function PatientAccount({ patientId, patientName }: { patientId: string; patientName: string }) {
  const session = useAuthenticatedSession();
  const can = (permission: string) => session.permissions.includes(permission);
  const treatmentsEnabled = isModuleEnabled(session.plan, "treatments") && can("dentistry:treatments:read");
  const paymentsEnabled = isModuleEnabled(session.plan, "payments");
  const branchIds = session.context.branchIds;

  const treatments = useTreatments(patientId, treatmentsEnabled);
  const register = useRegisterTreatmentPayment(patientId);
  // Los nombres de sucursal solo hacen falta si hay varias para elegir.
  const reference = useQuery({ ...encounterReferenceDataOptions(patientId), enabled: branchIds.length > 1 });

  const [creating, setCreating] = useState(false);
  const [collecting, setCollecting] = useState<Treatment | null>(null);
  const [voiding, setVoiding] = useState<Payment | null>(null);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const branchOptions = branchIds.map((id, index) => ({
    value: id,
    label: reference.data?.branches.find((branch) => branch.id === id)?.label ?? `Sucursal ${index + 1}`,
  }));

  return (
    <PageContainer>
      <div className="mb-4 text-sm">
        <Link href={`/patients/${encodeURIComponent(patientId)}`} className="text-primary hover:underline">
          ← Volver al paciente
        </Link>
      </div>
      <PageHeader
        title="Cuenta del paciente"
        description={`Presupuestos, abonos y saldos de ${patientName}`}
        breadcrumbs={[
          { label: "Pacientes", href: "/patients" },
          { label: patientName, href: `/patients/${encodeURIComponent(patientId)}` },
          { label: "Cuenta" },
        ]}
        action={
          treatmentsEnabled && can("dentistry:treatments:create") ? (
            <Button variant="primary" leftIcon={Icons.plus} onClick={() => setCreating(true)}>
              Nuevo tratamiento
            </Button>
          ) : undefined
        }
      />
      {notice && <p role="status" className="my-4 rounded-lg bg-success-subtle px-4 py-3 text-sm text-success">{notice}</p>}

      {!treatmentsEnabled ? (
        <StatusMessage
          variant="info"
          message="La cuenta del paciente no está disponible."
          description="Requiere el módulo de tratamientos en el plan y permiso para consultarlos."
        />
      ) : treatments.isPending ? (
        <StatusMessage variant="loading" message="Cargando tratamientos…" />
      ) : treatments.isError ? (
        <StatusMessage
          variant="error"
          message="No se pudieron cargar los tratamientos."
          action={<Button variant="outline" onClick={() => void treatments.refetch()}>Reintentar</Button>}
        />
      ) : treatments.data.items.length === 0 ? (
        <StatusMessage
          variant="info"
          message="Este paciente aún no tiene tratamientos."
          description="Crea uno con su presupuesto para registrar el anticipo y los abonos."
        />
      ) : (
        <ul className="space-y-3">
          {treatments.data.items.map((treatment) => (
            <TreatmentCard
              key={treatment.id}
              patientId={patientId}
              treatment={treatment}
              canCollect={paymentsEnabled && can("dentistry:payments:create")}
              canVoid={paymentsEnabled && can("dentistry:payments:void")}
              onCollect={(selected) => {
                setCollectError(null);
                setCollecting(selected);
              }}
              onVoid={setVoiding}
            />
          ))}
        </ul>
      )}

      {creating && (
        <TreatmentModal
          patientId={patientId}
          onClose={() => setCreating(false)}
          onCreated={(treatment) => {
            setCreating(false);
            setNotice(`Tratamiento «${treatment.title ?? "sin nombre"}» creado.`);
          }}
        />
      )}
      {collecting && (
        <PaymentModal
          title="Registrar abono"
          description={`Abono a «${collecting.title ?? "tratamiento"}». Reduce el saldo del tratamiento.`}
          currency={collecting.currency}
          maxMinor={collecting.balanceMinor}
          branchOptions={branchOptions}
          submitting={register.isPending}
          error={collectError}
          onClose={() => setCollecting(null)}
          onSubmit={(input) =>
            register.mutate(
              { treatmentId: collecting.id, input },
              {
                onSuccess: (payment) => {
                  setCollecting(null);
                  setNotice(`Abono de ${formatMinorCurrency(payment.amountMinor, payment.currency)} registrado.`);
                },
                onError: (cause) =>
                  setCollectError(cause instanceof Error ? cause.message : "No se pudo registrar el pago."),
              },
            )
          }
        />
      )}
      {voiding && (
        <VoidPaymentModal
          patientId={patientId}
          payment={voiding}
          onClose={() => setVoiding(null)}
          onVoided={() => {
            setVoiding(null);
            setNotice("Pago anulado: el importe volvió al saldo.");
          }}
        />
      )}
    </PageContainer>
  );
}

export function PatientAccountPage({ patientId }: { patientId: string }) {
  return (
    <PatientContextBoundary patientId={patientId}>
      {(patient) => <PatientAccount patientId={patientId} patientName={patient.fullName} />}
    </PatientContextBoundary>
  );
}
