"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clinicalEncounterAddProceduresOptions,
  clinicalEncounterCompleteOptions,
  clinicalEncounterCreateOptions,
  clinicalEncounterVoidOptions,
  clinicalFileAddOptions,
  clinicalFileRemoveOptions,
  patientHealthProfileSaveOptions,
} from "@/features/clinical-encounter/api/query-options";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

export function useCreateClinicalEncounter() {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(clinicalEncounterCreateOptions(client, session));
}

export function useCompleteClinicalEncounter(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(clinicalEncounterCompleteOptions(client, session, patientId));
}

export function useVoidClinicalEncounter(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(clinicalEncounterVoidOptions(client, session, patientId));
}

export function useAddClinicalEncounterProcedures(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(clinicalEncounterAddProceduresOptions(client, session, patientId));
}

export function useSavePatientHealthProfile(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(patientHealthProfileSaveOptions(client, session, patientId));
}

export function useAddClinicalFile(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(clinicalFileAddOptions(client, session, patientId));
}

export function useRemoveClinicalFile(patientId: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(clinicalFileRemoveOptions(client, session, patientId));
}
