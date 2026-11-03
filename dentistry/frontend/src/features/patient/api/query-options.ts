import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { createPatient, deletePatient, fetchPatientById, fetchPatients, updatePatient } from "@/features/patient/services/patient.service";
import type { CreatePatientRequest, ListPatientsParams, UpdatePatientRequest } from "@/features/patient/types/patient";
import { fetchCurrentSession } from "@/infrastructure/auth/client-session";
import { assertSameSessionContext } from "@/infrastructure/auth/session-context";
import type { CurrentSession } from "@/infrastructure/auth/session";

export const patientQueryKeys = {
  all: ["patients"] as const,
  list: (params: ListPatientsParams) => ["patients", "list", params] as const,
  detail: (id: string) => ["patients", "detail", id] as const,
};

export function patientListOptions(params: ListPatientsParams) {
  return queryOptions({
    queryKey: patientQueryKeys.list(params),
    queryFn: ({ signal }) => fetchPatients(params, signal),
  });
}

export function patientDetailOptions(id: string) {
  return queryOptions({
    queryKey: patientQueryKeys.detail(id),
    queryFn: () => fetchPatientById(id),
  });
}

export function patientCreateOptions(client: QueryClient, session: CurrentSession) {
  return mutationOptions({
    mutationFn: async (payload: CreatePatientRequest) => {
      const current = await fetchCurrentSession();
      assertSameSessionContext(session, current);
      return createPatient(payload);
    },
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });
}

export function patientUpdateOptions(client: QueryClient, session: CurrentSession, id: string) {
  return mutationOptions({
    mutationFn: async (payload: UpdatePatientRequest) => {
      const current = await fetchCurrentSession();
      assertSameSessionContext(session, current);
      return updatePatient(id, payload);
    },
    retry: false,
    onSuccess: async (patient) => {
      client.setQueryData(patientQueryKeys.detail(id), patient);
      await client.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });
}

export function patientDeleteOptions(client: QueryClient, session: CurrentSession, id: string) {
  return mutationOptions({
    mutationFn: async () => {
      const current = await fetchCurrentSession();
      assertSameSessionContext(session, current);
      return deletePatient(id);
    },
    retry: false,
    onSuccess: async () => {
      client.removeQueries({ queryKey: patientQueryKeys.detail(id) });
      await client.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });
}
