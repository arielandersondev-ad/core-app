import { ClinicalEncounterApiUnavailableError } from "@/features/clinical-encounter/services/clinical-encounter.error";
import type { ClinicalEncounterDataSource } from "@/features/clinical-encounter/services/clinical-encounter.service";

/**
 * El adaptador HTTP se activará cuando existan endpoints reales. En ese momento
 * deberá incorporar la comprobación de sesión y contexto antes de llamar a la
 * API; por ahora todos los métodos fallan de forma explícita.
 */
function unavailable<T>(): Promise<T> {
  return Promise.reject(
    new ClinicalEncounterApiUnavailableError(
      "La API de atenciones clínicas todavía no está disponible. Usa el adaptador mock en desarrollo.",
    ),
  );
}

export function createClinicalEncounterHttpDataSource(): ClinicalEncounterDataSource {
  return {
    list: () => unavailable(),
    get: () => unavailable(),
    create: () => unavailable(),
    complete: () => unavailable(),
    void: () => unavailable(),
    addProcedures: () => unavailable(),
    getHealthProfile: () => unavailable(),
    saveHealthProfile: () => unavailable(),
    listFiles: () => unavailable(),
    addFile: () => unavailable(),
    removeFile: () => unavailable(),
    getReferenceData: () => unavailable(),
  };
}
