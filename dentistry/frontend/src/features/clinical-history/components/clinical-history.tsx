"use client";

import { useState, useSyncExternalStore } from "react";
import type { Patient } from "@/modules/clinic/__mocks__/data";
import { Attachments } from "./attachments";
import { EncounterEditor } from "./encounter-editor";
import { OdontogramEditor, OdontogramPreview } from "./odontogram";
import { SectionEditor } from "./section-editor";
import { conditions, createMockHistory, displayDate, isClinicalHistory, sections, storageKey, type ClinicalHistory, type HistorySection } from "../data/history";
import styles from "./history.module.css";

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function readHistory(patient: Patient) {
  let history = createMockHistory(patient);
  let message = "";
  try {
    const saved = localStorage.getItem(storageKey(patient.id));
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isClinicalHistory(parsed, patient.id)) history = parsed;
      else message = "El borrador local no es compatible. Se cargó la muestra de este paciente.";
    }
  } catch { message = "No se pudo leer el borrador local. Se cargaron datos de ejemplo."; }
  return { history, message };
}

export function ClinicalHistoryView({ patient }: { patient: Patient }) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  return hydrated ? <LoadedHistory key={patient.id} patient={patient} /> : <p className={styles.help}>Cargando historial clínico…</p>;
}

function LoadedHistory({ patient }: { patient: Patient }) {
  const [initial] = useState(() => readHistory(patient));
  const [history, setHistory] = useState<ClinicalHistory>(initial.history);
  const [editing, setEditing] = useState<HistorySection | null>(null);
  const [odontogram, setOdontogram] = useState(false);
  const [consultation, setConsultation] = useState(false);
  const [message, setMessage] = useState(initial.message);
  const persist = (next: ClinicalHistory) => {
    const saved = { ...next, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(storageKey(patient.id), JSON.stringify(saved)); }
    catch { setMessage("No se pudieron guardar los cambios en este navegador."); return false; }
    setHistory(saved); setMessage("Cambios guardados en este navegador."); return true;
  };
  const values = history.values;
  const completed = sections.filter((section) => section.groups.some((group) => group.fields.some((field) => values[field.key]?.trim() && !values[field.key].startsWith("Sin registrar")))).length;
  const bmi = Number(values.Peso) > 0 && Number(values.Talla) > 0 ? (Number(values.Peso) / (Number(values.Talla) / 100) ** 2).toFixed(1) : "—";
  const latest = [...history.encounters].sort((a, b) => b.date.localeCompare(a.date));
  const allergies = values["Reacciones alérgicas"] || "Sin registrar";
  return <div className={styles.root}>
    <div className={styles.pageHeading}><div><span className={styles.eyebrow}>Expediente odontológico · HC-{patient.id.replace("pac-", "").padStart(4, "0")}</span><h2>Historial clínico</h2><p>Una vista completa de la salud y evolución de tu paciente.</p></div><button type="button" className={styles.primaryButton} onClick={() => setConsultation(true)}>+ Nueva consulta</button></div>
    <div className={styles.demoStrip}><span className={styles.badge}>DEMO</span><span>Datos ficticios · guardado local en este navegador</span><span className={styles.saved}>{history.updatedAt ? `Actualizado ${displayDate(history.updatedAt)}` : "Muestra inicial"}</span></div>
    <div className={styles.alert}><span aria-hidden="true">!</span><div><strong>Antecedentes alérgicos</strong><p>{allergies.replaceAll(" | ", " · ")}</p></div><button className={styles.textButton} onClick={() => setEditing(sections[1])}>Revisar antecedentes →</button></div>
    {message && <p role="status" className={styles.status}>{message}</p>}
    <div className={styles.mainGrid}>
      <div className={styles.sectionList}>
        <div className={styles.sectionListHeading}><h3>Registro clínico</h3><span>{completed} de {sections.length} secciones con datos</span></div>
        {sections.map((section, index) => {
          const populated = section.groups.flatMap((group) => group.fields).filter((field) => values[field.key]?.trim() && !values[field.key].startsWith("Sin registrar")).length;
          return <details className={styles.section} key={section.id}>
            <summary><span className={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</span><div><h3>{section.title}</h3><p>{section.description}</p></div><span className={`${styles.sectionStatus} ${populated ? styles.hasData : ""}`}>{populated ? "Con datos" : "Pendiente"}</span><span className={styles.chevron}>⌄</span></summary>
            <div className={styles.sectionContent}>
              <div className={styles.sectionActions}><span className={styles.help}>Consulta el registro o actualiza esta sección.</span><button type="button" className={styles.textButton} onClick={() => setEditing(section)}>Editar sección ↗</button></div>
              {section.id === "anamnesis" && <dl className={styles.identity}><div><dt>Paciente</dt><dd>{patient.name}</dd></div><div><dt>Nacimiento</dt><dd>{displayDate(patient.dob)}</dd></div><div><dt>Residencia</dt><dd>{patient.address}</dd></div><div><dt>Grupo sanguíneo</dt><dd>{patient.bloodType}</dd></div></dl>}
              {section.groups.map((group) => <div className={styles.readGroup} key={group.title}><h4>{group.title}</h4><dl className={styles.readGrid}>{group.fields.filter((field) => values[field.key]?.trim()).map((field) => <div className={field.type === "textarea" ? styles.fullField : ""} key={field.key}><dt>{field.label}</dt><dd>{field.type === "date" ? displayDate(values[field.key]) : values[field.key].replaceAll(" | ", " · ")}{field.unit && ` ${field.unit}`}</dd></div>)}</dl>{!group.fields.some((field) => values[field.key]?.trim()) && <p className={styles.help}>Sin registrar</p>}</div>)}
              {section.id === "physical" && <p className={styles.help}>IMC calculado con peso y talla: {bmi}{bmi !== "—" ? " kg/m²" : ""}</p>}
            </div>
          </details>;
        })}
        <details className={styles.section}><summary><span className={styles.sectionNumber}>08</span><div><h3>Documentos y fotografías</h3><p>Imágenes intraorales, extraorales, estudios y consentimientos</p></div><span className={styles.sectionStatus}>{history.attachments.length} archivos</span><span className={styles.chevron}>⌄</span></summary><div className={styles.sectionContent}><Attachments items={history.attachments} onSave={(attachments) => persist({ ...history, attachments })} /></div></details>
        <section className={styles.timeline}>
          <div className={styles.sectionListHeading}><h3>Evolución y consultas</h3><span>{latest.length} registros</span></div>
          {latest.length === 0 && <div className={styles.empty}>Aún no hay consultas registradas<p>Inicia la primera consulta desde el botón Nueva consulta.</p></div>}
          {latest.map((entry) => <details key={entry.id} className={styles.encounter}><summary><span className={styles.timelineDot} /><div><span className={styles.eyebrow}>{displayDate(entry.date)} · {entry.professional}</span><h4>{entry.reason}</h4></div><span className={styles.chevron}>⌄</span></summary><dl className={styles.encounterBody}>{[["Evaluación", entry.examination], ["Diagnóstico", entry.diagnosis], ["Plan y seguimiento", entry.plan]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>Odontograma conservado en esta consulta</dt><dd>{entry.teeth.filter((tooth) => tooth.findings.length).map((tooth) => <p key={tooth.number}>Pieza {tooth.number}: {tooth.findings.map((finding) => `${conditions.find((condition) => condition.id === finding.condition)?.label} · ${finding.surface} · ${finding.status}${finding.detail ? ` · ${finding.detail}` : ""}`).join("; ")}{tooth.notes && ` · ${tooth.notes}`}</p>)}{!entry.teeth.some((tooth) => tooth.findings.length) && "Sin hallazgos registrados."}</dd></div></dl></details>)}
        </section>
      </div>
      <aside className={styles.aside}>
        <section className={styles.asideCard}><div className={styles.cardHeading}><h3>Odontograma</h3><span className={styles.badge}>FDI</span></div><OdontogramPreview teeth={history.teeth} onOpen={() => setOdontogram(true)} /><p className={styles.help}>Permanente, temporal y mixta. Hallazgos por pieza y superficie.</p></section>
        <section className={styles.asideCard}><div className={styles.cardHeading}><h3>Última evaluación</h3><button type="button" className={styles.textButton} onClick={() => setEditing(sections[3])}>Editar</button></div><div className={styles.vitals}>{[["Presión arterial", values.PA, "mmHg"], ["Frec. cardíaca", values.FC, "lpm"], ["Temperatura", values.Temperatura, "°C"], ["IMC calculado", bmi === "—" ? "" : bmi, "kg/m²"]].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value || "—"}<small>{value ? unit : "Sin registrar"}</small></strong></div>)}</div></section>
        <section className={`${styles.asideCard} ${styles.planCard}`}><span className={styles.eyebrow}>Plan actual</span><h3>{values["Diagnóstico definitivo"] || values["Diagnóstico presuntivo"] || "Por registrar"}</h3><p>{values["Plan de tratamiento"] || "Completa el diagnóstico y define el plan de tratamiento."}</p><button type="button" className={styles.textButton} onClick={() => setEditing(sections[6])}>Ver y editar plan →</button></section>
        <div className={styles.help}>Abre cada sección para consultar los datos. Las consultas conservan la evolución del paciente.</div>
      </aside>
    </div>
    {editing && <SectionEditor section={editing} values={history.values} onClose={() => setEditing(null)} onSave={(values) => persist({ ...history, values })} />}
    {odontogram && <OdontogramEditor teeth={history.teeth} onClose={() => setOdontogram(false)} onSave={(teeth) => persist({ ...history, teeth })} />}
    {consultation && <EncounterEditor teeth={history.teeth} onClose={() => setConsultation(false)} onSave={(entry) => persist({ ...history, encounters: [...history.encounters, entry] })} />}
  </div>;
}
