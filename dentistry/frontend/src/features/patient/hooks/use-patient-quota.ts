"use client";

import { useQuery } from "@tanstack/react-query";
import { patientQuotaOptions } from "@/features/patient/api/query-options";

export function usePatientQuota() {
  return useQuery(patientQuotaOptions());
}
