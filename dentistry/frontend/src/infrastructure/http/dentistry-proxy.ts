import "server-only";

import type { NextRequest } from "next/server";
import { getAccessToken } from "@/infrastructure/auth/server-session";
import { serverEnv } from "@/infrastructure/config/server-env";

const MAX_BODY_BYTES = 64 * 1024;
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const ROUTES: { method: string; pattern: RegExp }[] = [
  { method: "GET", pattern: /^appointments$/ },
  { method: "POST", pattern: /^appointments$/ },
  { method: "GET", pattern: new RegExp(`^appointments/${UUID}$`) },
  { method: "PATCH", pattern: new RegExp(`^appointments/${UUID}/status$`) },
  { method: "POST", pattern: new RegExp(`^appointments/${UUID}/cancel$`) },
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
  if (!ROUTES.some((route) => route.method === method && route.pattern.test(path))) {
    return jsonError("Ruta o método no permitido.", 404);
  }
  if (method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) return jsonError("Origen no permitido.", 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return jsonError("Se requiere JSON.", 415);
    }
  }
  const token = await getAccessToken();
  if (!token) return jsonError("Sesión requerida.", 401);

  let body: Uint8Array<ArrayBuffer> | undefined;
  if (method !== "GET") {
    const limited = await limitedBody(request);
    if (limited === null) return jsonError("La petición supera 64 KiB.", 413);
    body = limited;
  }

  const backendUrl = new URL(`/${path}`, serverEnv.dentistryApiUrl);
  if (method === "GET" && path === "appointments") {
    const allowed = new Set(["branchId", "patientId", "professionalMembershipId", "date", "startDate", "endDate", "status"]);
    for (const [key, value] of request.nextUrl.searchParams) {
      if (!allowed.has(key) || value.length > 100) return jsonError("Filtro de citas inválido.", 400);
      backendUrl.searchParams.append(key, value);
    }
  } else if (request.nextUrl.search) {
    return jsonError("Parámetros no permitidos.", 400);
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
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status >= 500) return jsonError("Error del servicio clínico.", 502);
    if (response.status === 204) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) return jsonError("Respuesta clínica inválida.", 502);
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return jsonError("No se pudo conectar con el servicio clínico.", 502);
  }
}
