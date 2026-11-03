"use client";

import { useDeletePatient } from "@/features/patient/hooks/use-delete-patient";
import { ApiError } from "@/infrastructure/http/api-error";
import { SessionContextChangedError } from "@/infrastructure/auth/session-context";
import { Button } from "@/shared/components/ui";

type Props = {
  patientName: string;
  patientId: string;
  onCancel: () => void;
  onDeleted: () => void;
};

export function DeletePatientConfirmation({ patientName, patientId, onCancel, onDeleted }: Props) {
  const mutation = useDeletePatient(patientId);
  const needsLogin = mutation.error instanceof SessionContextChangedError || (mutation.error instanceof ApiError && mutation.error.status === 401);
  const message = mutation.error instanceof SessionContextChangedError
    ? "La sesión activa pertenece a otra cuenta u organización. Inicia sesión con la cuenta original para continuar."
    : mutation.error instanceof ApiError && mutation.error.status === 401
      ? "Tu sesión venció. Inicia sesión para continuar."
      : mutation.error instanceof ApiError && mutation.error.status === 403
        ? "No tienes permiso para eliminar pacientes."
        : mutation.error?.message ?? "No se pudo eliminar el paciente. Inténtalo nuevamente.";
  const loginHref = `/login?returnTo=${encodeURIComponent(`/patients/${patientId}`)}`;

  async function confirmDelete() {
    try {
      await mutation.mutateAsync();
      onDeleted();
    } catch {
      // Keep confirmation available so the request can be retried.
    }
  }

  return (
    <section role="alertdialog" aria-labelledby="delete-patient-title" aria-describedby="delete-patient-description" aria-busy={mutation.isPending} className="my-5 space-y-4 rounded-xl border border-danger/30 bg-danger-subtle p-5">
      <div>
        <h2 id="delete-patient-title" className="font-display text-base font-semibold text-foreground">¿Eliminar a {patientName}?</h2>
        <p id="delete-patient-description" className="mt-2 text-sm text-muted">El paciente dejará de aparecer en los listados y no podrá abrirse. Sus datos permanecerán guardados con la fecha de eliminación registrada.</p>
      </div>
      {mutation.error && <div role="alert" className="space-y-2 text-sm text-danger"><p>{message}</p>{needsLogin && <a href={loginHref} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Iniciar sesión en otra pestaña</a>}</div>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={mutation.isPending} onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" loading={mutation.isPending} onClick={() => { void confirmDelete(); }}>{mutation.isPending ? "Eliminando…" : "Confirmar eliminación"}</Button>
      </div>
    </section>
  );
}
