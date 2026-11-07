"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPersons,
  getPersonById,
  createPerson,
  convertPersonToPatient,
  type Person,
  type CreatePersonInput,
  type ConvertPersonToPatientInput,
} from "../api/persons";

export const personQueryKeys = {
  all: ["persons"] as const,
  list: (params?: { search?: string; onlyUnconverted?: boolean }) => ["persons", params] as const,
  detail: (id: string) => ["persons", "detail", id] as const,
};

export function usePersons(params?: { search?: string; onlyUnconverted?: boolean }) {
  return useQuery<Person[]>({
    queryKey: personQueryKeys.list(params),
    queryFn: () => listPersons(params),
  });
}

export function usePersonDetail(id: string) {
  return useQuery<Person>({
    queryKey: personQueryKeys.detail(id),
    queryFn: () => getPersonById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePersonInput) => createPerson(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: personQueryKeys.all,
      });
    },
  });
}

export function useConvertPersonToPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      payload,
    }: {
      personId: string;
      payload: ConvertPersonToPatientInput;
    }) => convertPersonToPatient(personId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: personQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
