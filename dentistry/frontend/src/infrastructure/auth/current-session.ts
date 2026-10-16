import "server-only";

import { serverEnv } from "@/infrastructure/config/server-env";
import type { CurrentSession } from "@/features/auth/types/auth.types";

function isCurrentSession(value: unknown): value is CurrentSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CurrentSession>;
  return typeof candidate.user?.id === "string" &&
    typeof candidate.context?.membershipId === "string" &&
    typeof candidate.context?.organizationId === "string" &&
    Array.isArray(candidate.context?.branchIds) &&
    candidate.context.branchIds.every((id) => typeof id === "string") &&
    Array.isArray(candidate.permissions) &&
    candidate.permissions.every((permission) => typeof permission === "string");
}

export async function getCurrentSession(token: string): Promise<CurrentSession | null> {
  const response = await fetch(new URL("/auth/me", serverEnv.dentistryApiUrl), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("No se pudo verificar la sesión de Dentistry.");
  const session: unknown = await response.json();
  if (!isCurrentSession(session)) throw new Error("Respuesta de sesión inválida.");
  return session;
}
