import "server-only";

import { cookies } from "next/headers";
import { DENTISTRY_ACCESS_COOKIE } from "./session";

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(DENTISTRY_ACCESS_COOKIE)?.value ?? null;
}

export async function setAccessToken(token: string, expiresIn: number): Promise<void> {
  (await cookies()).set(DENTISTRY_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
    priority: "high",
  });
}

export async function clearAccessToken(): Promise<void> {
  (await cookies()).delete(DENTISTRY_ACCESS_COOKIE);
}
