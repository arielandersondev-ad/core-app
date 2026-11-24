"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { exchangeDevUserAction, listDevUsersAction } from "../actions/dev-exchange.actions";
import type { DevUserOption } from "../services/dev-exchange.service";

/**
 * Usuarios reales de Core (con sus permisos, sucursales y plan reales). Elegir uno canjea una
 * sesión de Dentistry sin contraseña, solo en desarrollo y si Core tiene activo el canje.
 */
export function DevRealUsersSection({ currentUserId }: { currentUserId: string | null }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [users, setUsers] = useState<DevUserOption[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    // Con un pequeño retraso para no consultar a Core en cada tecla.
    const timer = setTimeout(() => {
      void listDevUsersAction(search).then((result) => {
        if (cancelled) return;
        setEnabled(result.enabled);
        if (result.enabled) {
          setUsers(result.users);
          setMessage(result.error ?? null);
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  if (enabled === false) return null;

  const exchange = (userId: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await exchangeDevUserAction(userId, pathname);
      if (result?.error) setMessage(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-1.5 border-t border-[var(--border,#e4e4e7)] dark:border-[#27272a] pt-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--foreground,#09090b)] dark:text-[#fafafa]">
          Usuarios reales (Core)
        </span>
        <span className="text-[9px] font-mono text-[var(--muted,#71717a)]">permisos y plan reales</span>
      </div>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nombre o correo…"
        aria-label="Buscar usuario real"
        className="h-8 w-full rounded-lg border border-[var(--border,#e4e4e7)] dark:border-[#27272a] bg-transparent px-2.5 text-[11px] outline-none focus:border-emerald-500/60"
      />
      {message && (
        <p role="alert" className="text-[10px] text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
      <div className="flex max-h-44 flex-col gap-1 overflow-y-auto pr-0.5">
        {enabled === null && <span className="text-[10px] text-[var(--muted,#71717a)]">Cargando usuarios…</span>}
        {enabled && users.length === 0 && !message && (
          <span className="text-[10px] text-[var(--muted,#71717a)]">Sin resultados.</span>
        )}
        {users.map((user) => {
          const isCurrent = user.id === currentUserId;
          return (
            <button
              key={user.id}
              type="button"
              disabled={isPending}
              onClick={() => exchange(user.id)}
              className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors disabled:opacity-60 cursor-pointer ${
                isCurrent
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-[var(--border,#e4e4e7)] dark:border-[#27272a] hover:border-emerald-500/40 hover:bg-[var(--surface-subtle,#f4f4f5)] dark:hover:bg-[#27272a]/70"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">{user.name || user.email}</span>
                {isCurrent && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Sesión activa" />}
              </span>
              <span className="block truncate text-[10px] text-[var(--muted,#71717a)]">
                {[user.organizationName, user.roleNames.join(", "), user.email].filter(Boolean).join(" · ")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
