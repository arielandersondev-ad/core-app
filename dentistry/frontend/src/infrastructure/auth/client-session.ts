import type { CurrentSession } from "@/infrastructure/auth/session";
import { requestJson } from "@/infrastructure/http/request-json";

export function fetchCurrentSession(): Promise<CurrentSession> {
  return requestJson("/api/auth/me");
}
