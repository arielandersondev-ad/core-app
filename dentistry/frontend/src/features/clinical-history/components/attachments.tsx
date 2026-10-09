"use client";

import { useState } from "react";
import { displayDate, isoToday, type Attachment } from "../data/history";
import { HistoryDialog } from "./history-dialog";
import styles from "./history.module.css";

export function Attachments({ items, onSave }: { items: Attachment[]; onSave: (items: Attachment[]) => boolean }) {
  const [category, setCategory] = useState("Fotografía intraoral");
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  return <div>
    <div className={styles.attachmentToolbar}>
      <label className={styles.label}>Tipo de documento<select className={styles.input} value={category} onChange={(event) => setCategory(event.target.value)}>{["Fotografía intraoral", "Fotografía extraoral", "Radiografía", "Laboratorio", "Consentimiento"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className={styles.secondaryButton}>{reading ? "Cargando…" : "+ Adjuntar archivo"}<input className={styles.fileInput} type="file" disabled={reading} accept="image/png,image/jpeg,application/pdf" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!["image/png", "image/jpeg", "application/pdf"].includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Selecciona un JPG, PNG o PDF de hasta 2 MB."); return; }
        setReading(true); setError("");
        const reader = new FileReader();
        reader.onerror = () => { setReading(false); setError("No se pudo leer el archivo."); };
        reader.onload = () => { setReading(false); if (!onSave([...items, { id: crypto.randomUUID(), name: file.name, category, date: isoToday(), dataUrl: String(reader.result) }])) setError("No se pudo guardar: el almacenamiento del navegador está lleno o no está disponible."); };
        reader.readAsDataURL(file);
      }} /></label>
    </div>
    <p className={styles.help}>JPG, PNG o PDF · hasta 2 MB por archivo. En esta demo los adjuntos se guardan en el navegador.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!items.length ? <div className={styles.empty}>Sin documentos adjuntos<p>Añade fotografías intraorales, extraorales y exámenes complementarios.</p></div> : <div className={styles.attachments}>{items.map((item) => <div className={styles.attachment} key={item.id}><span className={styles.eyebrow}>{item.category}</span><strong>{item.name}</strong><small>{displayDate(item.date)}</small><div><button type="button" className={styles.textButton} onClick={() => setPreview(item)}>Ver documento ↗</button><button type="button" className={styles.textButton} onClick={() => { if (!onSave(items.filter((entry) => entry.id !== item.id))) setError("No se pudo eliminar el adjunto del almacenamiento."); }}>Eliminar</button></div></div>)}</div>}
    {preview && <HistoryDialog title={preview.name} subtitle={preview.category} onClose={() => setPreview(null)}>
      <div className={styles.dialogBody}>{preview.dataUrl.startsWith("data:image/") ?
        // Local data URLs are already in memory; no remote image optimization is needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.attachmentImage} src={preview.dataUrl} alt={preview.name} /> : <object data={preview.dataUrl} type="application/pdf" className={styles.pdfPreview}><p>Vista previa no disponible. <a download={preview.name} href={preview.dataUrl}>Descargar documento</a></p></object>}</div>
      <footer className={styles.dialogFooter}><a href={preview.dataUrl} download={preview.name} className={styles.secondaryButton}>Descargar</a><button type="button" className={styles.primaryButton} onClick={() => setPreview(null)}>Cerrar</button></footer>
    </HistoryDialog>}
  </div>;
}
