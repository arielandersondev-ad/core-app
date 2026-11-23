import type {
  ClinicalFileCategory,
  ClinicalFileQuota,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { ApiError } from "@/infrastructure/http/api-error";
import { formatBytes } from "@/features/clinical-encounter/utils/format";

/** Mismos valores que el backend; se usan si el cupo todavía no cargó. */
export const DEFAULT_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const CLINICAL_FILE_CATEGORY_OPTIONS: readonly { value: ClinicalFileCategory; label: string }[] = [
  { value: "PHOTO", label: "Fotografía" },
  { value: "RADIOGRAPH", label: "Radiografía" },
  { value: "DOCUMENT", label: "Documento" },
  { value: "OTHER", label: "Otro" },
];

export const CLINICAL_FILE_CATEGORY_LABELS: Record<ClinicalFileCategory, string> = {
  RADIOGRAPH: "Radiografía",
  PHOTO: "Fotografía",
  DOCUMENT: "Documento",
  OTHER: "Otro",
};

type SelectedFile = Pick<File, "type" | "size">;

/** Validación previa en el navegador; el backend vuelve a validar tipo, tamaño y bytes. */
export function validateSelectedFile(
  file: SelectedFile,
  quota?: Pick<ClinicalFileQuota, "allowedMimeTypes" | "maxFileBytes"> | null,
): string | null {
  const allowed: readonly string[] = quota?.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
  const maxBytes = quota?.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
  if (!allowed.includes(file.type)) return "Selecciona una imagen JPG o PNG, o un documento PDF.";
  if (file.size <= 0) return "El archivo está vacío.";
  if (file.size > maxBytes) return `El archivo supera el máximo de ${formatBytes(maxBytes)}.`;
  return null;
}

/** Categoría sugerida según el tipo: imágenes como fotografía, PDF como documento. */
export function suggestedCategory(mimeType: string): ClinicalFileCategory {
  return mimeType === "application/pdf" ? "DOCUMENT" : "PHOTO";
}

export function isImage(mimeType: string): boolean {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

/** "1.2 MB de 2048.0 MB" o null si el plan no define el cupo. */
export function describeUsage(quota: Pick<ClinicalFileQuota, "usedBytes" | "limitBytes">): string | null {
  if (quota.limitBytes === null) return null;
  return `${formatBytes(quota.usedBytes)} de ${formatBytes(quota.limitBytes)} usados`;
}

/** PLAN_LIMIT_REACHED no se traduce: su mensaje ya trae el límite concreto. */
const ERROR_MESSAGES: Record<string, string> = {
  CLINICAL_FILE_QUOTA_UNDEFINED: "Tu plan no define el cupo de archivos clínicos.",
  MODULE_NOT_IN_PLAN: "Tu plan no incluye subir archivos clínicos.",
  CLINICAL_FILE_UPLOAD_REJECTED: "El archivo no coincide con el tipo o el tamaño declarados.",
  CLINICAL_FILE_UPLOAD_EXPIRED: "El plazo para subir el archivo venció. Vuelve a intentarlo.",
  CLINICAL_FILE_UPLOAD_MISSING: "El archivo no llegó al almacenamiento. Vuelve a intentarlo.",
};

/** Mensaje para el usuario a partir del código estable del backend. */
export function clinicalFileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const mapped = error.code ? ERROR_MESSAGES[error.code] : undefined;
    if (mapped) return mapped;
    if (error.status === 403 && !error.code) return "No tienes permiso para gestionar archivos de este paciente.";
    if (error.status === 502 || error.status === 503) return "El almacenamiento de archivos no está disponible.";
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "No se pudo completar la acción.";
}
