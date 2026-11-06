import { notFound } from "next/navigation";
import { ClinicalEncounterDemo } from "@/features/clinical-encounter-preview/clinical-encounter-demo";

// Preview only: interactive refinement of the clinical encounter UI.
// Uses in-memory mock data; no validation or persistence.
export default function ClinicalEncounterDemoPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ClinicalEncounterDemo />;
}