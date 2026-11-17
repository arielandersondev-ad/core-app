import { NextResponse, type NextRequest } from "next/server";
import {
  accessTokenSecondsLeft,
  DENTISTRY_ACCESS_COOKIE,
  DENTISTRY_REFRESH_COOKIE,
  REFRESH_LEEWAY_SECONDS,
  sessionCookies,
} from "@/infrastructure/auth/session";
import { requestSessionRefresh } from "@/infrastructure/auth/session-refresh";

function isApiRequest(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/api/");
}

function rejectSession(request: NextRequest, clearCookies: boolean) {
  let response: NextResponse;
  if (isApiRequest(request)) {
    // Los route handlers responden 401 por sí mismos; aquí solo se limpian las cookies muertas.
    if (clearCookies) request.cookies.delete([DENTISTRY_ACCESS_COOKIE, DENTISTRY_REFRESH_COOKIE]);
    response = NextResponse.next({ request: { headers: new Headers(request.headers) } });
  } else {
    const login = new URL("/login", request.url);
    login.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
    response = NextResponse.redirect(login);
  }
  if (clearCookies) {
    response.cookies.delete(DENTISTRY_ACCESS_COOKIE);
    response.cookies.delete(DENTISTRY_REFRESH_COOKIE);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const secondsLeft = accessTokenSecondsLeft(request.cookies.get(DENTISTRY_ACCESS_COOKIE)?.value);
  if (secondsLeft > REFRESH_LEEWAY_SECONDS) return NextResponse.next();

  const refreshToken = request.cookies.get(DENTISTRY_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return secondsLeft > 0 ? NextResponse.next() : rejectSession(request, true);
  }

  const outcome = await requestSessionRefresh(refreshToken);
  if (outcome.kind === "renewed") {
    const cookies = sessionCookies(outcome.tokens);
    // La petición actual debe usar ya el token nuevo (layouts y route handlers).
    for (const cookie of cookies) request.cookies.set(cookie.name, cookie.value);
    const response = NextResponse.next({ request: { headers: new Headers(request.headers) } });
    for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  }

  // Rotación concurrente o servicio caído: se conserva la sesión mientras el access siga vigente.
  if (outcome.kind !== "invalid" && (secondsLeft > 0 || isApiRequest(request))) {
    return NextResponse.next();
  }
  return rejectSession(request, outcome.kind === "invalid");
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/agenda/:path*", "/patients/:path*",
    "/treatments/:path*", "/inventory/:path*", "/payments/:path*",
    "/register-payment/:path*",
    "/api/:path*",
  ],
};
