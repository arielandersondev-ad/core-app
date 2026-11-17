import { parseSessionTokens, type SessionTokens } from "./session";

export type RefreshOutcome =
  | { kind: "renewed"; tokens: SessionTokens }
  /** Core rechazó el refresh token: la sesión terminó. */
  | { kind: "invalid" }
  /** Otra petición del mismo navegador está rotando la sesión. */
  | { kind: "busy" }
  /** Servicio caído, sin configurar o respuesta inesperada: no se cierra la sesión. */
  | { kind: "unavailable" };

const TIMEOUT_MS = 10_000;

// Sin `server-only` ni serverEnv para poder usarse desde proxy.ts.
function authUrl(path: string): URL | null {
  const raw = process.env.AUTH_API_URL;
  if (!raw) return null;
  try {
    const base = new URL(raw);
    return ["http:", "https:"].includes(base.protocol) ? new URL(path, base) : null;
  } catch {
    return null;
  }
}

export async function requestSessionRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const url = authUrl("/auth/dentistry/refresh");
  if (!url) return { kind: "unavailable" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 400 || response.status === 401 || response.status === 403) return { kind: "invalid" };
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
  const url = authUrl("/auth/logout");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Sin conexión la sesión vencerá por sí sola; las cookies se limpian igualmente.
  }
}
