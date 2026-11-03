import { ApiError } from "@/infrastructure/http/api-error";

function errorMessages(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("message" in payload)) return [];
  const values = Array.isArray(payload.message) ? payload.message : [payload.message];
  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(0, "No se pudo conectar con la aplicación.");
  }

  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const messages = errorMessages(payload);
    const message = messages.length ? messages.join(", ") : "No se pudo completar la petición.";
    throw new ApiError(response.status, message, messages.length ? messages : [message]);
  }
  if (payload === undefined) throw new ApiError(502, "Respuesta inválida de la aplicación.");
  return payload as T;
}
