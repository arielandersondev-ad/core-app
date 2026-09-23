import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/infrastructure/http/backend-proxy';

type ProxyContext = {params: Promise<{ path: string[] }>};

async function handle(request: NextRequest, context: ProxyContext) {

  console.log('Proxying request to backend:', request.method, request.url, 'context: ',context);
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
