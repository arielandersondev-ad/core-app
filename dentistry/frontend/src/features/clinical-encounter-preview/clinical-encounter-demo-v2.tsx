"use client";

import { useState } from "react";
import { Badge, Button, Icons } from "@/shared/components/ui";
import { NAV_ITEMS, PageContainer } from "@/shared/components/layout";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";
import type { EncounterProcedure, HealthProfile } from "./types";
import { useDemoStore, statusLabels } from "./v2/demo-store";
import { DemoTags, ToastStack } from "./v2/demo-ui";
import { CompleteEncounterModal, FileModal, HealthProfileModal, ProcedureModal, VoidEncounterModal } from "./v2/demo-modals";
import { EncounterListView } from "./v2/encounter-list-view";
import { EncounterDetailView } from "./v2/encounter-detail-view";
import { EncounterCreateView } from "./v2/encounter-create-view";
import { HealthProfileView } from "./v2/health-profile-view";
import styles from "./v2/demo.module.css";

type DemoView = "list" | "detail" | "create" | "health";

const headerTitles: Record<DemoView, string> = {
  list: "Atenciones clínicas",
  detail: "Detalle de la atención",
  create: "Nueva atención",
  health: "Perfil de salud",
};

/**
 * Réplica local del BottomNav del shell real (`shared/components/layout/BottomNav`)
 * para que el prototipo móvil imite la app: barra inferior reservada (no flotante),
 * con el ítem central de Agenda elevado. No navega a rutas reales: solo "Pacientes"
 * es interactivo y vuelve al historial; el resto replica la apariencia.
 */
function DemoBottomNav({ onSelect }: { onSelect: () => void }) {
  const visibleItems = NAV_ITEMS.filter((item) => item.showInBottomNav !== false);

  return (
    <nav
      aria-label="Navegación móvil (demo)"
      className="flex-shrink-0 border-t border-border bg-surface lg:hidden relative z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2 py-1 relative">
        {visibleItems.map(({ section, label, icon }) => {
          const active = section === "pacientes";
          const isAgenda = section === "agenda";

          if (isAgenda) {
            return (
              <div key={section} className="flex-1 flex flex-col items-center justify-center relative -top-3">
                <span
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg border-2 border-surface bg-primary text-primary-foreground"
                  aria-hidden="true"
                >
                  <span className="text-xl shrink-0 leading-none">{icon}</span>
                  <span className="text-[8px] font-mono uppercase font-bold tracking-tight leading-none mt-0.5">
                    {label}
                  </span>
                </span>
              </div>
            );
          }

          return (
            <button
              key={section}
              type="button"
              onClick={active ? onSelect : undefined}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
            >
              <span className={`transition-colors ${active ? "text-primary" : "text-muted"}`}>{icon}</span>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
                  active ? "text-primary font-semibold" : "text-muted"
                }`}
              >
                {label}
              </span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b" />}
            </button>
          );
        })}
      </div>
      <div className="flex justify-center pb-2 pt-0.5">
        <div className="w-28 h-1 bg-muted/30 rounded-full" />
      </div>
    </nav>
  );
}

export function ClinicalEncounterDemoV2() {
  const store = useDemoStore();
  const [view, setView] = useState<DemoView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [procedureOpen, setProcedureOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [healthEditOpen, setHealthEditOpen] = useState(false);

  const selected = store.getEncounter(selectedId);

  const goList = () => {
    setView("list");
    setSelectedId(null);
  };
  const openDetail = (id: string) => {
    setSelectedId(id);
    setView("detail");
  };

  const handleCreate = (draft: Parameters<typeof store.createEncounter>[0]) => {
    const id = store.createEncounter(draft);
    store.pushToast("Atención iniciada · borrador de interfaz", "success");
    setSelectedId(id);
    setView("detail");
  };

  const handleComplete = (input: { date: string; time: string; procedureSummary: string }) => {
    if (!selected) return;
    store.completeEncounter(selected.id, input);
    store.pushToast("Atención completada (demo)", "success");
    setCompleteOpen(false);
  };

  const handleVoid = (reason: string) => {
    if (!selected) return;
    store.voidEncounter(selected.id, reason);
    store.pushToast("Atención anulada (demo)", "warning");
    setVoidOpen(false);
  };

  const handleAddProcedure = (procedure: EncounterProcedure) => {
    if (!selected) return;
    store.addProcedure(selected.id, procedure);
    store.pushToast("Procedimiento registrado (demo)", "success");
    setProcedureOpen(false);
  };

  const handleSaveHealth = (profile: HealthProfile) => {
    store.saveHealthProfile(profile);
    store.pushToast("Perfil de salud guardado (demo)", "success");
    setHealthEditOpen(false);
  };

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">{Icons.tooth}</span>
          <span className="font-display text-sm font-bold">
            Dental<span className="text-primary">tery</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) =>
            item.section === "pacientes" ? (
              <button
                key={item.section}
                type="button"
                onClick={goList}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-display text-sm transition-colors ${
                  view === "list" || view === "detail" || view === "create"
                    ? "bg-primary-subtle text-primary"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ) : (
              <span key={item.section} className="flex items-center gap-3 px-3 py-3 text-sm text-muted">
                {item.icon}
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="border-t border-border p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-primary">Prototipo v2</p>
          <p className="text-[11px] leading-relaxed text-muted">
            Solo interfaz interactiva.
            <br />
            Sin validación ni datos reales.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground lg:hidden">{Icons.tooth}</span>
            <span className="truncate font-display text-sm font-semibold">
              {headerTitles[view]}
            </span>
            {selected && view === "detail" && (
              <Badge variant="neutral" className="hidden sm:inline-flex">
                {statusLabels[selected.status]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="hidden md:inline-flex gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full bg-current ${styles.liveDot}`} />
              Demo v2
            </Badge>
            <ThemeToggle variant="icon" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-surface-subtle">
            <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2.5 sm:px-6 lg:px-8">
              <span className="shrink-0 text-primary">{DemoTags.spark}</span>
              <p className="text-[11px] leading-relaxed text-muted">
                Prototipo de refinamiento visual · estado en memoria · sin validación, sin llamadas de red ni persistencia.
              </p>
            </div>
          </div>

          <PageContainer maxWidth="max-w-7xl" className="gap-4">
            <div key={`${view}-${selectedId ?? "none"}`} className={styles.viewIn}>
              {view === "list" && (
                <EncounterListView
                  patient={store.patient}
                  healthProfile={store.healthProfile}
                  encounters={store.encounters}
                  professionals={store.professionals}
                  onOpen={openDetail}
                  onCreate={() => setView("create")}
                  onOpenHealth={() => setView("health")}
                />
              )}

              {view === "detail" && selected && (
                <EncounterDetailView
                  encounter={selected}
                  patient={store.patient}
                  healthProfile={store.healthProfile}
                  files={store.files}
                  appointments={store.appointments}
                  treatments={store.treatments}
                  treatmentProcedures={store.treatmentProcedures}
                  onBack={goList}
                  onComplete={() => setCompleteOpen(true)}
                  onVoid={() => setVoidOpen(true)}
                  onAddProcedure={() => setProcedureOpen(true)}
                  onAddFile={() => setFileOpen(true)}
                  onRemoveFile={(id) => {
                    store.removeFile(id);
                    store.pushToast("Adjunto quitado (demo)", "info");
                  }}
                  onOpenHealth={() => setView("health")}
                />
              )}

              {view === "detail" && !selected && (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <p className="text-sm text-foreground">La atención seleccionada ya no está disponible.</p>
                  <Button className="mt-3" variant="outline" onClick={goList}>
                    Volver al historial
                  </Button>
                </div>
              )}

              {view === "create" && (
                <EncounterCreateView
                  patient={store.patient}
                  branches={store.branches}
                  professionals={store.professionals}
                  appointments={store.appointments}
                  treatments={store.treatments}
                  treatmentProcedures={store.treatmentProcedures}
                  onCancel={goList}
                  onSubmit={handleCreate}
                />
              )}

              {view === "health" && (
                <HealthProfileView
                  patient={store.patient}
                  profile={store.healthProfile}
                  onBack={goList}
                  onEdit={() => setHealthEditOpen(true)}
                />
              )}
            </div>
          </PageContainer>
        </main>

        <DemoBottomNav onSelect={goList} />
      </div>

      <ToastStack toasts={store.toasts} onDismiss={store.dismissToast} />

      {completeOpen && selected && (
        <CompleteEncounterModal open encounter={selected} onClose={() => setCompleteOpen(false)} onConfirm={handleComplete} />
      )}
      {voidOpen && selected && (
        <VoidEncounterModal open encounter={selected} onClose={() => setVoidOpen(false)} onConfirm={handleVoid} />
      )}
      {procedureOpen && selected && (
        <ProcedureModal
          open
          defaultTreatmentId={selected.treatmentId}
          treatmentProcedures={store.treatmentProcedures}
          onClose={() => setProcedureOpen(false)}
          onConfirm={handleAddProcedure}
        />
      )}
      {fileOpen && (
        <FileModal
          open
          onClose={() => setFileOpen(false)}
          onConfirm={(file) => {
            store.addFile(file);
            store.pushToast("Archivo adjuntado (demo)", "success");
            setFileOpen(false);
          }}
        />
      )}
      {healthEditOpen && (
        <HealthProfileModal open profile={store.healthProfile} onClose={() => setHealthEditOpen(false)} onConfirm={handleSaveHealth} />
      )}
    </div>
  );
}
