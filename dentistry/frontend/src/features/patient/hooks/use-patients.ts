"use client";

import { useQuery } from "@tanstack/react-query";
import { patientListOptions } from "@/features/patient/api/query-options";
import type { ListPatientsParams } from "@/features/patient/types/patient";

export function usePatients(params: ListPatientsParams, enabled = true) {
  return useQuery({ ...patientListOptions(params), enabled });
}
