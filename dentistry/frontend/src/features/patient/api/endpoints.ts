const COLLECTION = "/api/dentistry/patients";

export const PATIENT_ENDPOINTS = {
  collection: COLLECTION,
  quota: `${COLLECTION}/quota`,
  byId: (id: string) => `${COLLECTION}/${encodeURIComponent(id)}`,
} as const;
