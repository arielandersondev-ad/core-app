import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { billingApi } from "@/features/billing/services/billing.http";
import type {
  CreateTreatmentInput,
  RegisterEncounterPaymentInput,
  RegisterPaymentInput,
  UpdateTreatmentInput,
} from "@/features/billing/types/billing";
import { fetchCurrentSession } from "@/infrastructure/auth/client-session";
import { assertSameSessionContext } from "@/infrastructure/auth/session-context";
import type { CurrentSession } from "@/infrastructure/auth/session";
import { ApiError } from "@/infrastructure/http/api-error";

const ROOT = "billing";

export const billingQueryKeys = {
  all: (patientId: string) => [ROOT, patientId] as const,
  treatments: (patientId: string) => [ROOT, patientId, "treatments"] as const,
  account: (patientId: string, treatmentId: string) => [ROOT, patientId, "account", treatmentId] as const,
  proposal: (patientId: string, encounterId: string) => [ROOT, patientId, "proposal", encounterId] as const,
  encounterPayment: (patientId: string, encounterId: string) =>
    [ROOT, patientId, "encounter-payment", encounterId] as const,
};

/** Evita guardar con una sesión distinta de la que abrió el formulario. */
async function assertSessionUnchanged(session: CurrentSession): Promise<void> {
  assertSameSessionContext(session, await fetchCurrentSession());
}

/** Un cobro cambia saldos, estados de cuenta, propuestas y el pago de la atención. */
function invalidateBilling(client: QueryClient, patientId: string) {
  return client.invalidateQueries({ queryKey: billingQueryKeys.all(patientId) });
}

export function treatmentsOptions(patientId: string) {
  return queryOptions({
    queryKey: billingQueryKeys.treatments(patientId),
    queryFn: () => billingApi.listTreatments(patientId),
  });
}

export function treatmentAccountOptions(patientId: string, treatmentId: string) {
  return queryOptions({
    queryKey: billingQueryKeys.account(patientId, treatmentId),
    queryFn: () => billingApi.getAccount(patientId, treatmentId),
  });
}

export function encounterProposalOptions(patientId: string, encounterId: string) {
  return queryOptions({
    queryKey: billingQueryKeys.proposal(patientId, encounterId),
    queryFn: () => billingApi.getEncounterProposal(patientId, encounterId),
    retry: false,
  });
}

/** `null` cuando la atención aún no tiene un pago vigente (prórroga). */
export function encounterPaymentOptions(patientId: string, encounterId: string) {
  return queryOptions({
    queryKey: billingQueryKeys.encounterPayment(patientId, encounterId),
    queryFn: async () => {
      try {
        return await billingApi.getEncounterPayment(patientId, encounterId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    retry: false,
  });
}

export function createTreatmentOptions(client: QueryClient, session: CurrentSession, patientId: string) {
  return mutationOptions({
    mutationFn: async (input: CreateTreatmentInput) => {
      await assertSessionUnchanged(session);
      return billingApi.createTreatment(patientId, input);
    },
    retry: false,
    onSuccess: () => invalidateBilling(client, patientId),
  });
}

export function updateTreatmentOptions(client: QueryClient, session: CurrentSession, patientId: string) {
  return mutationOptions({
    mutationFn: async ({ treatmentId, input }: { treatmentId: string; input: UpdateTreatmentInput }) => {
      await assertSessionUnchanged(session);
      return billingApi.updateTreatment(patientId, treatmentId, input);
    },
    retry: false,
    onSuccess: () => invalidateBilling(client, patientId),
  });
}

export function registerTreatmentPaymentOptions(client: QueryClient, session: CurrentSession, patientId: string) {
  return mutationOptions({
    mutationFn: async ({ treatmentId, input }: { treatmentId: string; input: RegisterPaymentInput }) => {
      await assertSessionUnchanged(session);
      return billingApi.registerTreatmentPayment(patientId, treatmentId, input);
    },
    retry: false,
    onSuccess: () => invalidateBilling(client, patientId),
  });
}

export function registerEncounterPaymentOptions(client: QueryClient, session: CurrentSession, patientId: string) {
  return mutationOptions({
    mutationFn: async ({ encounterId, input }: { encounterId: string; input: RegisterEncounterPaymentInput }) => {
      await assertSessionUnchanged(session);
      return billingApi.registerEncounterPayment(patientId, encounterId, input);
    },
    retry: false,
    onSuccess: () => invalidateBilling(client, patientId),
  });
}

export function voidPaymentOptions(client: QueryClient, session: CurrentSession, patientId: string) {
  return mutationOptions({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      await assertSessionUnchanged(session);
      return billingApi.voidPayment(patientId, paymentId, reason);
    },
    retry: false,
    onSuccess: () => invalidateBilling(client, patientId),
  });
}
