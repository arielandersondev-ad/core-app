"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService, AuthenticationError } from '@/features/auth/services/auth.service';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/infrastructure/auth/session";
import type { LoginFormState } from "@/features/auth/types/login";

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedDestination = String(formData.get("returnTo") ?? "");
  const destination =
    requestedDestination.startsWith("/") && !requestedDestination.startsWith("//")
      ? requestedDestination
      : "/dashboard";
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
    const result = await authService.login({ email, password });
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, result.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      priority: "high",
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { message: error.message };
    }

    return { message: "Ocurrió un error inesperado. Inténtalo nuevamente." };
  }

  redirect(destination);
}
