import Link from "next/link";
import { ApiError } from "@/infrastructure/http/api-error";

export function PatientListError({ error, loginHref, onRetry }: { error: Error; loginHref: string; onRetry: () => void }) {
  const status = error instanceof ApiError ? error.status : undefined;
  const message = status === 401
    ? "Tu sesión venció. Vuelve a iniciar sesión para consultar los pacientes."
    : status === 403
      ? "No tienes permiso para consultar pacientes."
      : status === 504
        ? "La consulta tardó demasiado. Inténtalo nuevamente."
        : "No se pudieron cargar los pacientes. Inténtalo nuevamente.";
  return (
    <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center space-y-4">
      <p className="text-sm text-foreground">{message}</p>
      {status === 401 ? (
        <Link href={loginHref} prefetch={false} className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Iniciar sesión</Link>
      ) : status !== 403 && (
        <button type="button" onClick={onRetry} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background">Reintentar</button>
      )}
    </div>
  );
}
