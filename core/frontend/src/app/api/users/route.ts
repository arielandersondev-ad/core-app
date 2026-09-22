import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/infrastructure/auth/session';
import { env } from '@/infrastructure/config/env';

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Sesión requerida' }, { status: 401 });
  }

  try {
    const response = await fetch(`${env.apiUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      return Response.json(
        { message: response.status === 403 ? 'No tienes permiso para ver usuarios.' : 'No se pudo cargar el listado de usuarios.' },
        { status: response.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return Response.json(await response.json(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ message: 'No se pudo conectar con el backend.' }, { status: 502 });
  }
}
