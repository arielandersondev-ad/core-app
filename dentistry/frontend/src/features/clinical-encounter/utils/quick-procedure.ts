import type {
  ClinicalEncounterTargetType,
  RegisterQuickProcedureInput,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { buildInstant } from "@/features/clinical-encounter/utils/dates";
import {
  ProcedureValidationError,
  toProcedureDrafts,
} from "@/features/clinical-encounter/utils/procedures";

export interface QuickProcedureFormValues {
  branchId: string;
  date: string;
  time: string;
  targetType: ClinicalEncounterTargetType;
  toothNumber: string;
  targetDescription: string;
  description: string;
  observations: string;
  /** Cita desde la que se registra (agenda); queda vinculada y completada. */
  appointmentId?: string;
}

export type QuickProcedureValidationResult =
  | { input: RegisterQuickProcedureInput }
  | { error: string };

/** Margen para relojes desajustados entre el navegador y el servidor. */
const FUTURE_TOLERANCE_MS = 60_000;

/**
 * Convierte el formulario de "atención rápida" en el contrato del backend.
 * Reutiliza la regla de objetivo/pieza FDI de los procedimientos de una atención.
 */
export function toQuickProcedureInput(
  values: QuickProcedureFormValues,
  now: Date = new Date(),
): QuickProcedureValidationResult {
  const branchId = values.branchId.trim();
  if (!branchId) return { error: "Selecciona una sucursal." };

  const performedAt = buildInstant(values.date, values.time);
  if (!performedAt) return { error: "Indica una fecha y una hora válidas." };
  if (new Date(performedAt).getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    return { error: "La fecha y la hora no pueden ser futuras." };
  }

  try {
    const procedures = toProcedureDrafts({
      targetType: values.targetType,
      toothNumber: values.toothNumber,
      targetDescription: values.targetDescription,
      description: values.description,
      treatmentProcedureId: "",
    }).map(({ targetType, toothNumber, targetDescription, description }) => ({
      targetType,
      ...(toothNumber ? { toothNumber } : {}),
      ...(targetDescription ? { targetDescription } : {}),
      description,
    }));
    return {
      input: {
        branchId,
        performedAt,
        ...(values.appointmentId ? { appointmentId: values.appointmentId } : {}),
        procedureSummary: values.observations.trim() || null,
        procedures,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof ProcedureValidationError
          ? error.message
          : "Revisa los datos del procedimiento.",
    };
  }
}
