import "server-only";

import axios, { isAxiosError } from "axios";
import { serverEnv } from "@/infrastructure/config/server-env";
import { parseSessionTokens, type SessionTokens } from "@/infrastructure/auth/session";

export class AuthenticationError extends Error {}

export async function login(email: string, password: string): Promise<SessionTokens> {
  let result: unknown;
  try {
    const url = new URL("/auth/dentistry/login", serverEnv.authApiUrl).toString();
    const response = await axios.post(
      url,
      { email, password },
      {
        headers: { Accept: "application/json" },
        timeout: 15_000,
      }
    );
    result = response.data;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Falta configurar ")) {
      throw new AuthenticationError(error.message);
    }
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 401) throw new AuthenticationError("Correo o contraseña incorrectos.");
      if (error.response.status === 403) throw new AuthenticationError("Tu organización no tiene acceso a Dentistry.");
      throw new AuthenticationError("No se pudo iniciar sesión. Inténtalo nuevamente.");
    }
    throw new AuthenticationError("No se pudo conectar con el servicio de acceso.");
  }

  const tokens = parseSessionTokens(result);
  if (!tokens) throw new AuthenticationError("Respuesta de acceso inválida.");
  return tokens;
}
