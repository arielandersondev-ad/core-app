"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentSession } from "@/infrastructure/auth/session";

const SessionContext = createContext<CurrentSession | null>(null);

export function AuthenticatedSessionProvider({ session, children }: { session: CurrentSession; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useAuthenticatedSession(): CurrentSession {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Falta el contexto de sesión autenticada.");
  return session;
}
