export const DENTISTRY_ACCESS_COOKIE = "crowant_dentistry_access";
export const DENTISTRY_REFRESH_COOKIE = "crowant_dentistry_refresh";
export const ACCESS_MAX_AGE_SECONDS = 1800;
export const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
/** Margen antes del vencimiento del access token en que se renueva de forma proactiva. */
export const REFRESH_LEEWAY_SECONDS = 60;

export type CurrentSession = {
  user: { id: string };
  context: { membershipId: string; organizationId: string; branchIds: string[] };
  permissions: string[];
};

export type SessionTokens = {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
};

function isPositiveInteger(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max;
}

/** Valida la respuesta de login/refresh de Core para Dentistry. */
export function parseSessionTokens(payload: unknown): SessionTokens | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (
    typeof data.access_token !== "string" || !data.access_token ||
    data.token_type !== "Bearer" ||
    !isPositiveInteger(data.expires_in, ACCESS_MAX_AGE_SECONDS) ||
    typeof data.refresh_token !== "string" || !data.refresh_token || data.refresh_token.length > 128
  ) {
    return null;
  }
  return {
    accessToken: data.access_token,
    accessExpiresIn: data.expires_in,
    refreshToken: data.refresh_token,
    refreshExpiresIn: isPositiveInteger(data.refresh_expires_in, REFRESH_MAX_AGE_SECONDS)
      ? data.refresh_expires_in
      : data.expires_in,
  };
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
    priority: "high",
  } as const;
}

/** Cookies httpOnly que materializan una sesión; se usan en Server Actions y en el proxy. */
export function sessionCookies(tokens: SessionTokens) {
  return [
    { name: DENTISTRY_ACCESS_COOKIE, value: tokens.accessToken, options: sessionCookieOptions(tokens.accessExpiresIn) },
    { name: DENTISTRY_REFRESH_COOKIE, value: tokens.refreshToken, options: sessionCookieOptions(tokens.refreshExpiresIn) },
  ] as const;
}

/** Segundos restantes del access token según su claim exp (sin verificar firma: solo decide UX). */
export function accessTokenSecondsLeft(token: string | undefined): number {
  if (!token) return 0;
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return 0;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };
    if (typeof payload.exp !== "number") return 0;
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return 0;
  }
}
