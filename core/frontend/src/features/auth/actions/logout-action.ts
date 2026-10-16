'use server';

import { redirect } from 'next/navigation';
import { clearSession } from '@/infrastructure/auth/server-session';

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}
