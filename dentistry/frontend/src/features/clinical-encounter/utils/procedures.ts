import type {
  ClinicalEncounterProcedureDraft,
  ClinicalEncounterTargetType,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { DEFAULT_CURRENCY, normalizeCurrency, parseAmountToMinor } from "@/features/billing/utils/money";

export interface ProcedureFormValues {
  targetType: ClinicalEncounterTargetType;
  toothNumber: string;
  targetDescription: string;
  description: string;
  treatmentProcedureId: string;
  /** Precio nominal opcional (importe escrito por la persona, ej. "150"). */
  price?: string;
  currency?: string;
}

export class ProcedureValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcedureValidationError";
  }
}

export const targetTypeLabels: Record<ClinicalEncounterTargetType, string> = {
  TOOTH: "Pieza dental",
  REGION: "Región",
  WHOLE_MOUTH: "Boca completa",
  OTHER: "Otro",
};

export const targetOptions: { value: ClinicalEncounterTargetType; label: string }[] = [
  { value: "TOOTH", label: targetTypeLabels.TOOTH },
  { value: "REGION", label: targetTypeLabels.REGION },
  { value: "WHOLE_MOUTH", label: targetTypeLabels.WHOLE_MOUTH },
  { value: "OTHER", label: targetTypeLabels.OTHER },
];

const FDI_PATTERN = /^(1[1-8]|2[1-8]|3[1-8]|4[1-8]|5[1-5]|6[1-5]|7[1-5]|8[1-5])$/;

/**
 * Convierte los valores del formulario en filas de procedimiento. Varias piezas
 * separadas por coma o espacio producen una fila por pieza. Los objetivos que no
 * son pieza dental limpian `toothNumber` y conservan `targetDescription`.
 */
export function toProcedureDrafts(values: ProcedureFormValues): ClinicalEncounterProcedureDraft[] {
  const description = values.description.trim();
  if (!description) {
    throw new ProcedureValidationError("La descripción del procedimiento es obligatoria.");
  }

  const treatmentProcedureId = values.treatmentProcedureId.trim() || undefined;
  const price = toPriceFields(values);
  const targetDescription = values.targetDescription.trim() || undefined;

  if (values.targetType === "TOOTH") {
    const pieces = values.toothNumber
      .split(/[,\s]+/)
      .map((piece) => piece.trim())
      .filter(Boolean);

    if (pieces.length === 0) {
      throw new ProcedureValidationError("Indica al menos una pieza dental.");
    }

    const invalidPiece = pieces.find((piece) => !FDI_PATTERN.test(piece));
    if (invalidPiece) {
      throw new ProcedureValidationError(
        `La pieza "${invalidPiece}" no es un número FDI válido (por ejemplo 16, 21, 36).`,
      );
    }

    return Array.from(new Set(pieces)).map((piece) => ({
      targetType: "TOOTH",
      toothNumber: piece,
      ...(targetDescription ? { targetDescription } : {}),
      description,
      treatmentProcedureId,
      ...price,
    }));
  }

  return [
    {
      targetType: values.targetType,
      ...(targetDescription ? { targetDescription } : {}),
      description,
      treatmentProcedureId,
      ...price,
    },
  ];
}

/** Precio y moneda juntos, o ninguno: el backend los exige a la vez. */
function toPriceFields(values: Pick<ProcedureFormValues, "price" | "currency">) {
  const text = values.price?.trim();
  if (!text) return {};
  const priceMinor = parseAmountToMinor(text);
  if (priceMinor === null) {
    throw new ProcedureValidationError("El precio debe ser un importe válido, con hasta dos decimales.");
  }
  const currency = normalizeCurrency(values.currency || DEFAULT_CURRENCY);
  if (!currency) throw new ProcedureValidationError("La moneda debe tener tres letras (ej. BOB).");
  return { priceMinor, currency };
}
