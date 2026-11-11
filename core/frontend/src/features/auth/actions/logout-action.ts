'use server';

import { redirect } from 'next/navigation';
import { clearSession, getRefreshToken } from '@/infrastructure/auth/server-session';
import { requestSessionRevocation } from '@/infrastructure/auth/session-refresh';

export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await requestSessionRevocation(refreshToken);
  }
  await clearSession();
  redirect('/login');
}
