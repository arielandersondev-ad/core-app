"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientDeleteOptions } from "@/features/patient/api/query-options";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

export function useDeletePatient(id: string) {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(patientDeleteOptions(client, session, id));
}
