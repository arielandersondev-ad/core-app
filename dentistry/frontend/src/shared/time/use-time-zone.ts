"use client";

import { useCallback } from "react";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import type { CurrentSession } from "@/infrastructure/auth/session";
import { browserTimeZone, isValidTimeZone } from "@/shared/time/zoned-time";

/**
 * Zona horaria para mostrar y capturar fechas: la de la sucursal, luego la de
 * la organización y, si la sesión no trae ninguna, la del navegador.
 */
export function resolveTimeZone(session: Pick<CurrentSession, "context">, branchId?: string | null): string {
  const branchZone = branchId ? session.context.branchTimeZones?.[branchId] : undefined;
  if (isValidTimeZone(branchZone)) return branchZone;
  if (isValidTimeZone(session.context.timeZone)) return session.context.timeZone;
  return browserTimeZone();
}

export function useTimeZone(branchId?: string | null): string {
  return resolveTimeZone(useAuthenticatedSession(), branchId);
}

/** Resolutor para listas con citas o atenciones de varias sucursales. */
export function useTimeZoneResolver(): (branchId?: string | null) => string {
  const session = useAuthenticatedSession();
  return useCallback((branchId) => resolveTimeZone(session, branchId), [session]);
}
