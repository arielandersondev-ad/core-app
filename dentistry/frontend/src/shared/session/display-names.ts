import type { CurrentSession } from "@/infrastructure/auth/session";

/** Nombre del producto cuando Core no informa el de la organización. */
export const FALLBACK_ORGANIZATION_NAME = "Dentistry";

export function organizationDisplayName(session: Pick<CurrentSession, "context">): string {
  return session.context.organizationName?.trim() || FALLBACK_ORGANIZATION_NAME;
}

/** Primer nombre para el saludo; null si no se conoce. */
export function userFirstName(session: Pick<CurrentSession, "user">): string | null {
  const first = session.user.firstName?.trim().split(/\s+/)[0];
  return first || null;
}
