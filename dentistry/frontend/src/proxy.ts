import { NextResponse, type NextRequest } from "next/server";
import { DENTISTRY_ACCESS_COOKIE } from "@/infrastructure/auth/session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(DENTISTRY_ACCESS_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/agenda/:path*", "/patients/:path*",
    "/treatments/:path*", "/inventory/:path*", "/payments/:path*",
    "/register-payment/:path*",
  ],
};
