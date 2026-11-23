"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { Badge, Button, EmptyState, Icons, Input, ResponsiveModal, Select } from "@/shared/components/ui";
import { isModuleEnabled } from "@/shared/plan/plan-access";
import { useTimeZone } from "@/shared/time/use-time-zone";
import { Panel } from "@/features/clinical-encounter/components/clinical-encounter-panel";
import { clinicalFileAccessUrlOptions } from "@/features/clinical-encounter/api/query-options";
import {
  useClinicalFileAccessUrl,
  useClinicalFileQuota,
  useClinicalFiles,
} from "@/features/clinical-encounter/hooks/use-clinical-encounter-data";
import {
  useAddClinicalFile,
  useRemoveClinicalFile,
  useUpdateClinicalFile,
} from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import type {
  ClinicalFile,
  ClinicalFileCategory,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { formatDateTimeShort } from "@/features/clinical-encounter/utils/dates";
import { formatBytes } from "@/features/clinical-encounter/utils/format";
import {
  CLINICAL_FILE_CATEGORY_LABELS,
  CLINICAL_FILE_CATEGORY_OPTIONS,
  DEFAULT_ALLOWED_MIME_TYPES,
  clinicalFileErrorMessage,
  describeUsage,
  isImage,
  suggestedCategory,
  validateSelectedFile,
} from "@/features/clinical-encounter/utils/clinical-files";

const READ_PERMISSION = "dentistry:files:read";
const CREATE_PERMISSION = "dentistry:files:create";
const DELETE_PERMISSION = "dentistry:files:delete";
const UPDATE_PERMISSION = "dentistry:files:update";

type FileEdit = {
  id: string;
  category: ClinicalFileCategory;
  description: string;
  error?: string;
};

export interface ClinicalFilesPanelProps {
  patientId: string;
  /** Limita la galería a una atención y vincula ahí las subidas. */
  encounterId?: string;
  /** Motivo por el que no se puede adjuntar (p. ej. atención anulada). */
  uploadLockedReason?: string;
  timeZone?: string;
  onNotify?: (message: string, variant: "success" | "danger") => void;
}

/**
 * Galería de archivos del historial clínico. El binario se sube directo al
 * almacenamiento con una URL firmada; aquí solo se orquesta y se informa.
 */
export function ClinicalFilesPanel({
  patientId,
  encounterId,
  uploadLockedReason,
  timeZone,
  onNotify,
}: ClinicalFilesPanelProps) {
  const session = useAuthenticatedSession();
  const canRead = session.permissions.includes(READ_PERMISSION);
  if (!canRead) return null;
  return (
    <ClinicalFilesPanelContent
      patientId={patientId}
      encounterId={encounterId}
      uploadLockedReason={uploadLockedReason}
      timeZone={timeZone}
      onNotify={onNotify}
    />
  );
}

function ClinicalFilesPanelContent({
  patientId,
  encounterId,
  uploadLockedReason,
  timeZone,
  onNotify,
}: ClinicalFilesPanelProps) {
  const session = useAuthenticatedSession();
  const client = useQueryClient();
  const filesQuery = useClinicalFiles(patientId, encounterId);
  const quotaQuery = useClinicalFileQuota();
  const addMutation = useAddClinicalFile(patientId);
  const removeMutation = useRemoveClinicalFile(patientId);
  const updateMutation = useUpdateClinicalFile(patientId);
  // Sin sucursal (galería del paciente): zona de la organización.
  const organizationTimeZone = useTimeZone();
  const displayTimeZone = timeZone ?? organizationTimeZone;

  const [category, setCategory] = useState<ClinicalFileCategory | "">("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ClinicalFile | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FileEdit | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const quota = quotaQuery.data;
  const filesEnabled = isModuleEnabled(session.plan, "files");
  const storageAvailable = quota?.storageAvailable ?? true;
  const canUpload =
    session.permissions.includes(CREATE_PERMISSION) && filesEnabled && storageAvailable && !uploadLockedReason;
  const canDelete = session.permissions.includes(DELETE_PERMISSION) && filesEnabled;
  const canEdit = session.permissions.includes(UPDATE_PERMISSION) && filesEnabled;
  const uploading = addMutation.isPending;
  const usage = quota ? describeUsage(quota) : null;
  const accept = (quota?.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES).join(",");

  const notify = (message: string, variant: "success" | "danger") => onNotify?.(message, variant);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const invalid = validateSelectedFile(file, quota);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setProgress(0);
    try {
      await addMutation.mutateAsync({
        file,
        category: category || suggestedCategory(file.type),
        clinicalEncounterId: encounterId,
        description,
        onProgress: setProgress,
      });
      setDescription("");
      notify("Archivo adjuntado.", "success");
    } catch (failure) {
      setError(clinicalFileErrorMessage(failure));
    } finally {
      setProgress(null);
    }
  };

  const handleDownload = async (file: ClinicalFile) => {
    setDownloadingId(file.id);
    try {
      const signed = await client.fetchQuery(clinicalFileAccessUrlOptions(patientId, file.id, "attachment"));
      window.location.assign(signed.url);
    } catch (failure) {
      notify(clinicalFileErrorMessage(failure), "danger");
    } finally {
      setDownloadingId(null);
    }
  };

  const startEditing = (file: ClinicalFile) => {
    setPendingRemovalId(null);
    setEditing({ id: file.id, category: file.category, description: file.description ?? "" });
  };

  /** Solo cambia datos guardados en la base; el archivo almacenado no se toca. */
  const handleSaveEdit = async (file: ClinicalFile, draft: FileEdit) => {
    try {
      await updateMutation.mutateAsync({
        fileId: file.id,
        input: {
          expectedUpdatedAt: file.updatedAt,
          category: draft.category,
          description: draft.description.trim() || null,
        },
      });
      setEditing(null);
      notify("Datos del archivo actualizados.", "success");
    } catch (failure) {
      setEditing((current) => (current?.id === file.id ? { ...current, error: clinicalFileErrorMessage(failure) } : current));
    }
  };

  const handleRemove = async (file: ClinicalFile) => {
    try {
      await removeMutation.mutateAsync(file.id);
      setPendingRemovalId(null);
      notify("Archivo quitado del historial.", "success");
    } catch (failure) {
      notify(clinicalFileErrorMessage(failure), "danger");
    }
  };

  return (
    <Panel
      id={encounterId ? "ce-detail-files" : "patient-files"}
      title="Archivos clínicos"
      description={
        usage
          ? `Radiografías, fotografías y documentos · ${usage}`
          : "Radiografías, fotografías y documentos del paciente"
      }
      icon={Icons.inventory}
    >
      {canUpload ? (
        <div className="mb-4 space-y-3 rounded-lg border border-dashed border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Tipo"
              selectSize="sm"
              value={category}
              disabled={uploading}
              onChange={(event) => setCategory(event.target.value as ClinicalFileCategory | "")}
              options={[{ value: "", label: "Automático" }, ...CLINICAL_FILE_CATEGORY_OPTIONS]}
            />
            <Input
              label="Descripción (opcional)"
              inputSize="sm"
              value={description}
              maxLength={1000}
              disabled={uploading}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            aria-label="Seleccionar archivo clínico"
            onChange={(event) => { void handleFileSelected(event); }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              leftIcon={Icons.plus}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              loading={uploading}
            >
              Adjuntar archivo
            </Button>
            <p className="text-xs text-muted">
              JPG, PNG o PDF · hasta {formatBytes(quota?.maxFileBytes ?? 10 * 1024 * 1024)}
            </p>
          </div>
          {progress !== null && (
            <div role="status" aria-live="polite" className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-xs text-muted">
                {progress < 1 ? `Subiendo… ${Math.round(progress * 100)}%` : "Verificando archivo…"}
              </p>
            </div>
          )}
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        </div>
      ) : (
        <UploadUnavailableNotice
          reason={
            uploadLockedReason ??
            (!storageAvailable
              ? "El almacenamiento de archivos no está disponible en este momento."
              : !filesEnabled
                ? "Tu plan no incluye subir archivos; puedes consultar los existentes."
                : null)
          }
        />
      )}

      {filesQuery.isPending ? (
        <p role="status" className="text-sm text-muted">Cargando archivos…</p>
      ) : filesQuery.isError ? (
        <div role="alert" className="space-y-3 text-sm">
          <p className="text-foreground">{clinicalFileErrorMessage(filesQuery.error)}</p>
          <Button variant="outline" size="sm" onClick={() => { void filesQuery.refetch(); }}>
            Reintentar
          </Button>
        </div>
      ) : filesQuery.data.length === 0 ? (
        <EmptyState
          className="py-6"
          message="Sin archivos"
          description="Adjunta radiografías, fotografías o documentos del paciente."
          icon={Icons.inventory}
        />
      ) : (
        <ul className="space-y-3">
          {filesQuery.data.map((file) => {
            const confirmingRemoval = pendingRemovalId === file.id;
            if (editing?.id === file.id) {
              const saving = updateMutation.isPending;
              return (
                <li key={file.id} className="space-y-3 rounded-lg border border-primary/40 bg-surface-subtle/60 p-3">
                  <p className="truncate text-sm font-medium text-foreground">{file.originalFilename}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      label="Tipo"
                      selectSize="sm"
                      value={editing.category}
                      disabled={saving}
                      onChange={(event) =>
                        setEditing({ ...editing, category: event.target.value as ClinicalFileCategory, error: undefined })}
                      options={[...CLINICAL_FILE_CATEGORY_OPTIONS]}
                    />
                    <Input
                      label="Descripción"
                      inputSize="sm"
                      value={editing.description}
                      maxLength={1000}
                      disabled={saving}
                      onChange={(event) => setEditing({ ...editing, description: event.target.value, error: undefined })}
                    />
                  </div>
                  {editing.error && <p role="alert" className="text-xs text-danger">{editing.error}</p>}
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => { void handleSaveEdit(file, editing); }} disabled={saving} loading={saving}>
                      Guardar
                    </Button>
                  </div>
                </li>
              );
            }
            return (
              <li key={file.id} className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-surface-subtle/60 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.originalFilename}</p>
                  <p className="font-mono text-[10px] text-muted">
                    {formatBytes(file.sizeBytes)} · {formatDateTimeShort(file.uploadedAt ?? file.createdAt, displayTimeZone)}
                  </p>
                  {file.description && <p className="mt-1 text-xs text-muted">{file.description}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant={file.category === "RADIOGRAPH" ? "primary" : "neutral"}>
                      {CLINICAL_FILE_CATEGORY_LABELS[file.category]}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  {confirmingRemoval ? (
                    <>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => { void handleRemove(file); }}
                        disabled={removeMutation.isPending}
                        loading={removeMutation.isPending}
                      >
                        Quitar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingRemovalId(null)} disabled={removeMutation.isPending}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" leftIcon={Icons.eye} onClick={() => setPreviewFile(file)}>
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { void handleDownload(file); }}
                        disabled={downloadingId === file.id}
                        loading={downloadingId === file.id}
                      >
                        Descargar
                      </Button>
                      {canEdit && (
                        <Button size="sm" variant="ghost" onClick={() => startEditing(file)}>
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setPendingRemovalId(file.id); }}>
                          Quitar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {previewFile && (
        <ClinicalFilePreview patientId={patientId} file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </Panel>
  );
}

function UploadUnavailableNotice({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return <p className="mb-4 rounded-lg bg-surface-subtle px-3 py-2 text-xs text-muted">{reason}</p>;
}

/** Vista previa con un enlace firmado corto; nunca se guarda el binario en el navegador. */
function ClinicalFilePreview({
  patientId,
  file,
  onClose,
}: {
  patientId: string;
  file: ClinicalFile;
  onClose: () => void;
}) {
  const accessQuery = useClinicalFileAccessUrl(patientId, file.id, "inline");
  const url = accessQuery.data?.url;

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title={file.originalFilename}
      eyebrow={CLINICAL_FILE_CATEGORY_LABELS[file.category]}
      icon={Icons.eye}
      maxWidth="max-w-3xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {accessQuery.isPending ? (
        <p role="status" className="p-6 text-center text-sm text-muted">Cargando vista previa…</p>
      ) : accessQuery.isError || !url ? (
        <div role="alert" className="space-y-3 p-6 text-center text-sm">
          <p>{clinicalFileErrorMessage(accessQuery.error)}</p>
          <Button variant="outline" size="sm" onClick={() => { void accessQuery.refetch(); }}>
            Reintentar
          </Button>
        </div>
      ) : isImage(file.mimeType) ? (
        // Enlace firmado de otro origen y corta vigencia: next/image no aplica.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.description ?? file.originalFilename} className="mx-auto max-h-[70vh] w-auto rounded-lg" />
      ) : (
        <iframe src={url} title={file.originalFilename} className="h-[70vh] w-full rounded-lg border border-border" />
      )}
    </ResponsiveModal>
  );
}
