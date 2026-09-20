"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/shared/components/ui/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"doctor" | "asistente">("doctor");
  const [pin, setPin] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Acceso simplificado sin fricción para el MVP
    router.push("/agenda");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mb-3 shadow-xs">
            🦷
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Dental Care Clinic
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Ingreso al sistema clínico
          </p>
        </div>

        {/* Selector de Rol */}
        <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setRole("doctor")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === "doctor"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            👨‍⚕️ Odontólogo
          </button>
          <button
            type="button"
            onClick={() => setRole("asistente")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === "asistente"
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            👩‍💼 Asistente
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] block mb-1">
              Usuario / Correo
            </label>
            <input
              type="text"
              defaultValue={
                role === "doctor"
                  ? "dr.andres@dentalcare.bo"
                  : "asistente@dentalcare.bo"
              }
              className="w-full h-11 px-3.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] block mb-1">
              PIN / Contraseña rápida
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={6}
              className="w-full h-11 px-3.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center text-lg tracking-widest text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-semibold text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-xs mt-2"
          >
            Entrar a la consulta →
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[var(--border)]/60">
          <Link
            href="/landing"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}
