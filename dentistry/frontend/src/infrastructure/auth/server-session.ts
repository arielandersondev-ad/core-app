import "server-only";

import { cookies } from "next/headers";
import {
  DENTISTRY_ACCESS_COOKIE,
  DENTISTRY_REFRESH_COOKIE,
  sessionCookieOptions,
  sessionCookies,
  type SessionTokens,
} from "./session";

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(DENTISTRY_ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  return (await cookies()).get(DENTISTRY_REFRESH_COOKIE)?.value ?? null;
}

/** Sesión real emitida por Core: access + refresh token. */
export async function setSession(tokens: SessionTokens): Promise<void> {
  const store = await cookies();
  for (const cookie of sessionCookies(tokens)) {
    store.set(cookie.name, cookie.value, cookie.options);
  }
}

/**
 * Solo access token (Dev Persona Switcher). Se descarta cualquier refresh previo para que
 * el proxy no reemplace la persona por la sesión real al renovar.
 */
export async function setAccessToken(token: string, expiresIn: number): Promise<void> {
  const store = await cookies();
  store.set(DENTISTRY_ACCESS_COOKIE, token, sessionCookieOptions(expiresIn));
  store.delete(DENTISTRY_REFRESH_COOKIE);
}

export async function clearAccessToken(): Promise<void> {
  const store = await cookies();
  store.delete(DENTISTRY_ACCESS_COOKIE);
  store.delete(DENTISTRY_REFRESH_COOKIE);
}
