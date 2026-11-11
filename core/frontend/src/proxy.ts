import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  accessTokenSecondsLeft,
  REFRESH_COOKIE,
  REFRESH_LEEWAY_SECONDS,
  SESSION_COOKIE,
  sessionCookies,
} from "@/infrastructure/auth/session";
import { requestSessionRefresh } from "@/infrastructure/auth/session-refresh";

function isApiRequest(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/api/");
}

function redirectToLogin(request: NextRequest, clearCookies: boolean) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  if (clearCookies) {
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  return response;
}

function rejectSession(request: NextRequest, clearCookies: boolean) {
  if (!isApiRequest(request)) return redirectToLogin(request, clearCookies);
  // El BFF responde 401 por sí mismo; aquí solo se limpian las cookies muertas.
  if (clearCookies) request.cookies.delete([SESSION_COOKIE, REFRESH_COOKIE]);
  const response = NextResponse.next({ request: { headers: new Headers(request.headers) } });
  if (clearCookies) {
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  const secondsLeft = accessTokenSecondsLeft(accessToken);
  if (secondsLeft > REFRESH_LEEWAY_SECONDS) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return secondsLeft > 0 ? NextResponse.next() : rejectSession(request, true);
  }

  const outcome = await requestSessionRefresh(refreshToken);
  if (outcome.kind === "renewed") {
    const cookies = sessionCookies(outcome.tokens);
    // La petición actual debe usar ya el token nuevo (route handlers y Server Components).
    for (const cookie of cookies) request.cookies.set(cookie.name, cookie.value);
    const response = NextResponse.next({ request: { headers: new Headers(request.headers) } });
    for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  }

  // Si otra petición ya está rotando o el backend no responde, se conserva la sesión mientras
  // el access token siga vigente; solo un rechazo explícito del backend la termina.
  if (outcome.kind !== "invalid" && (secondsLeft > 0 || isApiRequest(request))) {
    return NextResponse.next();
  }
  return rejectSession(request, outcome.kind === "invalid");
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/organizations/:path*",
    "/orgs/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
