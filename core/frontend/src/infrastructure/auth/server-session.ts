import 'server-only';
import { cookies } from 'next/headers';
import { REFRESH_COOKIE, SESSION_COOKIE, sessionCookies, type SessionTokens } from './session';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH_COOKIE)?.value ?? null;
}

export async function setSession(tokens: SessionTokens) {
  const store = await cookies();
  for (const cookie of sessionCookies(tokens)) {
    store.set(cookie.name, cookie.value, cookie.options);
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(REFRESH_COOKIE);
}
