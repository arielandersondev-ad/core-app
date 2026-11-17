export const SESSION_COOKIE = "crowant_session";
export const REFRESH_COOKIE = "crowant_refresh";
export const SESSION_MAX_AGE_SECONDS = 30 * 60;
export const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
/** Margen antes del vencimiento del access token en que se renueva de forma proactiva. */
export const REFRESH_LEEWAY_SECONDS = 60;

export type SessionTokens = {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
};

function boundedSeconds(value: unknown, fallback: number, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    return fallback;
  }
  return Math.min(value, max);
}

export function getSessionMaxAge(expiresIn: unknown): number {
  return boundedSeconds(expiresIn, SESSION_MAX_AGE_SECONDS, SESSION_MAX_AGE_SECONDS);
}

/** Valida la respuesta de login/refresh del backend. Devuelve null si no es una sesión válida. */
export function parseSessionTokens(payload: unknown): SessionTokens | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (
    typeof data.access_token !== "string" ||
    data.access_token.length === 0 ||
    data.token_type !== "Bearer" ||
    typeof data.refresh_token !== "string" ||
    data.refresh_token.length === 0 ||
    data.refresh_token.length > 128
  ) {
    return null;
  }
  return {
    accessToken: data.access_token,
    accessExpiresIn: getSessionMaxAge(data.expires_in),
    refreshToken: data.refresh_token,
    refreshExpiresIn: boundedSeconds(data.refresh_expires_in, SESSION_MAX_AGE_SECONDS, REFRESH_MAX_AGE_SECONDS),
  };
}

type CookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
  priority: "high";
};

function cookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high",
  };
}

/** Cookies httpOnly que materializan una sesión; se usan tanto en Server Actions como en el proxy. */
export function sessionCookies(tokens: SessionTokens) {
  return [
    { name: SESSION_COOKIE, value: tokens.accessToken, options: cookieOptions(tokens.accessExpiresIn) },
    { name: REFRESH_COOKIE, value: tokens.refreshToken, options: cookieOptions(tokens.refreshExpiresIn) },
  ] as const;
}

/** Segundos restantes del access token según su claim exp (sin verificar firma: solo decide UX). */
export function accessTokenSecondsLeft(token: string | undefined): number {
  if (!token) return 0;
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return 0;
    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload)) as { exp?: unknown };
    if (typeof payload.exp !== "number") return 0;
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return 0;
  }
}
