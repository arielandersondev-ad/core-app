import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/infrastructure/http/api-error";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 1 && (
          !(error instanceof ApiError) || error.status === 0 || error.status >= 500
        ),
        refetchOnWindowFocus: false,
      },
    },
  });
}
