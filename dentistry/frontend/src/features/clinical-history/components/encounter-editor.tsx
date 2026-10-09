"use client";

import { useState } from "react";
import { isoToday, type Encounter, type Tooth } from "../data/history";
import { HistoryDialog } from "./history-dialog";
import styles from "./history.module.css";

export function EncounterEditor({ teeth, onSave, onClose }: { teeth: Tooth[]; onSave: (encounter: Encounter) => boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({ date: isoToday(), professional: "", reason: "", examination: "", diagnosis: "", plan: "" });
  const [error, setError] = useState("");
  const set = (key: keyof typeof draft, value: string) => setDraft({ ...draft, [key]: value });
  const required = step === 0 ? ["date", "professional", "reason"] : step === 1 ? ["examination"] : ["diagnosis", "plan"];
  const next = () => {
    if (required.some((key) => !draft[key as keyof typeof draft].trim())) { setError("Completa los campos obligatorios (*) de este paso."); return; }
    setError("");
    if (step < 2) setStep(step + 1);
    else if (onSave({ ...draft, professional: draft.professional.trim(), id: crypto.randomUUID(), teeth: structuredClone(teeth) })) onClose();
    else setError("No se pudo guardar la consulta en este navegador.");
  };
  return <HistoryDialog title="Nueva consulta" subtitle="Añade una evolución fechada al historial de este paciente." onClose={onClose}>
    <div className={styles.steps}>{["Consulta", "Evaluación", "Diagnóstico y plan"].map((label, index) => <div key={label} className={index === step ? styles.currentStep : ""}><span>{index < step ? "✓" : index + 1}</span>{label}</div>)}</div>
    <form onSubmit={(event) => { event.preventDefault(); next(); }}>
      <div className={styles.dialogBody}>
        {step === 0 && <div className={styles.formGrid}>
          <label className={styles.label}>Fecha de consulta *<input className={styles.input} type="date" required max={isoToday()} value={draft.date} onChange={(event) => set("date", event.target.value)} /></label>
          <label className={styles.label}>Profesional responsable *<input className={styles.input} required placeholder="Nombre del profesional" value={draft.professional} onChange={(event) => set("professional", event.target.value)} /></label>
          <label className={`${styles.label} ${styles.fullField}`}>Motivo de consulta y evolución actual *<textarea className={styles.input} required rows={5} value={draft.reason} onChange={(event) => set("reason", event.target.value)} placeholder="Motivo, inicio, síntomas y cambios desde la última visita" /></label>
        </div>}
        {step === 1 && <><label className={styles.label}>Evaluación física y estomatológica *<textarea className={styles.input} required rows={6} value={draft.examination} onChange={(event) => set("examination", event.target.value)} placeholder="Signos vitales, exploración, hallazgos y estudios revisados" /></label><div className={styles.notice}>Se conservará una copia del odontograma actual junto a esta consulta. Puedes editarlo desde el historial antes de iniciar el registro.</div></>}
        {step === 2 && <><label className={styles.label}>Diagnóstico de esta consulta *<textarea className={styles.input} required rows={3} value={draft.diagnosis} onChange={(event) => set("diagnosis", event.target.value)} /></label><label className={styles.label}>Plan, indicaciones y seguimiento *<textarea className={styles.input} required rows={4} value={draft.plan} onChange={(event) => set("plan", event.target.value)} /></label><p className={styles.help}>La consulta se añadirá a la evolución; los antecedentes y registros anteriores se conservan.</p></>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <footer className={styles.dialogFooter}><button type="button" className={styles.secondaryButton} onClick={step ? () => { setStep(step - 1); setError(""); } : onClose}>{step ? "← Anterior" : "Cancelar"}</button><button type="submit" className={styles.primaryButton}>{step === 2 ? "Guardar consulta" : "Continuar →"}</button></footer>
    </form>
  </HistoryDialog>;
}
