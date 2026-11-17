"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientCreateOptions } from "@/features/patient/api/query-options";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

export function useCreatePatient() {
  const client = useQueryClient();
  const session = useAuthenticatedSession();
  return useMutation(patientCreateOptions(client, session));
}
