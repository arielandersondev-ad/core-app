import "server-only";

import axios, { isAxiosError } from "axios";
import { serverEnv } from "@/infrastructure/config/server-env";
import { parseSessionTokens, type SessionTokens } from "@/infrastructure/auth/session";

const SECRET_HEADER = "x-dev-exchange-secret";
const MIN_SECRET_LENGTH = 24;

export interface DevUserOption {
  id: string;
  email: string;
  name: string;
  organizationName: string | null;
  roleNames: string[];
  branchNames: string[];
}

export class DevExchangeError extends Error {}

/**
 * Secreto compartido con Core para el canje de desarrollo, o `null` si el canje no está
 * configurado. Solo existe en `development`: en cualquier otro entorno nunca se usa.
 */
function exchangeSecret(): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  const secret = process.env.DEV_TOKEN_EXCHANGE_SECRET?.trim();
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function devExchangeConfigured(): boolean {
  return exchangeSecret() !== null;
}

function headers(secret: string) {
  return { Accept: "application/json", [SECRET_HEADER]: secret };
}

function failure(error: unknown): DevExchangeError {
  if (isAxiosError(error) && error.response) {
    const { status } = error.response;
    if (status === 404) {
      return new DevExchangeError(
        "Core no tiene activo el canje (¿falta DEV_TOKEN_EXCHANGE_SECRET en core/backend y reiniciar?) o el usuario no puede canjearse.",
      );
    }
    if (status === 401) return new DevExchangeError("El secreto de canje no coincide con el de Core.");
    if (status === 403) return new DevExchangeError("La organización del usuario no tiene acceso a Dentistry.");
    return new DevExchangeError("Core rechazó el canje.");
  }
  return new DevExchangeError("No se pudo conectar con Core.");
}

export async function listDevUsers(search?: string): Promise<DevUserOption[]> {
  const secret = exchangeSecret();
  if (!secret) throw new DevExchangeError("El canje de desarrollo no está configurado.");
  try {
    const response = await axios.get<DevUserOption[]>(new URL("/dev/auth/users", serverEnv.authApiUrl).toString(), {
      headers: headers(secret),
      params: search?.trim() ? { search: search.trim() } : undefined,
      timeout: 15_000,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw failure(error);
  }
}

/** Sesión real de Dentistry (access + refresh) emitida por Core para ese usuario. */
export async function exchangeDevUser(userId: string): Promise<SessionTokens> {
  const secret = exchangeSecret();
  if (!secret) throw new DevExchangeError("El canje de desarrollo no está configurado.");
  try {
    const response = await axios.post<unknown>(
      new URL("/dev/auth/dentistry-token", serverEnv.authApiUrl).toString(),
      { userId },
      { headers: headers(secret), timeout: 15_000 },
    );
    const tokens = parseSessionTokens(response.data);
    if (!tokens) throw new DevExchangeError("Respuesta de canje inválida.");
    return tokens;
  } catch (error) {
    throw error instanceof DevExchangeError ? error : failure(error);
  }
}
