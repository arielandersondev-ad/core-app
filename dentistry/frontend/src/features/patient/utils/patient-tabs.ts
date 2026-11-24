export type PatientTab = "summary" | "encounters" | "account" | "health" | "files";

/** Ruta de cada sección del paciente; "Archivos" es una vista de la ficha (`?tab=archivos`). */
export function patientTabHref(patientId: string, tab: PatientTab): string {
  const base = `/patients/${encodeURIComponent(patientId)}`;
  switch (tab) {
    case "summary":
      return base;
    case "files":
      return `${base}?tab=archivos`;
    case "encounters":
      return `${base}/clinical-encounters`;
    case "account":
      return `${base}/account`;
    case "health":
      return `${base}/health-profile`;
  }
}

/** Interpreta `?tab=` de la ficha: cualquier valor desconocido es el resumen. */
export function parsePatientTab(value: string | string[] | undefined): "summary" | "files" {
  return (Array.isArray(value) ? value[0] : value) === "archivos" ? "files" : "summary";
}
