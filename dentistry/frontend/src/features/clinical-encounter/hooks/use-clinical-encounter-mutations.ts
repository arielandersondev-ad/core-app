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

export function useCreateClinicalEncounter() {
  const client = useQueryClient();
  return useMutation(clinicalEncounterCreateOptions(client));
}

export function useCompleteClinicalEncounter(patientId: string) {
  const client = useQueryClient();
  return useMutation(clinicalEncounterCompleteOptions(client, patientId));
}

export function useVoidClinicalEncounter(patientId: string) {
  const client = useQueryClient();
  return useMutation(clinicalEncounterVoidOptions(client, patientId));
}

export function useAddClinicalEncounterProcedures(patientId: string) {
  const client = useQueryClient();
  return useMutation(clinicalEncounterAddProceduresOptions(client, patientId));
}

export function useSavePatientHealthProfile(patientId: string) {
  const client = useQueryClient();
  return useMutation(patientHealthProfileSaveOptions(client, patientId));
}

export function useAddClinicalFile(patientId: string) {
  const client = useQueryClient();
  return useMutation(clinicalFileAddOptions(client, patientId));
}

export function useRemoveClinicalFile(patientId: string) {
  const client = useQueryClient();
  return useMutation(clinicalFileRemoveOptions(client, patientId));
}
