"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { patientDetailOptions } from "@/features/patient/api/query-options";
import type { PatientDto } from "@/features/patient/types/patient";
import { ApiError } from "@/infrastructure/http/api-error";
import { PageContainer } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

/**
 * Resuelve el paciente real antes de montar una vista de la feature.
 *
 * La feature de atenciones clínicas es UI-only por ahora, pero el contexto del
 * paciente sí proviene del contrato existente de `features/patient`. Este
 * boundary concentra carga, 404, 403 y reintento para no repetirlos en listado,
 * detalle, alta y perfil de salud.
 */
export function PatientContextBoundary({
  patientId,
  children,
}: {
  patientId: string;
  children: (patient: PatientDto) => ReactNode;
}) {
  const query = useQuery({ ...patientDetailOptions(patientId), retry: false });

  if (query.isPending) {
    return (
      <PageContainer>
        <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Cargando paciente…
        </p>
      </PageContainer>
    );
  }

  if (query.isError) {
    const isMissing = query.error instanceof ApiError && query.error.status === 404;
    const isForbidden = query.error instanceof ApiError && query.error.status === 403;
    const message = isMissing
      ? "No se encontró este paciente en tu organización."
      : isForbidden
        ? "No tienes permiso para consultar este paciente."
        : "No se pudo cargar el paciente. Inténtalo nuevamente.";

    return (
      <PageContainer>
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-sm text-foreground">{message}</p>
          {!isMissing && !isForbidden && (
            <Button variant="outline" onClick={() => { void query.refetch(); }}>
              Reintentar
            </Button>
          )}
          <div className="mt-4">
            <Link href="/patients" className="text-sm text-primary hover:underline">
              Volver a pacientes
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return <>{children(query.data)}</>;
}
