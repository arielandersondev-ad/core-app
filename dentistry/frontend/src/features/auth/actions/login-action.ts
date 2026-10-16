"use server";

import { redirect } from "next/navigation";
import { login, AuthenticationError } from "@/features/auth/services/auth.service";
import type { LoginFormState } from "@/features/auth/types/auth.types";
import { setAccessToken } from "@/infrastructure/auth/server-session";
import { safeReturnTo } from "@/features/auth/utils/safe-return-to";

export async function loginAction(_state: LoginFormState, data: FormData): Promise<LoginFormState> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const destination = safeReturnTo(String(data.get("returnTo") ?? ""));
  const errors: NonNullable<LoginFormState["errors"]> = {};
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) errors.email = "Ingresa un correo válido.";
  if (!password) errors.password = "Ingresa tu contraseña.";
  if (Object.keys(errors).length) return { errors };

  try {
    const result = await login(email, password);
    await setAccessToken(result.access_token, result.expires_in);
  } catch (error) {
    return { message: error instanceof AuthenticationError ? error.message : "Ocurrió un error inesperado." };
  }
  redirect(destination);
}
