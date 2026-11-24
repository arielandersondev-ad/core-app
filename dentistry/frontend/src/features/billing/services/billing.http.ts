import { BILLING_ENDPOINTS } from "@/features/billing/api/endpoints";
import type {
  CreateTreatmentInput,
  Payment,
  PaymentProposal,
  RegisterEncounterPaymentInput,
  RegisterPaymentInput,
  Treatment,
  TreatmentAccount,
  UpdateTreatmentInput,
} from "@/features/billing/types/billing";
import { requestJson } from "@/infrastructure/http/request-json";
import type { PaginatedResult } from "@/shared/types/pagination";

const JSON_HEADERS = { "Content-Type": "application/json" };

function send<T>(url: string, body: unknown, method = "POST"): Promise<T> {
  return requestJson<T>(url, { method, headers: JSON_HEADERS, body: JSON.stringify(body) });
}

/** El backend ya devuelve la forma de la UI: no hay mapeo, solo transporte. */
export const billingApi = {
  listTreatments: (patientId: string, pageSize = 50) =>
    requestJson<PaginatedResult<Treatment>>(
      `${BILLING_ENDPOINTS.treatments(patientId)}?pageSize=${pageSize}`,
    ),
  createTreatment: (patientId: string, input: CreateTreatmentInput) =>
    send<Treatment>(BILLING_ENDPOINTS.treatments(patientId), input),
  updateTreatment: (patientId: string, treatmentId: string, input: UpdateTreatmentInput) =>
    send<Treatment>(BILLING_ENDPOINTS.treatment(patientId, treatmentId), input, "PATCH"),
  getAccount: (patientId: string, treatmentId: string) =>
    requestJson<TreatmentAccount>(BILLING_ENDPOINTS.account(patientId, treatmentId)),
  registerTreatmentPayment: (patientId: string, treatmentId: string, input: RegisterPaymentInput) =>
    send<Payment>(BILLING_ENDPOINTS.treatmentPayments(patientId, treatmentId), input),
  voidPayment: (patientId: string, paymentId: string, reason: string) =>
    send<Payment>(BILLING_ENDPOINTS.voidPayment(patientId, paymentId), { reason }),
  getEncounterProposal: (patientId: string, encounterId: string) =>
    requestJson<PaymentProposal>(BILLING_ENDPOINTS.encounterProposal(patientId, encounterId)),
  getEncounterPayment: (patientId: string, encounterId: string) =>
    requestJson<Payment>(BILLING_ENDPOINTS.encounterPayment(patientId, encounterId)),
  registerEncounterPayment: (
    patientId: string,
    encounterId: string,
    input: RegisterEncounterPaymentInput,
  ) => send<Payment>(BILLING_ENDPOINTS.encounterPayment(patientId, encounterId), input),
};
