"use client";

import { useState } from "react";
import type { HistorySection } from "../data/history";
import { HistoryDialog } from "./history-dialog";
import styles from "./history.module.css";

export function SectionEditor({ section, values, onSave, onClose }: { section: HistorySection; values: Record<string, string>; onSave: (values: Record<string, string>) => boolean; onClose: () => void }) {
  const [draft, setDraft] = useState(values);
  const [error, setError] = useState("");
  return <HistoryDialog title={`Editar · ${section.title}`} subtitle="Los campos vacíos se mantienen como sin registrar." onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (onSave(draft)) onClose(); else setError("No se pudo guardar. El almacenamiento del navegador está lleno o no está disponible."); }}>
      <div className={styles.dialogBody}>
        {section.groups.map((group) => <fieldset className={styles.fieldset} key={group.title}>
          <legend>{group.title}</legend>
          <div className={styles.formGrid}>{group.fields.map((field) => {
            const value = draft[field.key] || "";
            const update = (next: string) => setDraft({ ...draft, [field.key]: next });
            return <div key={field.key} className={field.type === "textarea" || field.type === "answer" ? styles.fullField : ""}>
              <label className={styles.label} htmlFor={`field-${field.key}`}>{field.label}{field.unit && <span> · {field.unit}</span>}</label>
              {field.type === "textarea" ? <textarea id={`field-${field.key}`} className={styles.input} rows={3} value={value} onChange={(event) => update(event.target.value)} /> : field.type === "answer" ? <div className={styles.answerRow}>
                <select id={`field-${field.key}`} className={styles.input} value={value.split(" | ")[0] || "Sin registrar"} onChange={(event) => update(`${event.target.value}${value.includes(" | ") ? ` | ${value.split(" | ").slice(1).join(" | ")}` : ""}`)}>
                  {["Sin registrar", "Sí", "No", "No aplica"].map((option) => <option key={option}>{option}</option>)}
                </select>
                <input aria-label={`Detalle · ${field.label}`} className={styles.input} placeholder="Detalle, tratamiento actual o aclaración" value={value.split(" | ").slice(1).join(" | ")} onChange={(event) => update(`${value.split(" | ")[0] || "Sin registrar"} | ${event.target.value}`)} />
              </div> : <input id={`field-${field.key}`} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "any" : undefined} className={styles.input} value={value} onChange={(event) => update(event.target.value)} />}
            </div>;
          })}</div>
        </fieldset>)}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <footer className={styles.dialogFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button><button className={styles.primaryButton} type="submit">Guardar sección</button></footer>
    </form>
  </HistoryDialog>;
}
