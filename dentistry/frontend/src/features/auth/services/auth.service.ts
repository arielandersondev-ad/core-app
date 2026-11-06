import "server-only";

import axios, { isAxiosError } from "axios";
import { serverEnv } from "@/infrastructure/config/server-env";

export class AuthenticationError extends Error {}

export async function login(email: string, password: string): Promise<{access_token: string; expires_in: number}> {
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

  if (!result || typeof result !== "object") throw new AuthenticationError("Respuesta de acceso inválida.");
  const token = (result as Record<string, unknown>).access_token;
  const type = (result as Record<string, unknown>).token_type;
  const expiresIn = (result as Record<string, unknown>).expires_in;
  if (typeof token !== "string" || !token || type !== "Bearer" ||
      typeof expiresIn !== "number" || !Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 1800) {
    throw new AuthenticationError("Respuesta de acceso inválida.");
  }
  return { access_token: token, expires_in: expiresIn };
}
