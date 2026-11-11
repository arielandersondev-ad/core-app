"use server";

import { redirect } from "next/navigation";
import { authService, AuthenticationError } from '@/features/auth/services/auth.service';
import { setSession } from '@/infrastructure/auth/server-session';
import type { LoginFormState } from "@/features/auth/types/login";

const DEFAULT_DESTINATION = "/dashboard";

// Solo rutas internas: rechaza "//host", "/\host" (los navegadores lo tratan como "//host"),
// saltos de línea y destinos que no aportan (login o el BFF).
function safeDestination(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n\t]/.test(value)) {
    return DEFAULT_DESTINATION;
  }
  const path = value.split(/[?#]/, 1)[0];
  if (path === "/login" || path.startsWith("/api/")) return DEFAULT_DESTINATION;
  return value;
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const destination = safeDestination(String(formData.get("returnTo") ?? ""));
  const errors: NonNullable<LoginFormState["errors"]> = {};

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Ingresa un correo electrónico válido.";
  }

  if (!password) {
    errors.password = "Ingresa tu contraseña.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await setSession(await authService.login({ email, password }));
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { message: error.message };
    }

    return { message: "Ocurrió un error inesperado. Inténtalo nuevamente." };
  }

  redirect(destination);
}
