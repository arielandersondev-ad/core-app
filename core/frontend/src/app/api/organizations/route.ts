import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/infrastructure/auth/session';
import { env } from '@/infrastructure/config/env';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return Response.json({ message: 'Sesión requerida' }, { status: 401, headers: noStore });
  }

  try {
    const response = await fetch(`${env.apiUrl}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      const message = response.status === 403
        ? 'No tienes permiso para ver organizaciones.'
        : response.status === 401
          ? 'La sesión no es válida o ha expirado.'
          : 'No se pudo cargar el listado de organizaciones.';
      return Response.json({ message }, { status: response.status, headers: noStore });
    }
    return Response.json(await response.json(), { headers: noStore });
  } catch {
    return Response.json({ message: 'No se pudo conectar con el backend.' }, { status: 502, headers: noStore });
  }
}
