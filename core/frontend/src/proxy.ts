import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/infrastructure/auth/session";

function isCurrentSession(token: string | undefined) {
  if (!token) return false;

  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return false;

    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(
      atob(normalizedPayload),
    ) as { exp?: number };

    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (isCurrentSession(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/organizations/:path*",
    "/orgs/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/settings/:path*",
  ],
};
