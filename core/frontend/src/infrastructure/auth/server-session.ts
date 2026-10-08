import 'server-only';
import { cookies } from 'next/headers';
import { getSessionMaxAge, SESSION_COOKIE } from './session';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionToken(token: string, expiresIn: unknown) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getSessionMaxAge(expiresIn),
    priority: 'high',
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
