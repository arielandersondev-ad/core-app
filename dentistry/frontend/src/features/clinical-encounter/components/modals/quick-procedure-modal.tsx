"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Icons,
  Input,
  ResponsiveModal,
  Select,
} from "@/shared/components/ui";
import { encounterReferenceDataOptions } from "@/features/clinical-encounter/api/query-options";
import { DateField } from "@/features/clinical-encounter/components/clinical-encounter-date-field";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";
import { TimeField } from "@/features/clinical-encounter/components/clinical-encounter-time-field";
import { useRegisterQuickProcedure } from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import type { ClinicalEncounter } from "@/features/clinical-encounter/types/clinical-encounter";
import {
  nowDateValue,
  nowTimeValue,
} from "@/features/clinical-encounter/utils/dates";
import { targetOptions } from "@/features/clinical-encounter/utils/procedures";
import {
  toQuickProcedureInput,
  type QuickProcedureFormValues,
} from "@/features/clinical-encounter/utils/quick-procedure";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { isModuleEnabled } from "@/shared/plan/plan-access";
import { resolveTimeZone } from "@/shared/time/use-time-zone";

/** Cita de la agenda: fija la sucursal y queda vinculada a la atención. */
export interface QuickProcedureAppointment {
  id: string;
  branchId: string;
  /** Resumen visible, p. ej. "Ana Pérez · 09:30". */
  label?: string;
}

export interface QuickProcedureModalProps {
  patientId: string;
  appointment?: QuickProcedureAppointment;
  onClose: () => void;
  onRegistered: (encounter: ClinicalEncounter) => void;
}

/**
 * "Atención rápida": registra un procedimiento suelto del paciente en un paso.
 * Se monta al abrirse, así cada apertura parte de la fecha y hora actuales.
 */
export function QuickProcedureModal({
  patientId,
  appointment,
  onClose,
  onRegistered,
}: QuickProcedureModalProps) {
  const session = useAuthenticatedSession();
  const branchIds = session.context.branchIds;
  const showPrice = isModuleEnabled(session.plan, "payments");
  const register = useRegisterQuickProcedure(patientId);
  // Con una cita, la sucursal es la suya; sin ella se elige solo si hay más de una.
  const choosesBranch = !appointment && branchIds.length > 1;
  const reference = useQuery({
    ...encounterReferenceDataOptions(patientId),
    enabled: choosesBranch,
  });
  const [values, setValues] = useState<QuickProcedureFormValues>(() => {
    const branchId = appointment?.branchId ?? (branchIds.length === 1 ? branchIds[0] : "");
    // "Ahora" en la zona de la sucursal (o de la organización si aún no se eligió).
    const timeZone = resolveTimeZone(session, branchId);
    return {
      branchId,
      appointmentId: appointment?.id,
      date: nowDateValue(timeZone),
      time: nowTimeValue(timeZone),
      targetType: "TOOTH",
      toothNumber: "",
      targetDescription: "",
      description: "",
      observations: "",
      price: "",
      currency: "BOB",
    };
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof QuickProcedureFormValues>(
    key: K,
    value: QuickProcedureFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleClose() {
    if (!register.isPending) onClose();
  }

  function handleSubmit() {
    const result = toQuickProcedureInput(
      values,
      new Date(),
      resolveTimeZone(session, values.branchId),
    );
    if ("error" in result) {
      setError(result.error);
      return;
    }
    register.mutate(result.input, {
      onSuccess: onRegistered,
      onError: (cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo registrar el procedimiento.",
        ),
    });
  }

  const branchOptions = branchIds.map((id, index) => ({
    value: id,
    label:
      reference.data?.branches.find((branch) => branch.id === id)?.label ??
      `Sucursal ${index + 1}`,
  }));

  return (
    <ResponsiveModal
      open
      onClose={handleClose}
      title="Registrar procedimiento"
      description="Queda en el historial del paciente como una atención completada."
      eyebrow="Atención rápida"
      icon={Icons.tooth}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={register.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={Icons.tooth}
            onClick={handleSubmit}
            disabled={
              register.isPending || (!appointment && branchIds.length === 0)
            }
            loading={register.isPending}
          >
            Registrar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {appointment?.label && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center text-muted"
              aria-hidden="true"
            >
              {Icons.calendar}
            </span>
            <div className="min-w-0">
              <p className="truncate">Cita: {appointment.label}</p>
              <p className="text-xs text-muted">
                Al registrar, la cita queda completada.
              </p>
            </div>
          </div>
        )}
        {!appointment && branchIds.length === 0 && (
          <p role="alert" className="text-sm text-danger">
            Tu usuario no tiene una sucursal asignada. Pide a un administrador
            que te asigne una.
          </p>
        )}
        {choosesBranch && (
          <Select
            id="quick-proc-branch"
            label="Sucursal"
            value={values.branchId}
            onChange={(event) => update("branchId", event.target.value)}
            options={[
              { value: "", label: "Selecciona una sucursal" },
              ...branchOptions,
            ]}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            id="quick-proc-date"
            label="Fecha"
            value={values.date}
            onChange={(value) => update("date", value)}
            disabled={register.isPending}
          />
          <TimeField
            id="quick-proc-time"
            label="Hora"
            value={values.time}
            onChange={(value) => update("time", value)}
            disabled={register.isPending}
          />
          <Select
            id="quick-proc-target"
            label="Objetivo"
            value={values.targetType}
            onChange={(event) => {
              const next = targetOptions.find(
                (option) => option.value === event.target.value,
              )?.value;
              if (!next) return;
              setValues((current) => ({
                ...current,
                targetType: next,
                toothNumber: next === "TOOTH" ? current.toothNumber : "",
                targetDescription:
                  next === "TOOTH" ? "" : current.targetDescription,
              }));
              setError(null);
            }}
            options={targetOptions}
          />
          {values.targetType === "TOOTH" ? (
            <Input
              id="quick-proc-tooth"
              label="Pieza FDI"
              placeholder="Ej. 16 o 16, 17"
              inputMode="numeric"
              value={values.toothNumber}
              onChange={(event) => update("toothNumber", event.target.value)}
              hint="Varias piezas separadas por coma o espacio generan una fila por pieza."
            />
          ) : (
            <Input
              id="quick-proc-target-desc"
              label="Descripción del objetivo"
              placeholder="Ej. Cuadrante superior derecho"
              value={values.targetDescription}
              onChange={(event) =>
                update("targetDescription", event.target.value)
              }
            />
          )}
        </div>
        <Input
          id="quick-proc-description"
          label="Procedimiento"
          placeholder="Ej. Obturación con resina compuesta"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
        />
        {showPrice && (
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Input
              id="quick-proc-price"
              label="Precio (opcional)"
              placeholder="Ej. 150"
              inputMode="decimal"
              value={values.price ?? ""}
              onChange={(event) => update("price", event.target.value)}
              hint="Por fila. Después puedes registrar el cobro desde la atención."
            />
            <Input
              id="quick-proc-currency"
              label="Moneda"
              maxLength={3}
              value={values.currency ?? "BOB"}
              onChange={(event) =>
                update("currency", event.target.value.toUpperCase())
              }
            />
          </div>
        )}
        <TextAreaField
          id="quick-proc-observations"
          label="Observaciones (opcional)"
          value={values.observations}
          onChange={(value) => update("observations", value)}
        />
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
