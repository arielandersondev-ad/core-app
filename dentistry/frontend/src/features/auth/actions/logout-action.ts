"use server";

import { redirect } from "next/navigation";
import { clearAccessToken, getRefreshToken } from "@/infrastructure/auth/server-session";
import { requestSessionRevocation } from "@/infrastructure/auth/session-refresh";

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) await requestSessionRevocation(refreshToken);
  await clearAccessToken();
  redirect("/login");
}
