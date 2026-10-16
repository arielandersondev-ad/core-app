"use client";

import { useState } from "react";
import { conditions, permanentRows, primaryRows, surfaces, type Tooth, type Finding, type ToothCondition } from "../data/history";
import { HistoryDialog } from "./history-dialog";
import styles from "./history.module.css";

export function ToothGraphic({ tooth }: { tooth: Tooth }) {
  const rightQuadrant = [1, 4, 5, 8].includes(Math.floor(tooth.number / 10));
  const absent = tooth.findings.some((finding) => finding.condition === "ausente" || finding.condition === "extraccion");
  const color = (surface: string) => conditions.find((condition) => condition.id === tooth.findings.find((finding) => finding.surface === surface || finding.surface === "Pieza completa")?.condition)?.color || "var(--surface-elevated)";
  return <svg viewBox="0 0 40 48" className={styles.toothGraphic} aria-hidden="true">
    <g stroke="var(--border)" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M3 4H37L28 15H12Z" fill={color("Vestibular")} /><path d="M3 4L12 15V33L3 44Z" fill={color(rightQuadrant ? "Distal" : "Mesial")} />
      <path d="M37 4L28 15V33L37 44Z" fill={color(rightQuadrant ? "Mesial" : "Distal")} /><path d="M3 44L12 33H28L37 44Z" fill={color("Lingual / palatina")} />
      <rect x="12" y="15" width="16" height="18" fill={color("Oclusal / incisal")} />
    </g>
    {absent && <path d="M4 5L36 43M36 5L4 43" stroke={tooth.findings.some((finding) => finding.condition === "extraccion") ? "var(--danger)" : "#3569a8"} strokeWidth="3" />}
  </svg>;
}

export function OdontogramPreview({ teeth, onOpen }: { teeth: Tooth[]; onOpen: () => void }) {
  const marked = teeth.filter((tooth) => tooth.findings.length > 0);
  return <div className={styles.odontogramPreview}>
    <div className={styles.miniChart}>{permanentRows.map((row, index) => <div className={styles.miniRow} key={index}>{row.map((number) => <ToothGraphic key={number} tooth={teeth.find((tooth) => tooth.number === number)!} />)}</div>)}</div>
    <div className={styles.previewFooter}><span>{marked.length} piezas con hallazgos</span><button type="button" className={styles.textButton} onClick={onOpen}>Abrir odontograma ↗</button></div>
  </div>;
}

export function OdontogramEditor({ teeth, onSave, onClose }: { teeth: Tooth[]; onSave: (teeth: Tooth[]) => boolean; onClose: () => void }) {
  const [draft, setDraft] = useState(() => structuredClone(teeth));
  const [dentition, setDentition] = useState("Permanente");
  const [selected, setSelected] = useState(38);
  const [condition, setCondition] = useState<ToothCondition>("caries");
  const [surface, setSurface] = useState("Oclusal / incisal");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<Finding["status"]>("No aplica");
  const [error, setError] = useState("");
  const tooth = draft.find((item) => item.number === selected)!;
  const updateTooth = (next: Tooth) => setDraft(draft.map((item) => item.number === selected ? next : item));
  const rows = dentition === "Temporal" ? primaryRows : dentition === "Mixta" ? [permanentRows[0], primaryRows[0], primaryRows[1], permanentRows[1]] : permanentRows;
  return <HistoryDialog title="Odontograma" subtitle="Registro por pieza y superficie · numeración FDI" onClose={onClose} wide>
    <div className={`${styles.dialogBody} ${styles.chartLayout}`}>
      <div>
        <div className={styles.chartToolbar}><label className={styles.label}>Dentición<select className={styles.input} value={dentition} onChange={(event) => { setDentition(event.target.value); setSelected(event.target.value === "Temporal" ? 55 : 38); }}>{["Permanente", "Temporal", "Mixta"].map((option) => <option key={option}>{option}</option>)}</select></label><span className={styles.eyebrow}>Selecciona una pieza para registrar</span></div>
        <div className={styles.chartScroll}>
          <div className={styles.chartOrientation}><span>Derecha del paciente</span><span>Izquierda del paciente</span></div>
          {rows.map((row, index) => <div key={index} className={styles.toothRow} style={{ gridTemplateColumns: `repeat(${row.length}, minmax(32px, 1fr))` }}>{row.map((number) => {
            const item = draft.find((entry) => entry.number === number)!;
            return <button type="button" key={number} className={`${styles.toothButton} ${number === selected ? styles.selectedTooth : ""}`} aria-label={`Pieza ${number}`} aria-pressed={number === selected} onClick={() => setSelected(number)}><span>{number}</span><ToothGraphic tooth={item} /><span className={styles.toothDot} style={{ background: item.findings.length ? conditions.find((entry) => entry.id === item.findings[0].condition)?.color : "transparent" }} /></button>;
          })}</div>)}
        </div>
        <div className={styles.legend}>{conditions.map((item) => <span key={item.id}><i style={{ background: item.color }} />{item.label}</span>)}</div>
        <p className={styles.help}>Los colores orientan la lectura; la condición, el estado y las notas quedan registrados por separado.</p>
      </div>
      <div className={styles.toothPanel}>
        <div className={styles.toothPanelHeader}><span className={styles.eyebrow}>Pieza seleccionada</span><h3>{String(selected)[0]}.{String(selected)[1]}</h3></div>
        <form onSubmit={(event) => { event.preventDefault(); updateTooth({ ...tooth, findings: [...tooth.findings, { id: crypto.randomUUID(), condition, surface, detail: detail.trim(), status }] }); setDetail(""); }}>
          <label className={styles.label} htmlFor="tooth-condition">Hallazgo</label><select id="tooth-condition" className={styles.input} value={condition} onChange={(event) => setCondition(event.target.value as ToothCondition)}>{conditions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          <label className={styles.label} htmlFor="tooth-surface">Superficie</label><select id="tooth-surface" className={styles.input} value={surface} onChange={(event) => setSurface(event.target.value)}>{["Pieza completa", ...surfaces].map((item) => <option key={item}>{item}</option>)}</select>
          <label className={styles.label} htmlFor="tooth-status">Estado de restauración / aparato</label><select id="tooth-status" className={styles.input} value={status} onChange={(event) => setStatus(event.target.value as Finding["status"])}>{["No aplica", "Buen estado", "Mal estado"].map((item) => <option key={item}>{item}</option>)}</select>
          <label className={styles.label} htmlFor="tooth-detail">Detalle del hallazgo</label><textarea id="tooth-detail" className={styles.input} rows={2} placeholder="ICDAS, síntomas, tejidos periapicales…" value={detail} onChange={(event) => setDetail(event.target.value)} />
          <button type="submit" className={styles.secondaryButton}>+ Añadir hallazgo</button>
        </form>
        <div className={styles.findings}>{tooth.findings.length === 0 && <p className={styles.help}>Sin hallazgos registrados. Esto no equivale a una pieza sana.</p>}{tooth.findings.map((finding) => <div key={finding.id} className={styles.finding}><div><strong>{conditions.find((entry) => entry.id === finding.condition)?.label}</strong><small>{finding.surface} · {finding.status}</small>{finding.detail && <p>{finding.detail}</p>}</div><button type="button" aria-label={`Eliminar hallazgo ${finding.condition}`} className={styles.iconButton} onClick={() => updateTooth({ ...tooth, findings: tooth.findings.filter((entry) => entry.id !== finding.id) })}>×</button></div>)}</div>
        <label className={styles.label} htmlFor="tooth-notes">Observaciones de la pieza</label><textarea id="tooth-notes" rows={2} className={styles.input} value={tooth.notes} onChange={(event) => updateTooth({ ...tooth, notes: event.target.value })} />
      </div>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <footer className={styles.dialogFooter}><span className={styles.help}>{draft.filter((item) => item.findings.length).length} piezas registradas</span><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button><button type="button" className={styles.primaryButton} onClick={() => { if (onSave(draft)) onClose(); else setError("No se pudo guardar el odontograma en este navegador."); }}>Guardar odontograma</button></footer>
  </HistoryDialog>;
}
