import { NextRequest, NextResponse } from "next/server";
import { setAccessToken, clearAccessToken } from "@/infrastructure/auth/server-session";
import { DEV_PERSONAS } from "@/features/dev-auth/types/personas";
import { createDevJwt } from "@/features/dev-auth/services/dev-token.service";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Disponible solo en desarrollo." }, { status: 403 });
  }

  const as = request.nextUrl.searchParams.get("as") ?? "owner";
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/agenda";

  if (as === "logout") {
    await clearAccessToken();
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const persona = DEV_PERSONAS[as];
  if (!persona) {
    return NextResponse.json(
      { error: `Persona '${as}' desconocida. Opciones: ${Object.keys(DEV_PERSONAS).join(", ")}` },
      { status: 400 },
    );
  }

  const token = createDevJwt(persona, 1800);
  await setAccessToken(token, 1800);

  return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
}
