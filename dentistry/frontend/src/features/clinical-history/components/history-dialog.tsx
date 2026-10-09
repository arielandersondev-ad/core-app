"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./history.module.css";

export function HistoryDialog({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className={`${styles.dialog} ${wide ? styles.wideDialog : ""}`} aria-labelledby="clinical-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className={styles.dialogHeader}>
      <div><h2 id="clinical-dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Cerrar ventana">×</button>
    </header>
    {children}
  </dialog>;
}
