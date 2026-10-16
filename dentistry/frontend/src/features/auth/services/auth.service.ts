import "server-only";

import { serverEnv } from "@/infrastructure/config/server-env";

export class AuthenticationError extends Error {}

export async function login(email: string, password: string): Promise<{access_token: string; expires_in: number}> {
  let response: Response;
  try {
    const url = new URL("/auth/dentistry/login", serverEnv.authApiUrl);
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Falta configurar ")) {
      throw new AuthenticationError(error.message);
    }
    throw new AuthenticationError("No se pudo conectar con el servicio de acceso.");
  }
  console.log('response: ', response)
  if (response.status === 401) throw new AuthenticationError("Correo o contraseña incorrectos.");
  if (response.status === 403) throw new AuthenticationError("Tu organización no tiene acceso a Dentistry.");
  if (!response.ok) throw new AuthenticationError("No se pudo iniciar sesión. Inténtalo nuevamente.");

  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object") throw new AuthenticationError("Respuesta de acceso inválida.");
  const token = (result as Record<string, unknown>).access_token;
  const type = (result as Record<string, unknown>).token_type;
  const expiresIn = (result as Record<string, unknown>).expires_in;
  if (typeof token !== "string" || !token || type !== "Bearer" ||
      typeof expiresIn !== "number" || !Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 900) {
    throw new AuthenticationError("Respuesta de acceso inválida.");
  }
  return { access_token: token, expires_in: expiresIn };
}
