"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientUpdateOptions } from "@/features/patient/api/query-options";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

export function useUpdatePatient(id: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(patientUpdateOptions(client, session, id));
}
