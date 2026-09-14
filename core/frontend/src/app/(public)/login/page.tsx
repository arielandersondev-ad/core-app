import type { Metadata } from "next";
import LoginPage from "@/features/auth/views/login-page";

export const metadata: Metadata = {
  title: "Acceso administrativo — CrowAnt",
  description: "Ingresa a CrowAnt Core para administrar tu organización.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <LoginPage returnTo={returnTo} />;
}
