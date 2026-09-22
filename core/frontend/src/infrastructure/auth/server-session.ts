import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './session';

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}