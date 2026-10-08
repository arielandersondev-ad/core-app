"use client";

import { useActionState } from "react";
import { loginAction } from "@/features/auth/actions/login-action";
import type { LoginFormState } from "@/features/auth/types/auth.types";

const initialState: LoginFormState = {};

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="returnTo" value={returnTo ?? "/dashboard"} />
      <div>
        <label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] block mb-1">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" required
          aria-invalid={Boolean(state.errors?.email)} aria-describedby={state.errors?.email ? "email-error" : undefined}
          className="w-full h-11 px-3.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
        {state.errors?.email && <p id="email-error" className="text-xs text-red-600 mt-1">{state.errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] block mb-1">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          aria-invalid={Boolean(state.errors?.password)} aria-describedby={state.errors?.password ? "password-error" : undefined}
          className="w-full h-11 px-3.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30" />
        {state.errors?.password && <p id="password-error" className="text-xs text-red-600 mt-1">{state.errors.password}</p>}
      </div>
      {state.message && <p role="alert" className="text-xs text-red-600">{state.message}</p>}
      <button type="submit" disabled={pending} className="w-full h-11 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-semibold text-sm hover:opacity-95 disabled:opacity-60 transition-all shadow-xs mt-2">
        {pending ? "Verificando acceso…" : "Entrar a la consulta →"}
      </button>
    </form>
  );
}
