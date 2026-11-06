import { api } from "@/infrastructure/http/api";
import { ApiError } from "@/infrastructure/http/api-error";

export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [key, value] of init.headers) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, init.headers);
    }
  }

  try {
    const response = await api.request<T>({
      url,
      method: init.method ?? "GET",
      data: init.body,
      headers,
      signal: init.signal ?? undefined,
    });
    return response.data;
  } catch (error) {
    if (init.signal?.aborted) throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "No se pudo conectar con la aplicación.");
  }
}
