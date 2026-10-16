import 'server-only';
import axios, { isAxiosError } from 'axios';
import { AUTH_ENDPOINTS } from '@/features/auth/api/endpoints';
import type { AuthResult, LoginCredentials } from '@/features/auth/types/auth.types';
import { env } from '@/infrastructure/config/env';
import { SESSION_MAX_AGE_SECONDS } from '@/infrastructure/auth/session';

export class AuthenticationError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return 'No fue posible iniciar sesión.';
  }
  const message = payload.message;
  return Array.isArray(message) ? message.join(' ') : String(message);
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { data } = await axios.post<AuthResult>(
        `${env.apiUrl}${AUTH_ENDPOINTS.login}`,
        credentials,
        { timeout: 15_000 },
      );
      if (
        !data ||
        typeof data !== 'object' ||
        typeof data.access_token !== 'string' ||
        data.access_token.length === 0 ||
        data.token_type !== 'Bearer'
      ) {
        throw new AuthenticationError('El servidor devolvió una respuesta de sesión inválida.', 502);
      }

      const expiresIn = data.expires_in;
      return {
        access_token: data.access_token,
        token_type: 'Bearer',
        expires_in:
          typeof expiresIn === 'number' && Number.isSafeInteger(expiresIn) && expiresIn > 0
            ? Math.min(expiresIn, SESSION_MAX_AGE_SECONDS)
            : SESSION_MAX_AGE_SECONDS,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      if (isAxiosError(error) && error.response) {
        throw new AuthenticationError(getErrorMessage(error.response.data), error.response.status);
      }
      throw new AuthenticationError('No pudimos conectar con el servidor. Comprueba que el backend esté disponible.', 503);
    }
  },
};
