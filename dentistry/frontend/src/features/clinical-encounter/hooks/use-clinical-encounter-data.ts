"use client";

import { useQuery } from "@tanstack/react-query";
import {
  clinicalEncounterDetailOptions,
  clinicalEncounterListOptions,
  clinicalFileAccessUrlOptions,
  clinicalFileQuotaOptions,
  clinicalFilesOptions,
  encounterReferenceDataOptions,
  patientHealthProfileOptions,
} from "@/features/clinical-encounter/api/query-options";
import type { ClinicalEncounterListFilters } from "@/features/clinical-encounter/types/clinical-encounter";

export function useClinicalEncounters(patientId: string, filters?: ClinicalEncounterListFilters) {
  return useQuery(clinicalEncounterListOptions(patientId, filters));
}

export function useClinicalEncounter(patientId: string, encounterId: string) {
  return useQuery(clinicalEncounterDetailOptions(patientId, encounterId));
}

export function usePatientHealthProfile(patientId: string) {
  return useQuery(patientHealthProfileOptions(patientId));
}

export function useClinicalFiles(patientId: string, encounterId?: string) {
  return useQuery(clinicalFilesOptions(patientId, encounterId));
}

export function useClinicalFileQuota(enabled = true) {
  return useQuery({ ...clinicalFileQuotaOptions(), enabled });
}

export function useClinicalFileAccessUrl(
  patientId: string,
  fileId: string | null,
  disposition: "inline" | "attachment" = "inline",
) {
  return useQuery({
    ...clinicalFileAccessUrlOptions(patientId, fileId ?? "", disposition),
    enabled: fileId !== null,
  });
}

export function useEncounterReferenceData(patientId: string) {
  return useQuery(encounterReferenceDataOptions(patientId));
}
