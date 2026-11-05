"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setAccessToken, clearAccessToken } from "@/infrastructure/auth/server-session";
import { DEV_PERSONAS } from "../types/personas";
import { createDevJwt } from "../services/dev-token.service";

export async function switchPersonaAction(personaId: string, currentPath = "/agenda"): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("El Dev Persona Switcher solo está disponible en modo de desarrollo.");
  }

  if (personaId === "logout") {
    await clearAccessToken();
    revalidatePath("/", "layout");
    redirect("/login");
  }

  const persona = DEV_PERSONAS[personaId];
  if (!persona) {
    throw new Error(`Persona '${personaId}' desconocida.`);
  }

  // Vigencia estándar de 1800s (30 minutos)
  const token = createDevJwt(persona, 1800);
  await setAccessToken(token, 1800);

  revalidatePath("/", "layout");

  // Si estamos en login o landing, llevar directamente a /agenda
  if (!currentPath || currentPath === "/login" || currentPath === "/landing" || currentPath === "/") {
    redirect("/agenda");
  } else {
    redirect(currentPath);
  }
}
