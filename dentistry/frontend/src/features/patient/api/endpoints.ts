const COLLECTION = "/api/dentistry/patients";

export const PATIENT_ENDPOINTS = {
  collection: COLLECTION,
  byId: (id: string) => `${COLLECTION}/${encodeURIComponent(id)}`,
} as const;
