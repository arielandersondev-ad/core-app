"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/infrastructure/http/api";
import type { CurrentSession } from "@/infrastructure/auth/session";

export const sessionQueryKeys = {
  current: ["session", "current"] as const,
};

export function useCurrentSession() {
  return useQuery<CurrentSession>({
    queryKey: sessionQueryKeys.current,
    queryFn: async () => {
      const { data } = await api.get<CurrentSession>("/auth/me");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
