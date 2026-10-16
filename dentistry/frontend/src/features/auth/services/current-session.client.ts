import type { CurrentSession } from "@/features/auth/types/auth.types";

export async function fetchCurrentSession(): Promise<CurrentSession> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok) throw new Error("La sesión no está disponible. Vuelve a iniciar sesión.");
  return response.json() as Promise<CurrentSession>;
}
