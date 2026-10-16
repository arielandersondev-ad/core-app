import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mb-3 shadow-xs">🦷</div>
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Dental Care Clinic</h2>
          <p className="text-xs text-[var(--muted)] mt-1">Ingreso al sistema clínico</p>
        </div>
        <LoginForm returnTo={returnTo} />
        <div className="text-center pt-2 border-t border-[var(--border)]/60">
          <Link href="/landing" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">← Volver a la página principal</Link>
        </div>
      </div>
    </div>
  );
}
