import type { NextRequest } from "next/server";
import { proxyToDentistry } from "@/infrastructure/http/dentistry-proxy";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyToDentistry(request, path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
