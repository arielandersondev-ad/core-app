import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from './session';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionToken(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    priority: 'high',
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
