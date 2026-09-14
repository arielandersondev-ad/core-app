import { ENDPOINTS } from "@/infrastructure/api/endpoints";
import { env } from "@/infrastructure/config/env";
import type { AuthResult, LoginCredentials } from "@/infrastructure/auth/auth.types";

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return "No fue posible iniciar sesión.";
  }

  const message = payload.message;
  return Array.isArray(message) ? message.join(" ") : String(message);
}

export async function authenticate(credentials: LoginCredentials): Promise<AuthResult> {
  let response: Response;

  try {
    response = await fetch(`${env.apiUrl}${ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
  } catch {
    throw new AuthenticationError(
      "No pudimos conectar con el servidor. Comprueba que el backend esté disponible.",
      503,
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthenticationError(getErrorMessage(payload), response.status);
  }

  return payload as AuthResult;
}
