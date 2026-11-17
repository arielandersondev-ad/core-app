import { env } from "@/infrastructure/config/env";
import { parseSessionTokens, type SessionTokens } from "./session";

export type RefreshOutcome =
  | { kind: "renewed"; tokens: SessionTokens }
  /** El backend rechazó el refresh token: la sesión terminó. */
  | { kind: "invalid" }
  /** Otra petición del mismo navegador está rotando la sesión. */
  | { kind: "busy" }
  /** Backend caído o respuesta inesperada: no se debe cerrar la sesión. */
  | { kind: "unavailable" };

const REFRESH_TIMEOUT_MS = 10_000;

/** Rota el refresh token contra Core. Sin `server-only` para poder usarse desde proxy.ts. */
export async function requestSessionRefresh(refreshToken: string): Promise<RefreshOutcome> {
  try {
    const response = await fetch(new URL("/auth/refresh", env.apiUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403 || response.status === 400) {
      return { kind: "invalid" };
    }
    if (response.status === 409) return { kind: "busy" };
    if (!response.ok) return { kind: "unavailable" };

    const tokens = parseSessionTokens(await response.json());
    return tokens ? { kind: "renewed", tokens } : { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}

/** Revoca la sesión en Core. Nunca lanza: el logout local debe completarse igual. */
export async function requestSessionRevocation(refreshToken: string): Promise<void> {
  try {
    await fetch(new URL("/auth/logout", env.apiUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
  } catch {
    // Sin conexión con el backend la sesión vencerá por sí sola; se limpian las cookies igualmente.
  }
}
