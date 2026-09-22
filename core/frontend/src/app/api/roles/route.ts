import { env } from '@/infrastructure/config/env';
import { uuidPattern } from '@/shared/types/uuid-pattern';
import { ROLE_ENDPOINTS } from '@/features/role/api/endpoints';
import { getSessionToken } from '@/infrastructure/auth/server-session';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get('organizationId');

  if (!organizationId || !uuidPattern.test(organizationId)) {
    return Response.json(
      { message: 'organizationId inválido', organizationId, isValid: uuidPattern.test(organizationId ?? '') },
      { status: 400, headers: noStore },
    );
  }

  const token = await getSessionToken();
  if (!token) {
    return Response.json(
      { message: 'Sesión requerida' },
      { status: 401, headers: noStore },
    );
  }

  try {
    const backendUrl = new URL(ROLE_ENDPOINTS.backend.listByOrganization, env.apiUrl);
    backendUrl.searchParams.set('organizationId', organizationId);

    const response = await fetch(backendUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return Response.json(
        {
          message: response.status === 403
            ? 'No tienes permiso para ver roles.'
            : 'No se pudo cargar el listado de roles.',
        },
        { status: response.status, headers: noStore },
      );
    }

    return Response.json(await response.json(), { headers: noStore });
  } catch {
    return Response.json(
      { message: 'No se pudo conectar con el backend.' },
      { status: 502, headers: noStore },
    );
  }
}