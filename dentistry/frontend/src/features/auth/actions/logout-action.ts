"use server";

import { redirect } from "next/navigation";
import { clearAccessToken } from "@/infrastructure/auth/server-session";

export async function logoutAction(): Promise<void> {
  await clearAccessToken();
  redirect("/login");
}
