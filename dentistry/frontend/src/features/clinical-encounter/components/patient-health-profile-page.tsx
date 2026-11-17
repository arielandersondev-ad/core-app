"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PatientContextBoundary } from "@/features/clinical-encounter/components/patient-context-boundary";
import { Panel } from "@/features/clinical-encounter/components/clinical-encounter-panel";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";
import { TextBlock } from "@/features/clinical-encounter/components/clinical-encounter-text-block";
import { ToastStack } from "@/features/clinical-encounter/components/clinical-encounter-toast-stack";
import { usePatientHealthProfile } from "@/features/clinical-encounter/hooks/use-clinical-encounter-data";
import { useSavePatientHealthProfile } from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import { useToasts } from "@/features/clinical-encounter/hooks/use-toasts";
import { formatDateTimeShort } from "@/features/clinical-encounter/utils/dates";
import {
  HEALTH_PROFILE_FIELDS,
  canEditHealthProfile,
  canReadHealthProfile,
  isDraftDirty,
  shouldResetDraft,
  toHealthProfileDraft,
  toHealthProfileInput,
  type HealthProfileDraft,
  type HealthProfileFieldKey,
} from "@/features/clinical-encounter/utils/health-profile-form";
import type { PatientDto } from "@/features/patient/types/patient";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";

export function PatientHealthProfilePage({ patientId }: { patientId: string }) {
  const session = useAuthenticatedSession();
  const canRead = canReadHealthProfile(session.permissions);

  if (!canRead) {
    return (
      <PageContainer>
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground">
            No tienes permiso para consultar el perfil de salud de este paciente.
          </p>
          <Link
            href={`/patients/${patientId}`}
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Volver al paciente
          </Link>
        </div>
      </PageContainer>
    );
  }

  // El perfil es información clínica: lectura y escritura exigen el permiso
  // de atenciones, no el de filiación del paciente.
  const canEdit = canEditHealthProfile(session.permissions);

  return (
    <PatientContextBoundary patientId={patientId}>
      {(patient) => <PatientHealthProfileView patient={patient} canEdit={canEdit} />}
    </PatientContextBoundary>
  );
}

function PatientHealthProfileView({
  patient,
  canEdit,
}: {
  patient: PatientDto;
  canEdit: boolean;
}) {
  const router = useRouter();
  const query = usePatientHealthProfile(patient.id);
  const saveProfile = useSavePatientHealthProfile(patient.id);
  const { toasts, pushToast, dismissToast } = useToasts();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HealthProfileDraft | null>(null);
  const draftSource = useRef<string | null>(null);

  const profile = query.data;
  const profileVersion =
    profile?.rowVersion != null ? `v${profile.rowVersion}` : (profile?.updatedAt ?? null);

  // Reinicia el borrador solo cuando el perfil guardado cambia de versión,
  // no en cada re-render ni en refetch con los mismos datos.
  useEffect(() => {
    if (!editing || !profile) return;
    if (!shouldResetDraft(draftSource.current, profileVersion)) return;

    setDraft(toHealthProfileDraft(profile));
    draftSource.current = profileVersion;
  }, [editing, profile, profileVersion]);

  const startEditing = () => {
    if (!profile) return;
    setDraft(toHealthProfileDraft(profile));
    draftSource.current = profileVersion;
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    draftSource.current = null;
  };

  const updateDraft = (key: HealthProfileFieldKey, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveDraft = () => {
    if (!draft) return;

    saveProfile.mutate(toHealthProfileInput(draft), {
      onSuccess: () => {
        cancelEditing();
        pushToast("Perfil de salud actualizado correctamente.", "success");
      },
      onError: () => {
        pushToast("No se pudo guardar el perfil de salud. Inténtalo nuevamente.", "danger");
      },
    });
  };

  const isDirty = Boolean(draft && profile && isDraftDirty(draft, profile));

  return (
    <PageContainer>
      <PageHeader
        title="Perfil de salud"
        description={`Antecedentes clínicos registrados de ${patient.fullName}.`}
        breadcrumbs={[
          { label: "Pacientes", href: "/patients" },
          { label: patient.fullName, href: `/patients/${patient.id}` },
          { label: "Perfil de salud" },
        ]}
        action={
          <>
            <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}`)}>
              Volver al paciente
            </Button>
            {editing ? (
              <>
                <Button variant="outline" onClick={cancelEditing} disabled={saveProfile.isPending}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={saveDraft}
                  loading={saveProfile.isPending}
                  disabled={!isDirty}
                >
                  Guardar
                </Button>
              </>
            ) : (
              canEdit &&
              profile && (
                <Button variant="primary" onClick={startEditing}>
                  Editar
                </Button>
              )
            )}
          </>
        }
      />

      {query.isPending ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted"
        >
          Cargando perfil de salud…
        </p>
      ) : query.isError ? (
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-sm text-foreground">
            No se pudo cargar el perfil de salud. Inténtalo nuevamente.
          </p>
          <Button variant="outline" onClick={() => { void query.refetch(); }}>
            Reintentar
          </Button>
        </div>
      ) : profile ? (
        <>
          {editing ? (
            <Panel
              id="health-profile-edit"
              title="Editar perfil de salud"
              description="Los campos vacíos se guardan como null; «Sin registrar» es solo la representación de lectura."
            >
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {HEALTH_PROFILE_FIELDS.map((field) => (
                  <TextAreaField
                    key={field.key}
                    id={`health-profile-${field.key}`}
                    label={field.label}
                    hint={field.hint}
                    value={draft?.[field.key] ?? ""}
                    onChange={(value) => updateDraft(field.key, value)}
                    rows={4}
                  />
                ))}
              </div>
            </Panel>
          ) : (
            <Panel
              id="health-profile-read"
              title="Antecedentes registrados"
              description="Los campos vacíos se muestran como «Sin registrar»; la ausencia también es información clínica."
            >
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {HEALTH_PROFILE_FIELDS.map((field) => (
                  <TextBlock key={field.key} label={field.label} value={profile[field.key]} />
                ))}
              </div>
            </Panel>
          )}

          {profile.updatedAt && (
            <p className="text-xs text-muted">
              Última actualización: {formatDateTimeShort(profile.updatedAt)}
            </p>
          )}
        </>
      ) : null}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PageContainer>
  );
}
