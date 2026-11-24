"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Icons, Input, ResponsiveModal, Select } from "@/shared/components/ui";
import { encounterReferenceDataOptions } from "@/features/clinical-encounter/api/query-options";
import { DateField } from "@/features/clinical-encounter/components/clinical-encounter-date-field";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";
import { TimeField } from "@/features/clinical-encounter/components/clinical-encounter-time-field";
import { useRegisterQuickProcedure } from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import type { ClinicalEncounter } from "@/features/clinical-encounter/types/clinical-encounter";
import { nowDateValue, nowTimeValue } from "@/features/clinical-encounter/utils/dates";
import { targetOptions } from "@/features/clinical-encounter/utils/procedures";
import {
  toQuickProcedureInput,
  type QuickProcedureFormValues,
} from "@/features/clinical-encounter/utils/quick-procedure";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { isModuleEnabled } from "@/shared/plan/plan-access";

export interface QuickProcedureModalProps {
  patientId: string;
  onClose: () => void;
  onRegistered: (encounter: ClinicalEncounter) => void;
}

/**
 * "Atención rápida": registra un procedimiento suelto del paciente en un paso.
 * Se monta al abrirse, así cada apertura parte de la fecha y hora actuales.
 */
export function QuickProcedureModal({ patientId, onClose, onRegistered }: QuickProcedureModalProps) {
  const session = useAuthenticatedSession();
  const branchIds = session.context.branchIds;
  const showPrice = isModuleEnabled(session.plan, "payments");
  const register = useRegisterQuickProcedure(patientId);
  // Los nombres de sucursal solo hacen falta si hay más de una para elegir.
  const reference = useQuery({
    ...encounterReferenceDataOptions(patientId),
    enabled: branchIds.length > 1,
  });
  const [values, setValues] = useState<QuickProcedureFormValues>(() => ({
    branchId: branchIds.length === 1 ? branchIds[0] : "",
    date: nowDateValue(),
    time: nowTimeValue(),
    targetType: "TOOTH",
    toothNumber: "",
    targetDescription: "",
    description: "",
    observations: "",
    price: "",
    currency: "BOB",
  }));
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof QuickProcedureFormValues>(key: K, value: QuickProcedureFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleClose() {
    if (!register.isPending) onClose();
  }

  function handleSubmit() {
    const result = toQuickProcedureInput(values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    register.mutate(result.input, {
      onSuccess: onRegistered,
      onError: (cause) =>
        setError(cause instanceof Error ? cause.message : "No se pudo registrar el procedimiento."),
    });
  }

  const branchOptions = branchIds.map((id, index) => ({
    value: id,
    label: reference.data?.branches.find((branch) => branch.id === id)?.label ?? `Sucursal ${index + 1}`,
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
          <Button variant="outline" onClick={handleClose} disabled={register.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={Icons.tooth}
            onClick={handleSubmit}
            disabled={register.isPending || branchIds.length === 0}
            loading={register.isPending}
          >
            Registrar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {branchIds.length === 0 && (
          <p role="alert" className="text-sm text-danger">
            Tu usuario no tiene una sucursal asignada. Pide a un administrador que te asigne una.
          </p>
        )}
        {branchIds.length > 1 && (
          <Select
            id="quick-proc-branch"
            label="Sucursal"
            value={values.branchId}
            onChange={(event) => update("branchId", event.target.value)}
            options={[{ value: "", label: "Selecciona una sucursal" }, ...branchOptions]}
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
              const next = targetOptions.find((option) => option.value === event.target.value)?.value;
              if (!next) return;
              setValues((current) => ({
                ...current,
                targetType: next,
                toothNumber: next === "TOOTH" ? current.toothNumber : "",
                targetDescription: next === "TOOTH" ? "" : current.targetDescription,
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
              onChange={(event) => update("targetDescription", event.target.value)}
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
              onChange={(event) => update("currency", event.target.value.toUpperCase())}
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
