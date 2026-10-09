import type { Patient } from "@/modules/clinic/__mocks__/data";

export type Field = { key: string; label: string; type?: "text" | "textarea" | "date" | "number" | "answer"; unit?: string };
export type HistorySection = { id: string; title: string; description: string; groups: { title: string; fields: Field[] }[] };
const fields = (labels: string[]): Field[] => labels.map((label) => ({ key: label, label }));
const notes = (labels: string[]): Field[] => fields(labels).map((field) => ({ ...field, type: "textarea" }));
const answers = (labels: string[]): Field[] => fields(labels).map((field) => ({ ...field, type: "answer" }));

// The source defines the fields; it does not define clinical defaults or a surgical protocol.
export const sections: HistorySection[] = [
  { id: "anamnesis", title: "Anamnesis y filiación", description: "Datos personales, motivo de consulta e historia de la enfermedad", groups: [
    { title: "Filiación", fields: [...fields(["Género", "Estado civil", "Ocupación", "Procedencia", "Fuente de información"]), { key: "Fecha de historia", label: "Fecha de historia", type: "date" }] },
    { title: "Consulta", fields: notes(["Motivo de consulta", "Historia de la enfermedad actual", "Medicación referida / automedicación"]) },
  ] },
  { id: "antecedents", title: "Antecedentes médicos", description: "Personales, enfermedades, ginecológicos y familiares", groups: [
    { title: "Personales no patológicos", fields: fields(["Vivienda", "Servicios básicos", "Escolaridad", "Alimentación", "Religión", "Hábitos", "Inmunización", "Catarsis", "Diuresis"]) },
    { title: "Personales patológicos · respuesta y detalle", fields: answers(["Tratamiento médico", "Intervenciones quirúrgicas", "Anestésico local previo", "Reacciones alérgicas", "Transfusiones", "Antecedente de COVID-19", "Vacunación COVID-19", "Enfermedades cardíacas", "Enfermedades renales", "Enfermedades endocrinas", "Enfermedades gastrointestinales", "Enfermedades autoinmunes", "Enfermedades respiratorias", "Enfermedades infecciosas", "Enfermedades sanguíneas", "Enfermedades neurológicas", "Enfermedades oncológicas"]) },
    { title: "Ginecológicos · completar si corresponde", fields: [{ key: "FUM", label: "Fecha de última menstruación", type: "date" }, ...fields(["Gestación", "Lactancia", "Anticonceptivos", "Otros antecedentes ginecológicos"])] },
    { title: "Familiares", fields: notes(["Padre", "Madre", "Hermanos", "Cónyuge", "Hijos", "Otros antecedentes familiares"]) },
  ] },
  { id: "dental", title: "Antecedentes odontológicos", description: "Tratamientos previos, higiene y hábitos de salud bucal", groups: [
    { title: "Atención previa", fields: notes(["Último tratamiento dental y fecha", "Frecuencia de consulta", "Anestesia y cirugías bucales previas"]) },
    { title: "Higiene bucal", fields: [...fields(["Higiene bucal", "Técnica de cepillado", "Frecuencia de cepillado"]), ...answers(["Uso de hilo dental", "Uso de enjuague bucal"])] },
  ] },
  { id: "physical", title: "Examen físico", description: "Evaluación general, signos vitales y examen segmentario", groups: [
    { title: "Examen general", fields: fields(["Estado general", "Estado nutricional", "Biotipo", "Orientación", "Memoria", "Colaboración", "Piel"]) },
    { title: "Signos vitales y medidas", fields: [
      { key: "PA", label: "Presión arterial", unit: "mmHg" },
      ...[["FC", "Frecuencia cardíaca", "lpm"], ["Pulso", "Pulso", "lpm"], ["FR", "Frecuencia respiratoria", "rpm"], ["Temperatura", "Temperatura", "°C"], ["Peso", "Peso", "kg"], ["Talla", "Talla", "cm"]].map(([key, label, unit]): Field => ({ key, label, unit, type: "number" })),
      { key: "Vía de temperatura", label: "Vía de temperatura" },
    ] },
    { title: "Examen segmentario", fields: notes(["Cabeza / cráneo", "Cabello", "Cara · tercio superior", "Cara · tercio medio", "Cara · tercio inferior", "Cuello", "Ganglios", "Tiroides", "Tórax · inspección y palpación", "Percusión", "Auscultación respiratoria", "Auscultación cardíaca", "Extremidades superiores", "Extremidades inferiores"]) },
  ] },
  { id: "oral", title: "Examen estomatológico", description: "Tejidos orales, articulación temporomandibular y oclusión", groups: [
    { title: "Tejidos y estructuras", fields: notes(["Labios · piel, semimucosa y mucosa", "Frenillos", "Mucosa yugal", "Lengua", "Piso de boca", "Paladar", "Amígdalas y orofaringe", "Dientes, procesos alveolares y encías"]) },
    { title: "ATM y oclusión", fields: [...fields(["Apertura (mm)", "Protrusión (mm)", "Retrusión (mm)", "Lateralidad derecha (mm)", "Lateralidad izquierda (mm)", "Llave canina derecha", "Llave canina izquierda", "Llave molar derecha", "Llave molar izquierda", "Tipo de dentición"]), ...notes(["Observaciones de ATM y oclusión"])] },
  ] },
  { id: "diagnosis", title: "Diagnóstico y estudios", description: "Diagnóstico presuntivo, exámenes y diagnóstico definitivo", groups: [
    { title: "Diagnósticos", fields: notes(["Diagnóstico presuntivo", "Diagnóstico definitivo"]) },
    { title: "Exámenes complementarios", fields: notes(["Hemograma", "Coagulograma", "Química sanguínea", "Otros laboratorios", "Estudios imagenológicos"]) },
  ] },
  { id: "treatment", title: "Tratamiento y seguimiento", description: "Plan, procedimiento, postoperatorio y controles", groups: [
    { title: "Plan de tratamiento", fields: [...notes(["Plan de tratamiento", "Preparación del paciente"]), { key: "Consentimiento informado", label: "Consentimiento informado", type: "answer" }] },
    { title: "Procedimiento · cuando corresponda", fields: notes(["Material y equipo", "Anestesia utilizada", "Técnica / pasos realizados", "Incidencias del procedimiento"]) },
    { title: "Postoperatorio y controles", fields: [...notes(["Indicaciones al paciente", "Medicación prescrita", "Seguimiento", "Complicaciones / evolución"]), { key: "Próximo control", label: "Próximo control", type: "date" }] },
  ] },
];

export type ToothCondition = "sano" | "caries" | "restauracion" | "sellante" | "ausente" | "extraccion" | "erupcion" | "atricion" | "hipoplasia" | "corona" | "protesis" | "ortodoncia" | "fractura";
export const conditions: { id: ToothCondition; label: string; color: string }[] = [
  { id: "sano", label: "Sano", color: "var(--muted)" }, { id: "caries", label: "Caries", color: "var(--danger)" },
  { id: "restauracion", label: "Obturación", color: "#3569a8" }, { id: "sellante", label: "Sellante", color: "#3569a8" },
  { id: "ausente", label: "Ausente", color: "#3569a8" }, { id: "extraccion", label: "Indicado a extracción", color: "var(--danger)" },
  { id: "erupcion", label: "En erupción", color: "var(--warning)" }, { id: "atricion", label: "Atrición", color: "var(--secondary)" },
  { id: "hipoplasia", label: "Hipoplasia", color: "var(--secondary)" }, { id: "corona", label: "Corona", color: "#3569a8" },
  { id: "protesis", label: "Prótesis", color: "#3569a8" }, { id: "ortodoncia", label: "Ortodoncia", color: "#3569a8" },
  { id: "fractura", label: "Fractura", color: "var(--danger)" },
];
export const surfaces = ["Vestibular", "Lingual / palatina", "Mesial", "Distal", "Oclusal / incisal"] as const;
export type Finding = { id: string; condition: ToothCondition; surface: string; detail: string; status: "Buen estado" | "Mal estado" | "No aplica" };
export type Tooth = { number: number; findings: Finding[]; notes: string };
export type Encounter = { id: string; date: string; professional: string; reason: string; examination: string; diagnosis: string; plan: string; teeth: Tooth[] };
export type Attachment = { id: string; name: string; category: string; dataUrl: string; date: string };
export type ClinicalHistory = { version: 1; patientId: string; values: Record<string, string>; teeth: Tooth[]; encounters: Encounter[]; attachments: Attachment[]; updatedAt: string | null };

export const permanentRows = [[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]];
export const primaryRows = [[55, 54, 53, 52, 51, 61, 62, 63, 64, 65], [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]];
export const isoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export function displayDate(date: string) {
  return new Date(date.length === 10 ? `${date}T12:00:00` : date).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/La_Paz" });
}
export const storageKey = (id: string) => `dentistry:clinical-mock:v1:${id}`;

export function createMockHistory(patient: Patient): ClinicalHistory {
  const example = patient.id === "pac-1";
  const teeth = [...permanentRows.flat(), ...primaryRows.flat()].map((number): Tooth => ({ number, findings: [], notes: "" }));
  if (example) {
    teeth.find((tooth) => tooth.number === 14)!.findings = [{ id: "mock-14", condition: "caries", surface: "Oclusal / incisal", detail: "Hallazgo de ejemplo. Pendiente de evaluación.", status: "No aplica" }];
    teeth.find((tooth) => tooth.number === 24)!.findings = [{ id: "mock-24", condition: "sellante", surface: "Oclusal / incisal", detail: "Sellante de ejemplo.", status: "Buen estado" }];
    teeth.find((tooth) => tooth.number === 38)!.findings = [{ id: "mock-38", condition: "erupcion", surface: "Pieza completa", detail: "Pieza en erupción. Registro ficticio.", status: "No aplica" }];
  }
  return {
    version: 1, patientId: patient.id, updatedAt: null, teeth, attachments: [],
    values: {
      "Fecha de historia": patient.lastVisit, "Fuente de información": "Paciente", "Reacciones alérgicas": patient.allergies.length ? `Sí | ${patient.allergies.join(", ")}` : "Sin registrar",
      ...(example ? { "Ocupación": "Diseñadora", "Procedencia": "La Paz", "Motivo de consulta": "Sensibilidad en el sector posterior y revisión odontológica.", "Historia de la enfermedad actual": "Refiere sensibilidad intermitente al ingerir bebidas frías desde hace dos semanas. Solicita valoración. Datos ficticios para explorar el registro clínico.", "Higiene bucal": "Regular", "Técnica de cepillado": "Mixta", "Frecuencia de cepillado": "2 veces al día", "Uso de hilo dental": "No | No refiere uso habitual", "PA": "110/70", "FC": "65", "FR": "18", "Temperatura": "36.5", "Peso": "68", "Talla": "165", "Estado general": "Bueno", "Lengua": "Sin hallazgos registrados en esta evaluación de ejemplo.", "Tipo de dentición": "Permanente", "Diagnóstico presuntivo": "Sensibilidad dental por evaluar.", "Plan de tratamiento": "Completar evaluación odontológica y registrar hallazgos.", "Consentimiento informado": "Sin registrar" } : {}),
    },
    encounters: example ? [{ id: "mock-encounter", date: "2026-08-18", professional: "Dra. Andrea Salinas", reason: "Evaluación inicial y sensibilidad dental", examination: "Exploración general de ejemplo. Hallazgos pendientes de confirmar.", diagnosis: "Sensibilidad dental por evaluar.", plan: "Completar evaluación y seguimiento.", teeth: structuredClone(teeth) }] : [],
  };
}

// Browser storage is untrusted and may belong to an older prototype version.
export function isClinicalHistory(value: unknown, patientId: string): value is ClinicalHistory {
  if (!value || typeof value !== "object") return false;
  const item = value as ClinicalHistory;
  const isTooth = (tooth: Tooth) => tooth && typeof tooth.number === "number" && typeof tooth.notes === "string" && Array.isArray(tooth.findings) && tooth.findings.every((finding) => finding && typeof finding.id === "string" && conditions.some((condition) => condition.id === finding.condition) && typeof finding.surface === "string" && typeof finding.detail === "string" && ["Buen estado", "Mal estado", "No aplica"].includes(finding.status));
  return item.version === 1 && item.patientId === patientId && !!item.values && typeof item.values === "object" && !Array.isArray(item.values) && Object.values(item.values).every((entry) => typeof entry === "string") && Array.isArray(item.teeth) && item.teeth.length === 52 && new Set(item.teeth.map((tooth) => tooth.number)).size === 52 && item.teeth.every((tooth) => [...permanentRows.flat(), ...primaryRows.flat()].includes(tooth.number) && isTooth(tooth)) && Array.isArray(item.encounters) && item.encounters.every((entry) => entry && [entry.id, entry.date, entry.professional, entry.reason, entry.examination, entry.diagnosis, entry.plan].every((field) => typeof field === "string") && Array.isArray(entry.teeth) && entry.teeth.every(isTooth)) && Array.isArray(item.attachments) && item.attachments.every((entry) => entry && [entry.id, entry.name, entry.category, entry.date, entry.dataUrl].every((field) => typeof field === "string") && /^data:(image\/(png|jpeg)|application\/pdf);base64,/.test(entry.dataUrl)) && (item.updatedAt === null || typeof item.updatedAt === "string");
}
