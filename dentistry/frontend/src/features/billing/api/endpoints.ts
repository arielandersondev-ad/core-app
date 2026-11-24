const PATIENTS = "/api/dentistry/patients";

function patientPath(patientId: string): string {
  return `${PATIENTS}/${encodeURIComponent(patientId)}`;
}

/** Rutas del BFF (`infrastructure/http/dentistry-proxy.ts`) hacia tratamientos y pagos. */
export const BILLING_ENDPOINTS = {
  treatments: (patientId: string) => `${patientPath(patientId)}/treatments`,
  treatment: (patientId: string, treatmentId: string) =>
    `${patientPath(patientId)}/treatments/${encodeURIComponent(treatmentId)}`,
  account: (patientId: string, treatmentId: string) =>
    `${patientPath(patientId)}/treatments/${encodeURIComponent(treatmentId)}/account`,
  treatmentPayments: (patientId: string, treatmentId: string) =>
    `${patientPath(patientId)}/treatments/${encodeURIComponent(treatmentId)}/payments`,
  payments: (patientId: string) => `${patientPath(patientId)}/payments`,
  voidPayment: (patientId: string, paymentId: string) =>
    `${patientPath(patientId)}/payments/${encodeURIComponent(paymentId)}/void`,
  encounterPayment: (patientId: string, encounterId: string) =>
    `${patientPath(patientId)}/clinical-encounters/${encodeURIComponent(encounterId)}/payment`,
  encounterProposal: (patientId: string, encounterId: string) =>
    `${patientPath(patientId)}/clinical-encounters/${encodeURIComponent(encounterId)}/payment-proposal`,
} as const;
