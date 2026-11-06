import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { ApiError } from "./api-error";

function extractErrorMessages(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("message" in payload)) return [];
  const { message } = payload as { message: unknown };
  const values = Array.isArray(message) ? message : [message];
  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

const customAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  let url = config.url || "";
  if (config.baseURL && !url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.startsWith("/api/") || url === "/api") {
      // url already has /api prefix
    } else {
      const base = config.baseURL.replace(/\/+$/, "");
      const path = url.replace(/^\/+/, "");
      url = path ? `${base}/${path}` : base;
    }
  }

  const headers = new Headers();
  if (config.headers) {
    for (const [k, v] of Object.entries(config.headers)) {
      if (v != null && typeof v !== "object") {
        headers.set(k, String(v));
      }
    }
  }
  headers.set("Accept", "application/json");
  if (config.data != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: (config.method || "GET").toUpperCase(),
      headers,
      body:
        typeof config.data === "string"
          ? config.data
          : config.data != null
          ? JSON.stringify(config.data)
          : undefined,
      signal: config.signal as AbortSignal | undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (err) {
    if (config.signal?.aborted) throw err;
    throw new ApiError(0, "No se pudo conectar con la aplicación.");
  }

  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const messages = extractErrorMessages(payload);
    const message = messages.length ? messages.join(", ") : (response.statusText || "No se pudo completar la petición.");
    throw new ApiError(response.status, message, messages.length ? messages : [message]);
  }
  if (payload === undefined) {
    throw new ApiError(502, "Respuesta inválida de la aplicación.");
  }

  return {
    data: payload,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    config,
    request: {},
  };
};

export const api = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  adapter: customAdapter,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof ApiError) return Promise.reject(error);
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return Promise.reject(new ApiError(408, "La petición ha excedido el tiempo límite."));
      }
      if (error.response) {
        const messages = extractErrorMessages(error.response.data);
        const message = messages.length ? messages.join(", ") : (error.response.statusText || "No se pudo completar la petición.");
        return Promise.reject(new ApiError(error.response.status, message, messages.length ? messages : [message]));
      }
      if (error.request) {
        return Promise.reject(new ApiError(0, "No se pudo conectar con la aplicación."));
      }
    }
    return Promise.reject(error);
  }
);
