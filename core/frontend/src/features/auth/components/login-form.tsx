"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/features/auth/actions/login-action";
import type { LoginFormState } from "@/features/auth/types/login";

const initialState: LoginFormState = {};

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <input type="hidden" name="returnTo" value={returnTo ?? "/dashboard"} />
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@correo.com"
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.errors?.email)}
          className="h-12 w-full rounded-md border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {state.errors?.email && <p id="email-error" className="mt-2 text-sm text-danger">{state.errors.email}</p>}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña</label>
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="text-xs font-medium text-primary hover:text-primary-accent"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Tu contraseña"
          aria-describedby={state.errors?.password ? "password-error" : undefined}
          aria-invalid={Boolean(state.errors?.password)}
          className="h-12 w-full rounded-md border border-border bg-background px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {state.errors?.password && <p id="password-error" className="mt-2 text-sm text-danger">{state.errors.password}</p>}
      </div>

      {state.message && (
        <div role="alert" className="rounded-md border border-danger/35 bg-danger-subtle px-4 py-3 text-sm text-danger dark:text-red-300">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-accent disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Verificando acceso…" : "Entrar a CrowAnt"}
      </button>
    </form>
  );
}
