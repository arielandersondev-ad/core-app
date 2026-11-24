"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setSession } from "@/infrastructure/auth/server-session";
import { safeReturnTo } from "@/features/auth/utils/safe-return-to";
import {
  DevExchangeError,
  devExchangeConfigured,
  exchangeDevUser,
  listDevUsers,
  type DevUserOption,
} from "../services/dev-exchange.service";

export type DevUsersResult =
  | { enabled: false }
  | { enabled: true; users: DevUserOption[]; error?: string };

function assertDevelopment(): void {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("El canje de desarrollo solo está disponible en modo de desarrollo.");
  }
}

/** Usuarios reales de Core disponibles para canjear; `enabled: false` si no está configurado. */
export async function listDevUsersAction(search?: string): Promise<DevUsersResult> {
  assertDevelopment();
  if (!devExchangeConfigured()) return { enabled: false };
  try {
    return { enabled: true, users: await listDevUsers(search) };
  } catch (error) {
    return {
      enabled: true,
      users: [],
      error: error instanceof DevExchangeError ? error.message : "No se pudieron cargar los usuarios.",
    };
  }
}

/** Canjea un token real para el usuario y deja la sesión (access + refresh) en cookies. */
export async function exchangeDevUserAction(
  userId: string,
  currentPath = "/patients",
): Promise<{ error: string } | void> {
  assertDevelopment();
  try {
    await setSession(await exchangeDevUser(userId));
  } catch (error) {
    return { error: error instanceof DevExchangeError ? error.message : "No se pudo canjear el token." };
  }
  revalidatePath("/", "layout");
  redirect(safeReturnTo(currentPath === "/login" || currentPath === "/" ? "/patients" : currentPath));
}
