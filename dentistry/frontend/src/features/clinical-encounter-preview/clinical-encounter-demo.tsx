"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  EmptyState,
  Input,
  Select,
  Combobox,
  DatePicker,
  ResponsiveModal,
  Icons,
} from "@/shared/components/ui";
import { PageContainer, PageHeader } from "@app/ui";
import { FormSectionHeader } from "@app/ui/components/ui/FormSectionHeader";
import { Card } from "@app/ui/components/ui/Card";
import { ReadonlyField } from "@app/ui/components/ui/ReadonlyField";
import type { ComboboxOption } from "@/shared/components/ui";
import type {
  ClinicalEncounter,
  EncounterProcedure,
  EncounterStatus,
  TargetType,
  HealthProfile,
  ClinicalFile,
  Patient,
} from "./types";
import {
  mockPatient,
  mockBranches,
  mockProfessionals,
  mockTreatments,
  mockTreatmentProcedures,
  mockAppointments,
  mockHealthProfile,
  mockEncounters,
  mockFiles,
} from "./data/mock";

function calculateAge(birthDate: string): string {
  const date = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return `${age} años`;
}

function statusBadge(status: EncounterStatus) {
  const map: Record<EncounterStatus, { label: string; variant: "primary" | "success" | "neutral" }> = {
    IN_PROGRESS: { label: "En curso", variant: "primary" },
    COMPLETED: { label: "Completada", variant: "success" },
    VOIDED: { label: "Anulada", variant: "neutral" },
  };
  const item = map[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

function formatInstant(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const targetTypeLabels: Record<TargetType, string> = {
  TOOTH: "Pieza",
  REGION: "Región",
  WHOLE_MOUTH: "Boca completa",
  OTHER: "Otro",
};

const FDI_TEETH = [
  "11", "12", "13", "14", "15", "16", "17", "18",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "31", "32", "33", "34", "35", "36", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48",
];

export function ClinicalEncounterDemo() {
  const patient: Patient = mockPatient;

  const [activeTab, setActiveTab] = useState<"encounters" | "profile" | "files">(
    "encounters",
  );
  const [encounters, setEncounters] =
    useState<ClinicalEncounter[]>(mockEncounters);
  const [healthProfile, setHealthProfile] =
    useState<HealthProfile>(mockHealthProfile);
  const [files, setFiles] = useState<ClinicalFile[]>(mockFiles);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailEncounter, setDetailEncounter] =
    useState<ClinicalEncounter | null>(null);
  const [completeEncounter, setCompleteEncounter] =
    useState<ClinicalEncounter | null>(null);
  const [voidEncounter, setVoidEncounter] = useState<ClinicalEncounter | null>(
    null,
  );
  const [healthEditOpen, setHealthEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Create form state
  const [branch, setBranch] = useState(mockBranches[0]);
  const [professional, setProfessional] = useState(mockProfessionals[0]);
  const [startedAt, setStartedAt] = useState("2026-11-06");
  const [startedTime, setStartedTime] = useState("09:00");
  const [examination, setExamination] = useState("");
  const [procedureSummary, setProcedureSummary] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [procedures, setProcedures] = useState<EncounterProcedure[]>([]);

  // Procedure editor draft
  const [procTarget, setProcTarget] = useState<TargetType>("TOOTH");
  const [procTooth, setProcTooth] = useState("16");
  const [procRegion, setProcRegion] = useState("");
  const [procDescription, setProcDescription] = useState("");
  const [procTreatmentProcedureId, setProcTreatmentProcedureId] = useState("");

  // Complete modal
  const [completeDate, setCompleteDate] = useState("");
  const [completeTime, setCompleteTime] = useState("");

  // Void modal
  const [voidReason, setVoidReason] = useState("");

  // Health edit
  const [healthDraft, setHealthDraft] = useState<HealthProfile>(healthProfile);

  // Upload
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<"RADIOGRAPH" | "ATTACHMENT">(
    "RADIOGRAPH",
  );
  const [uploadRadiographType, setUploadRadiographType] = useState("PANORAMIC");
  const [uploadTooth, setUploadTooth] = useState("");
  const [uploadRegion, setUploadRegion] = useState("");
  const [uploadSide, setUploadSide] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");

  const filteredEncounters = encounters.filter((encounter) => {
    const matchesSearch =
      search.trim() === "" ||
      encounter.examinationSummary.toLowerCase().includes(search.toLowerCase()) ||
      encounter.professionalName.toLowerCase().includes(search.toLowerCase()) ||
      encounter.branchName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || encounter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetCreateForm = () => {
    setBranch(mockBranches[0]);
    setProfessional(mockProfessionals[0]);
    setStartedAt("2026-11-06");
    setStartedTime("09:00");
    setExamination("");
    setProcedureSummary("");
    setClinicalNotes("");
    setAppointmentId("");
    setTreatmentId("");
    setProcedures([]);
    setProcTarget("TOOTH");
    setProcTooth("16");
    setProcRegion("");
    setProcDescription("");
    setProcTreatmentProcedureId("");
  };

  const handleAddProcedure = () => {
    const newProcedure: EncounterProcedure = {
      id: `proc-${Date.now()}`,
      targetType: procTarget,
      toothNumber: procTarget === "TOOTH" ? procTooth : undefined,
      targetDescription:
        procTarget === "REGION" || procTarget === "OTHER" ? procRegion : undefined,
      description: procDescription || "Procedimiento realizado",
      treatmentProcedureId: procTreatmentProcedureId || undefined,
    };
    setProcedures((prev) => [...prev, newProcedure]);
    setProcDescription("");
    setProcRegion("");
    setProcTreatmentProcedureId("");
  };

  const handleRemoveProcedure = (id: string) => {
    setProcedures((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreateEncounter = () => {
    const started = new Date(`${startedAt}T${startedTime}:00`).toISOString();
    const newEncounter: ClinicalEncounter = {
      id: `enc-${Date.now()}`,
      patientId: patient.id,
      branchName: branch,
      professionalName: professional,
      startedAt: started,
      examinationSummary: examination || "Sin exploración registrada",
      procedureSummary: procedureSummary || undefined,
      clinicalNotes: clinicalNotes || undefined,
      status: "IN_PROGRESS",
      appointmentId: appointmentId || undefined,
      treatmentId: treatmentId || undefined,
      procedures,
    };
    setEncounters((prev) => [newEncounter, ...prev]);
    setCreateOpen(false);
    resetCreateForm();
  };

  const handleCompleteEncounter = () => {
    if (!completeEncounter) return;
    const ended =
      completeDate && completeTime
        ? new Date(`${completeDate}T${completeTime}:00`).toISOString()
        : new Date().toISOString();
    setEncounters((prev) =>
      prev.map((encounter) =>
        encounter.id === completeEncounter.id
          ? {
              ...encounter,
              status: "COMPLETED",
              endedAt: ended,
              completedBy: encounter.professionalName,
            }
          : encounter,
      ),
    );
    setCompleteEncounter(null);
    setCompleteDate("");
    setCompleteTime("");
  };

  const handleVoidEncounter = () => {
    if (!voidEncounter) return;
    setEncounters((prev) =>
      prev.map((encounter) =>
        encounter.id === voidEncounter.id
          ? { ...encounter, status: "VOIDED", voidReason: voidReason }
          : encounter,
      ),
    );
    setVoidEncounter(null);
    setVoidReason("");
  };

  const handleSaveHealthProfile = () => {
    setHealthProfile(healthDraft);
    setHealthEditOpen(false);
  };

  const handleUploadFile = () => {
    const newFile: ClinicalFile = {
      id: `file-${Date.now()}`,
      name: uploadName || "archivo-clinico",
      category: uploadCategory,
      mimeType:
        uploadCategory === "RADIOGRAPH" ? "image/jpeg" : "application/pdf",
      sizeBytes: 512_000,
      createdAt: new Date().toISOString(),
      radiographType:
        uploadCategory === "RADIOGRAPH" ? uploadRadiographType : undefined,
      toothNumber: uploadTooth || undefined,
      region: uploadRegion || undefined,
      side: uploadSide || undefined,
      notes: uploadNotes || undefined,
    };
    setFiles((prev) => [newFile, ...prev]);
    setUploadOpen(false);
    setUploadName("");
    setUploadTooth("");
    setUploadRegion("");
    setUploadSide("");
    setUploadNotes("");
  };

  const branchOptions: ComboboxOption[] = mockBranches.map((b) => ({
    value: b,
    label: b,
  }));
  const professionalOptions: ComboboxOption[] = mockProfessionals.map((p) => ({
    value: p,
    label: p,
  }));
  const treatmentOptions: ComboboxOption[] = mockTreatments.map((t) => ({
    value: t.id,
    label: t.label,
  }));
  const treatmentProcedureOptions: ComboboxOption[] = mockTreatmentProcedures
    .filter((tp) => (treatmentId ? tp.treatmentId === treatmentId : true))
    .map((tp) => ({ value: tp.id, label: tp.label }));
  const appointmentOptions: ComboboxOption[] = mockAppointments.map((a) => ({
    value: a.id,
    label: a.label,
  }));
  const toothOptions: ComboboxOption[] = FDI_TEETH.map((t) => ({
    value: t,
    label: `Pieza ${t}`,
  }));

  return (
    <PageContainer>
      <div className="mb-2 text-xs text-muted">
        Vista previa de refinamiento · datos ficticios en memoria · sin
        validación ni persistencia.
      </div>

      <PageHeader
        title={patient.fullName}
        description={`Paciente ${patient.status === "ACTIVE" ? "activo" : "inactivo"} · ${calculateAge(patient.birthDate)} · ${patient.sex}`}
        breadcrumbs={[
          { label: "Pacientes", href: "/patients" },
          { label: patient.fullName },
          { label: "Atenciones clínicas" },
        ]}
        badge={statusBadge("IN_PROGRESS")}
        action={
          <div className="flex gap-2">
            <Button
              variant="primary"
              leftIcon={Icons.plus}
              onClick={() => setCreateOpen(true)}
            >
              Nueva atención
            </Button>
          </div>
        }
      />

      {/* Patient context card */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <ReadonlyField label="Sucursal actual" value="Sucursal Centro" />
          <ReadonlyField label="Teléfono" value={patient.phone} />
          <ReadonlyField label="Correo" value={patient.email} />
          <ReadonlyField label="Nacimiento" value={patient.birthDate} />
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(
          [
            { key: "encounters", label: "Atenciones clínicas" },
            { key: "profile", label: "Perfil de salud" },
            { key: "files", label: "Archivos y radiografías" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "encounters" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Buscar"
                placeholder="Exploración, profesional, sucursal…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-52">
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "Todos" },
                  { value: "IN_PROGRESS", label: "En curso" },
                  { value: "COMPLETED", label: "Completadas" },
                  { value: "VOIDED", label: "Anuladas" },
                ]}
              />
            </div>
          </div>

          {filteredEncounters.length === 0 ? (
            <EmptyState
              message="Sin atenciones registradas"
              description="Crea la primera atención clínica para este paciente."
              action={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Nueva atención
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredEncounters.map((encounter) => (
                <Card
                  key={encounter.id}
                  className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-foreground">
                          {formatInstant(encounter.startedAt)}
                        </span>
                        {statusBadge(encounter.status)}
                      </div>
                      <p className="text-xs text-muted">
                        {encounter.professionalName} · {encounter.branchName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailEncounter(encounter)}
                      >
                        Ver detalle
                      </Button>
                      {encounter.status === "IN_PROGRESS" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setCompleteEncounter(encounter);
                              setCompleteDate("");
                              setCompleteTime("");
                            }}
                          >
                            Completar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setVoidEncounter(encounter);
                              setVoidReason("");
                            }}
                          >
                            Anular
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {encounter.examinationSummary}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                    {encounter.appointmentId && (
                      <span className="rounded bg-surface-subtle px-2 py-1">
                        Cita enlazada
                      </span>
                    )}
                    {encounter.treatmentId && (
                      <span className="rounded bg-surface-subtle px-2 py-1">
                        Tratamiento enlazado
                      </span>
                    )}
                    <span className="rounded bg-surface-subtle px-2 py-1">
                      {encounter.procedures.length} procedimiento(s)
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">
                Perfil de salud
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHealthDraft(healthProfile);
                  setHealthEditOpen(true);
                }}
              >
                Editar perfil
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Antecedentes médicos", healthProfile.medicalHistory],
                  ["Alergias", healthProfile.allergies],
                  ["Medicación actual", healthProfile.currentMedications],
                  ["Antecedentes odontológicos", healthProfile.dentalHistory],
                  ["Condiciones relevantes", healthProfile.relevantConditions],
                  ["Observaciones", healthProfile.observations],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted">{label}</span>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {value || "Sin registrar"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Vacío significa “sin registrar”, no “sin antecedentes”.
            </p>
          </Card>
        </div>
      )}

      {activeTab === "files" && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              leftIcon={Icons.plus}
              onClick={() => setUploadOpen(true)}
            >
              Subir archivo
            </Button>
          </div>
          {files.length === 0 ? (
            <EmptyState
              message="Sin archivos"
              description="Sube radiografías o documentos clínicos."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {files.map((file) => (
                <Card key={file.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {file.name}
                    </span>
                    <Badge
                      variant={
                        file.category === "RADIOGRAPH" ? "primary" : "neutral"
                      }
                    >
                      {file.category === "RADIOGRAPH"
                        ? "Radiografía"
                        : "Adjunto"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted flex flex-col gap-1">
                    <span>{file.mimeType}</span>
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span>{formatInstant(file.createdAt)}</span>
                    {file.radiographType && (
                      <span>Tipo: {file.radiographType}</span>
                    )}
                    {file.toothNumber && <span>Pieza: {file.toothNumber}</span>}
                    {file.region && <span>Región: {file.region}</span>}
                    {file.side && <span>Lateralidad: {file.side}</span>}
                    {file.notes && <span>Notas: {file.notes}</span>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create encounter modal */}
      <ResponsiveModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        title="Nueva atención clínica"
        description="Registra una atención sin cita ni procedimientos si es necesario."
        icon={Icons.tooth}
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateEncounter}>
              Guardar atención
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <FormSectionHeader
            step={1}
            title="Contexto de la atención"
            description="Paciente, sucursal, profesional e inicio."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadonlyField label="Paciente" value={patient.fullName} />
            <Combobox
              label="Sucursal"
              options={branchOptions}
              value={branch}
              onChange={setBranch}
            />
            <Combobox
              label="Profesional"
              options={professionalOptions}
              value={professional}
              onChange={setProfessional}
            />
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                label="Fecha de inicio"
                value={startedAt}
                onChange={setStartedAt}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={startedTime}
                  onChange={(e) => setStartedTime(e.target.value)}
                  className="h-9 rounded-md border border-border bg-surface px-3 text-xs"
                />
              </div>
            </div>
            <Combobox
              label="Cita enlazada (opcional)"
              options={appointmentOptions}
              value={appointmentId}
              onChange={setAppointmentId}
              clearable
            />
            <Combobox
              label="Tratamiento enlazado (opcional)"
              options={treatmentOptions}
              value={treatmentId}
              onChange={setTreatmentId}
              clearable
            />
          </div>

          <FormSectionHeader
            step={2}
            title="Exploración y notas"
            description="examinationSummary es obligatorio para completar."
          />
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted">
                Exploración clínica
              </span>
              <textarea
                className="min-h-[96px] rounded-md border border-border bg-surface p-3 text-sm"
                value={examination}
                onChange={(e) => setExamination(e.target.value)}
                placeholder="Hallazgos de la exploración…"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted">
                Resumen de procedimientos (opcional, narrativo)
              </span>
              <textarea
                className="min-h-[64px] rounded-md border border-border bg-surface p-3 text-sm"
                value={procedureSummary}
                onChange={(e) => setProcedureSummary(e.target.value)}
                placeholder="Texto narrativo opcional…"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted">
                Observaciones clínicas
              </span>
              <textarea
                className="min-h-[64px] rounded-md border border-border bg-surface p-3 text-sm"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </label>
          </div>

          <FormSectionHeader
            step={3}
            title="Procedimientos realizados"
            description="Una fila por pieza. Multi-pieza se expande en el guardado real."
            badge={`${procedures.length}`}
            badgeVariant="primary"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Combobox
              label="Objetivo"
              options={[
                { value: "TOOTH", label: "Pieza" },
                { value: "REGION", label: "Región" },
                { value: "WHOLE_MOUTH", label: "Boca completa" },
                { value: "OTHER", label: "Otro" },
              ]}
              value={procTarget}
              onChange={(v) => setProcTarget(v as TargetType)}
            />
            {procTarget === "TOOTH" && (
              <Combobox
                label="Pieza FDI"
                options={toothOptions}
                value={procTooth}
                onChange={setProcTooth}
                searchPlaceholder="Buscar pieza…"
              />
            )}
            {(procTarget === "REGION" || procTarget === "OTHER") && (
              <Input
                label={
                  procTarget === "REGION" ? "Descripción de región" : "Objetivo"
                }
                value={procRegion}
                onChange={(e) => setProcRegion(e.target.value)}
              />
            )}
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">
                  Descripción del procedimiento
                </span>
                <textarea
                  className="min-h-[64px] rounded-md border border-border bg-surface p-3 text-sm"
                  value={procDescription}
                  onChange={(e) => setProcDescription(e.target.value)}
                  placeholder="Qué se realizó…"
                />
              </label>
            </div>
            <Combobox
              label="Vínculo a tratamiento (opcional)"
              options={treatmentProcedureOptions}
              value={procTreatmentProcedureId}
              onChange={setProcTreatmentProcedureId}
              clearable
              searchPlaceholder="Buscar procedimiento de plan…"
            />
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={handleAddProcedure}>
              Agregar procedimiento
            </Button>
          </div>

          {procedures.length > 0 && (
            <div className="flex flex-col gap-2">
              {procedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="neutral">
                        {targetTypeLabels[procedure.targetType]}
                      </Badge>
                      {procedure.toothNumber && (
                        <span className="text-xs font-mono text-muted">
                          Pieza {procedure.toothNumber}
                        </span>
                      )}
                      {procedure.targetDescription && (
                        <span className="text-xs text-muted">
                          {procedure.targetDescription}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {procedure.description}
                    </p>
                    {procedure.treatmentProcedureId && (
                      <p className="text-xs text-muted">
                        Vínculo: {procedure.treatmentProcedureId}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveProcedure(procedure.id)}
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveModal>

      {/* Detail modal */}
      <ResponsiveModal
        open={!!detailEncounter}
        onClose={() => setDetailEncounter(null)}
        title="Detalle de atención"
        description={
          detailEncounter
            ? `${detailEncounter.professionalName} · ${detailEncounter.branchName}`
            : undefined
        }
        icon={Icons.tooth}
        maxWidth="max-w-3xl"
        footer={
          <Button variant="ghost" onClick={() => setDetailEncounter(null)}>
            Cerrar
          </Button>
        }
      >
        {detailEncounter && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadonlyField
                label="Estado"
                value={statusBadge(detailEncounter.status)}
              />
              <ReadonlyField
                label="Inicio"
                value={formatInstant(detailEncounter.startedAt)}
              />
              <ReadonlyField
                label="Cierre"
                value={formatInstant(detailEncounter.endedAt)}
              />
              <ReadonlyField
                label="Profesional"
                value={detailEncounter.professionalName}
              />
              <ReadonlyField
                label="Sucursal"
                value={detailEncounter.branchName}
              />
              <ReadonlyField
                label="Completada por"
                value={detailEncounter.completedBy || "—"}
              />
            </div>

            <FormSectionHeader step={1} title="Exploración clínica" />
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {detailEncounter.examinationSummary || "Sin registro"}
            </p>

            {detailEncounter.procedureSummary && (
              <>
                <FormSectionHeader step={2} title="Resumen de procedimientos" />
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {detailEncounter.procedureSummary}
                </p>
              </>
            )}

            {detailEncounter.clinicalNotes && (
              <>
                <FormSectionHeader step={3} title="Observaciones clínicas" />
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {detailEncounter.clinicalNotes}
                </p>
              </>
            )}

            <FormSectionHeader
              step={4}
              title="Procedimientos registrados"
              badge={`${detailEncounter.procedures.length}`}
              badgeVariant="primary"
            />
            {detailEncounter.procedures.length === 0 ? (
              <p className="text-sm text-muted">Sin procedimientos registrados.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {detailEncounter.procedures.map((procedure) => (
                  <div
                    key={procedure.id}
                    className="rounded-md border border-border bg-surface p-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="neutral">
                        {targetTypeLabels[procedure.targetType]}
                      </Badge>
                      {procedure.toothNumber && (
                        <span className="text-xs font-mono text-muted">
                          Pieza {procedure.toothNumber}
                        </span>
                      )}
                      {procedure.targetDescription && (
                        <span className="text-xs text-muted">
                          {procedure.targetDescription}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {procedure.description}
                    </p>
                    {procedure.treatmentProcedureId && (
                      <p className="text-xs text-muted mt-1">
                        Vínculo: {procedure.treatmentProcedureId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {detailEncounter.appointmentId && (
                <Badge variant="neutral">Cita enlazada</Badge>
              )}
              {detailEncounter.treatmentId && (
                <Badge variant="neutral">Tratamiento enlazado</Badge>
              )}
              {detailEncounter.voidReason && (
                <Badge variant="danger">Motivo anulación: {detailEncounter.voidReason}</Badge>
              )}
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Complete modal */}
      <ResponsiveModal
        open={!!completeEncounter}
        onClose={() => setCompleteEncounter(null)}
        title="Completar atención"
        description="Indica la fecha y hora de cierre. Se permite cero procedimientos."
        icon={Icons.check}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompleteEncounter(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCompleteEncounter}>
              Completar
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <DatePicker
            label="Fecha de cierre"
            value={completeDate}
            onChange={setCompleteDate}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">
              Hora de cierre
            </label>
            <input
              type="time"
              value={completeTime}
              onChange={(e) => setCompleteTime(e.target.value)}
              className="h-9 rounded-md border border-border bg-surface px-3 text-xs"
            />
          </div>
        </div>
      </ResponsiveModal>

      {/* Void modal */}
      <ResponsiveModal
        open={!!voidEncounter}
        onClose={() => setVoidEncounter(null)}
        title="Anular atención"
        description="La atención conserva su evidencia y motivo de anulación."
        icon={Icons.alertTriangle}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setVoidEncounter(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleVoidEncounter}>
              Anular
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Motivo de anulación</span>
          <textarea
            className="min-h-[96px] rounded-md border border-border bg-surface p-3 text-sm"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Describe el motivo…"
          />
        </label>
      </ResponsiveModal>

      {/* Health edit modal */}
      <ResponsiveModal
        open={healthEditOpen}
        onClose={() => setHealthEditOpen(false)}
        title="Editar perfil de salud"
        description="Seis textos opcionales. Vacío significa sin registrar."
        icon={Icons.user}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setHealthEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveHealthProfile}>
              Guardar perfil
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["medicalHistory", "Antecedentes médicos"],
              ["allergies", "Alergias"],
              ["currentMedications", "Medicación actual"],
              ["dentalHistory", "Antecedentes odontológicos"],
              ["relevantConditions", "Condiciones relevantes"],
              ["observations", "Observaciones"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1 sm:col-span-1">
              <span className="text-xs font-medium text-muted">{label}</span>
              <textarea
                className="min-h-[80px] rounded-md border border-border bg-surface p-3 text-sm"
                value={healthDraft[key]}
                onChange={(e) =>
                  setHealthDraft((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  } as HealthProfile))
                }
              />
            </label>
          ))}
        </div>
      </ResponsiveModal>

      {/* Upload modal */}
      <ResponsiveModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Subir archivo clínico"
        description="Metadatos de radiografía o adjunto. Sin binarios reales en esta vista."
        icon={Icons.plus}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUploadFile}>
              Registrar metadatos
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre del archivo"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="radiografia-panoramica.jpg"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Combobox
              label="Categoría"
              options={[
                { value: "RADIOGRAPH", label: "Radiografía" },
                { value: "ATTACHMENT", label: "Adjunto" },
              ]}
              value={uploadCategory}
              onChange={(v) =>
                setUploadCategory(v as "RADIOGRAPH" | "ATTACHMENT")
              }
            />
            {uploadCategory === "RADIOGRAPH" && (
              <Combobox
                label="Tipo de radiografía"
                options={[
                  { value: "PANORAMIC", label: "Panorámica" },
                  { value: "PERIAPICAL", label: "Periapical" },
                  { value: "BITEWING", label: "Aleta de mordida" },
                  { value: "CBCT", label: "CBCT" },
                ]}
                value={uploadRadiographType}
                onChange={setUploadRadiographType}
              />
            )}
            <Input
              label="Pieza (opcional)"
              value={uploadTooth}
              onChange={(e) => setUploadTooth(e.target.value)}
              placeholder="16"
            />
            <Input
              label="Región (opcional)"
              value={uploadRegion}
              onChange={(e) => setUploadRegion(e.target.value)}
            />
            <Input
              label="Lateralidad (opcional)"
              value={uploadSide}
              onChange={(e) => setUploadSide(e.target.value)}
              placeholder="Derecha / Izquierda"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Notas</span>
            <textarea
              className="min-h-[64px] rounded-md border border-border bg-surface p-3 text-sm"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
            />
          </label>
        </div>
      </ResponsiveModal>
    </PageContainer>
  );
}