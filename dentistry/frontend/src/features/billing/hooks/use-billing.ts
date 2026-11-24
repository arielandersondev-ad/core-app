"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTreatmentOptions,
  encounterPaymentOptions,
  encounterProposalOptions,
  registerEncounterPaymentOptions,
  registerTreatmentPaymentOptions,
  treatmentAccountOptions,
  treatmentsOptions,
  updateTreatmentOptions,
  voidPaymentOptions,
} from "@/features/billing/api/query-options";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

export function useTreatments(patientId: string, enabled = true) {
  return useQuery({ ...treatmentsOptions(patientId), enabled });
}

export function useTreatmentAccount(patientId: string, treatmentId: string, enabled = true) {
  return useQuery({ ...treatmentAccountOptions(patientId, treatmentId), enabled });
}

export function useEncounterProposal(patientId: string, encounterId: string, enabled = true) {
  return useQuery({ ...encounterProposalOptions(patientId, encounterId), enabled });
}

export function useEncounterPayment(patientId: string, encounterId: string, enabled = true) {
  return useQuery({ ...encounterPaymentOptions(patientId, encounterId), enabled });
}

export function useCreateTreatment(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(createTreatmentOptions(client, session, patientId));
}

export function useUpdateTreatment(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(updateTreatmentOptions(client, session, patientId));
}

export function useRegisterTreatmentPayment(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(registerTreatmentPaymentOptions(client, session, patientId));
}

export function useRegisterEncounterPayment(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(registerEncounterPaymentOptions(client, session, patientId));
}

export function useVoidPayment(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(voidPaymentOptions(client, session, patientId));
}
