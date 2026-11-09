import type {
  ClinicalEncounterProcedure,
  ClinicalEncounterStatus,
  CompleteClinicalEncounterInput,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { buildInstant } from "@/features/clinical-encounter/utils/dates";

export interface ProcedureTally {
  total: number;
  recorded: number;
  voided: number;
}

/** Completar solo está permitido desde una atención en curso. */
export function canComplete(status: ClinicalEncounterStatus): boolean {
  return status === "IN_PROGRESS";
}

/** Anular se permite mientras la atención no haya sido anulada previamente. */
export function canVoid(status: ClinicalEncounterStatus): boolean {
  return status === "IN_PROGRESS" || status === "COMPLETED";
}

/** Añadir procedimientos solo está permitido en una atención en curso. */
export function canAddProcedures(status: ClinicalEncounterStatus): boolean {
  return status === "IN_PROGRESS";
}

/**
 * Cuenta los procedimientos registrados y anulados. Las filas anuladas siguen
 * formando parte de la evidencia clínica, por eso se contabilizan por separado.
 */
export function summarizeProcedures(
  procedures: readonly ClinicalEncounterProcedure[] = [],
): ProcedureTally {
  let recorded = 0;
  let voided = 0;

  for (const procedure of procedures) {
    if (procedure.status === "VOIDED") {
      voided += 1;
    } else {
      recorded += 1;
    }
  }

  return { total: recorded + voided, recorded, voided };
}

/**
 * Construye el input de cierre combinando fecha y hora civiles. Devuelve `null`
 * si `buildInstant` no puede construir un instante válido; el resumen vacío se
 * normaliza a `null`.
 */
export function buildCompleteInput(
  date: string,
  time: string,
  procedureSummary?: string | null,
): CompleteClinicalEncounterInput | null {
  const endedAt = buildInstant(date, time);
  if (!endedAt) return null;

  const summary = procedureSummary?.trim();
  return { endedAt, procedureSummary: summary ? summary : null };
}
