import "server-only";

import type { NextRequest } from "next/server";
import { getAccessToken } from "@/infrastructure/auth/server-session";
import { serverEnv } from "@/infrastructure/config/server-env";

const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

type ProxyMethod = "GET" | "POST" | "PATCH" | "DELETE";
type QueryPolicy = {
  parameters: readonly string[];
  maxValueLength?: number;
  errorMessage: string;
};
type ProxyRule = {
  method: ProxyMethod;
  pattern: RegExp;
  query?: QueryPolicy;
};

const ROUTES: readonly ProxyRule[] = [
  {
    method: "GET",
    pattern: /^appointments$/,
    query: {
      parameters: ["branchId", "patientId", "practitionerMembershipId", "date", "startDate", "endDate", "status"],
      maxValueLength: 100,
      errorMessage: "Filtro de citas inválido.",
    },
  },
  { method: "POST", pattern: /^appointments$/ },
  { method: "GET", pattern: new RegExp(`^appointments/${UUID}$`) },
  { method: "PATCH", pattern: new RegExp(`^appointments/${UUID}/status$`) },
  { method: "POST", pattern: new RegExp(`^appointments/${UUID}/cancel$`) },
  {
    method: "GET",
    pattern: /^patients$/,
    query: {
      parameters: ["search", "status", "page", "pageSize", "limit", "offset", "createdFrom", "createdTo"],
      errorMessage: "Filtro de pacientes inválido.",
    },
  },
  { method: "POST", pattern: /^patients$/ },
  { method: "GET", pattern: new RegExp(`^patients/${UUID}$`) },
  { method: "PATCH", pattern: new RegExp(`^patients/${UUID}$`) },
  { method: "DELETE", pattern: new RegExp(`^patients/${UUID}$`) },
  // Atenciones clínicas y perfil de salud (docs/clinical-encounter-api-requirements.md §7).
  {
    method: "GET",
    pattern: new RegExp(`^patients/${UUID}/clinical-encounters$`),
    query: {
      parameters: ["status", "practitionerMembershipId", "search", "page", "pageSize"],
      maxValueLength: 100,
      errorMessage: "Filtro de atenciones inválido.",
    },
  },
  { method: "POST", pattern: new RegExp(`^patients/${UUID}/clinical-encounters$`) },
  { method: "GET", pattern: new RegExp(`^patients/${UUID}/clinical-encounters/reference-data$`) },
  { method: "GET", pattern: new RegExp(`^patients/${UUID}/clinical-encounters/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^patients/${UUID}/clinical-encounters/${UUID}/procedures$`) },
  { method: "POST", pattern: new RegExp(`^patients/${UUID}/clinical-encounters/${UUID}/complete$`) },
  { method: "POST", pattern: new RegExp(`^patients/${UUID}/clinical-encounters/${UUID}/void$`) },
  { method: "GET", pattern: new RegExp(`^patients/${UUID}/health-profile$`) },
  { method: "PATCH", pattern: new RegExp(`^patients/${UUID}/health-profile$`) },
  {
    method: "GET",
    pattern: /^persons$/,
    query: {
      parameters: ["search", "onlyUnconverted"],
      errorMessage: "Filtro de personas inválido.",
    },
  },
  { method: "POST", pattern: /^persons$/ },
  { method: "GET", pattern: new RegExp(`^persons/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^persons/${UUID}/convert$`) },
  {
    method: "GET",
    pattern: /^services$/,
    query: {
      parameters: ["organizationId", "search", "category", "isActive", "status", "page", "limit", "pageSize", "offset"],
      errorMessage: "Filtro de servicios inválido.",
    },
  },
  { method: "POST", pattern: /^services$/ },
  {
    method: "GET",
    pattern: new RegExp(`^services/${UUID}$`),
    query: {
      parameters: ["organizationId"],
      errorMessage: "Parámetros de servicio inválidos.",
    },
  },
  { method: "PATCH", pattern: new RegExp(`^services/${UUID}$`) },
  { method: "PATCH", pattern: new RegExp(`^services/${UUID}/toggle-status$`) },
  {
    method: "DELETE",
    pattern: new RegExp(`^services/${UUID}$`),
    query: {
      parameters: ["organizationId"],
      errorMessage: "Parámetros de servicio inválidos.",
    },
  },
];

function jsonError(message: string, status: number): Response {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function limitedBody(request: NextRequest): Promise<Uint8Array<ArrayBuffer> | null> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(declared) || declared > MAX_BODY_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(new ArrayBuffer(0));
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const result = new Uint8Array(new ArrayBuffer(size));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function proxyToDentistry(request: NextRequest, segments: string[]): Promise<Response> {
  const path = segments.join("/");
  const method = request.method;
  const route = ROUTES.find((candidate) => candidate.method === method && candidate.pattern.test(path));
  if (!route) {
    return jsonError("Ruta o método no permitido.", 404);
  }
  if (method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) return jsonError("Origen no permitido.", 403);
  }
  if (method === "POST" || method === "PATCH") {
    const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (mediaType !== "application/json") {
      return jsonError("Se requiere JSON.", 415);
    }
  }
  const token = await getAccessToken();
  if (!token) return jsonError("Sesión requerida.", 401);

  let body: Uint8Array<ArrayBuffer> | undefined;
  if (method === "POST" || method === "PATCH") {
    const limited = await limitedBody(request);
    if (limited === null) return jsonError("La petición supera 64 KiB.", 413);
    body = limited;
  }

  const backendUrl = new URL(`/${path}`, serverEnv.dentistryApiUrl);
  const seen = new Set<string>();
  for (const [key, value] of request.nextUrl.searchParams) {
    if (!route.query) return jsonError("Parámetros no permitidos.", 400);
    if (
      !route.query.parameters.includes(key) ||
      seen.has(key) ||
      (route.query.maxValueLength !== undefined && value.length > route.query.maxValueLength)
    ) {
      return jsonError(route.query.errorMessage, 400);
    }
    seen.add(key);
    backendUrl.searchParams.append(key, value);
  }

  try {
    const response = await fetch(backendUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status >= 500) return jsonError("Error del servicio clínico.", 502);
    if (response.status === 204) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") return jsonError("Respuesta clínica inválida.", 502);
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonError("El servicio clínico tardó demasiado en responder.", 504);
    }
    return jsonError("No se pudo conectar con el servicio clínico.", 502);
  }
}
