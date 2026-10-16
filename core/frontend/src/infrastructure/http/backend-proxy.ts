import 'server-only';

import type { NextRequest } from 'next/server';
import { env } from '@/infrastructure/config/env';
import { getSessionToken } from '@/infrastructure/auth/server-session';

const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const UUID_SEGMENT = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

type ProxyMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ProxyRule = {
  methods: readonly ProxyMethod[];
  pattern: RegExp;
  backendPath: (match: RegExpExecArray) => string;
};

const proxyRules: readonly ProxyRule[] = [
  // Planes y suscripciones. Cada ruta queda enumerada para que el BFF no sea un proxy abierto.
  {
    methods: ['GET', 'POST'],
    pattern: /^plans$/,
    backendPath: () => '/plans',
  },
  {
    methods: ['GET'],
    pattern: /^plans\/assignments$/,
    backendPath: () => '/plans/assignments',
  },
  {
    methods: ['GET', 'PATCH', 'DELETE'],
    pattern: new RegExp(`^plans/(${UUID_SEGMENT})$`),
    backendPath: (match) => `/plans/${match[1]}`,
  },
  {
    methods: ['GET'],
    pattern: new RegExp(`^organizations/(${UUID_SEGMENT})/plans$`),
    backendPath: (match) => `/organizations/${match[1]}/plans`,
  },
  {
    methods: ['PUT'],
    pattern: new RegExp(`^organizations/(${UUID_SEGMENT})/plans/([A-Z][A-Z0-9_]*)$`),
    backendPath: (match) => `/organizations/${match[1]}/plans/${match[2]}`,
  },
  {
    methods: ['PATCH'],
    pattern: new RegExp(`^organizations/(${UUID_SEGMENT})/plans/([A-Z][A-Z0-9_]*)/status$`),
    backendPath: (match) => `/organizations/${match[1]}/plans/${match[2]}/status`,
  },

  //organizasiones
  {
    methods: ['GET', 'POST'],
    pattern: /^organizations$/,
    backendPath: () => '/organizations',
  },
  {
    methods: ['GET'],
    pattern: new RegExp(`^organizations/(${UUID_SEGMENT})/branches$`),
    backendPath: (match) => `/organizations/${match[1]}/branches`,
  },
  {
    methods: ['GET'],
    pattern: new RegExp(`^organizations/(${UUID_SEGMENT})/users$`),
    backendPath: (match) => `/organizations/${match[1]}/users`,
  },
  {
    methods: ['POST'],
    pattern: /^organizations\/setup$/,
    backendPath: () => '/organizations/setup',
  },

  //USers
  {
    methods: ['GET'],
    pattern: /^users$/,
    backendPath: () => '/users',
  },
  {
    methods: ['POST'],
    pattern: /^users\/create$/,
    backendPath: () => '/users/create',
  },
  //ROles
  {
    methods: ['GET'],
    pattern: /^roles$/,
    backendPath: () => '/role/get-list-org',
  },
  {
    methods: ['POST'],
    pattern: /^roles$/,
    backendPath: () => '/role/create',
  },
  {
    methods: ['GET', 'POST'],
    pattern: /^roles\/permissions$/,
    backendPath: () => '/role/permissions',
  },
  {
    methods: ['GET'],
    pattern: new RegExp(`^roles/(${UUID_SEGMENT})/permissions$`),
    backendPath: (match) => `/role/permissions/${match[1]}`,
  },
  {
    methods: ['PUT'],
    pattern: new RegExp(`^roles/(${UUID_SEGMENT})/permissions$`),
    backendPath: (match) => `/role/${match[1]}/permissions`,
  },
] as const;

function resolveBackendPath(method: ProxyMethod, path: string) {
  for (const rule of proxyRules) {
    const match = rule.pattern.exec(path);
    if (match && rule.methods.includes(method)) {
      return rule.backendPath(match);
    }
  }

  return null;
}

function isMutation(method: ProxyMethod) {
  return method !== 'GET';
}

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  return origin !== null && origin === request.nextUrl.origin;
}

function createBackendHeaders(request: NextRequest, token: string) {
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });

  for (const name of ['accept', 'content-type', 'if-match']) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
}

function createBrowserHeaders(response: Response) {
  const headers = new Headers(NO_STORE_HEADERS);

  for (const name of ['content-type', 'content-disposition', 'etag']) {
    const value = response.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
}

async function readRequestBody(request: NextRequest) {
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return null;
  }

  const body = await request.arrayBuffer();
  return body.byteLength <= MAX_BODY_BYTES ? body : null;
}

export async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const method = request.method as ProxyMethod;
  const path = pathSegments.join('/');
  const backendPath = resolveBackendPath(method, path);

  if (!backendPath) {
    return Response.json(
      { message: 'Ruta o método no permitido por el BFF.' },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  if (isMutation(method) && !hasValidOrigin(request)) {
    return Response.json(
      { message: 'Origen de la petición no permitido.' },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const token = await getSessionToken();
  if (!token) {
    return Response.json(
      { message: 'Sesión requerida.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  let body: ArrayBuffer | undefined;
  if (isMutation(method)) {
    const requestBody = await readRequestBody(request);
    if (requestBody === null) {
      return Response.json(
        { message: 'El cuerpo de la petición supera el límite permitido.' },
        { status: 413, headers: NO_STORE_HEADERS },
      );
    }
    body = requestBody;
  }

  const backendUrl = new URL(backendPath, env.apiUrl);
  backendUrl.search = request.nextUrl.search;

  try {
    const response = await fetch(backendUrl, {
      method,
      headers: createBackendHeaders(request, token),
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return new Response(response.body, {
      status: response.status,
      headers: createBrowserHeaders(response),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    return Response.json(
      { message: timedOut ? 'El backend tardó demasiado en responder.' : 'No se pudo conectar con el backend.' },
      { status: timedOut ? 504 : 502, headers: NO_STORE_HEADERS },
    );
  }
}
