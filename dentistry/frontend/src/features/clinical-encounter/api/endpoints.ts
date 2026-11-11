const PATIENTS_COLLECTION = "/api/dentistry/patients";

function patientPath(patientId: string): string {
  return `${PATIENTS_COLLECTION}/${encodeURIComponent(patientId)}`;
}

function encountersCollection(patientId: string): string {
  return `${patientPath(patientId)}/clinical-encounters`;
}

/**
 * Rutas del contrato acordado con Dentistry Backend, servidas por el BFF
 * (`infrastructure/http/dentistry-proxy.ts`). `files` y `fileById` siguen sin
 * endpoint (entrega E6).
 */
export const CLINICAL_ENCOUNTER_ENDPOINTS = {
  collection: encountersCollection,
  byId: (patientId: string, encounterId: string) =>
    `${encountersCollection(patientId)}/${encodeURIComponent(encounterId)}`,
  complete: (patientId: string, encounterId: string) =>
    `${encountersCollection(patientId)}/${encodeURIComponent(encounterId)}/complete`,
  void: (patientId: string, encounterId: string) =>
    `${encountersCollection(patientId)}/${encodeURIComponent(encounterId)}/void`,
  procedures: (patientId: string, encounterId: string) =>
    `${encountersCollection(patientId)}/${encodeURIComponent(encounterId)}/procedures`,
  healthProfile: (patientId: string) => `${patientPath(patientId)}/health-profile`,
  files: (patientId: string) => `${patientPath(patientId)}/clinical-files`,
  fileById: (patientId: string, fileId: string) =>
    `${patientPath(patientId)}/clinical-files/${encodeURIComponent(fileId)}`,
  referenceData: (patientId: string) => `${encountersCollection(patientId)}/reference-data`,
} as const;
