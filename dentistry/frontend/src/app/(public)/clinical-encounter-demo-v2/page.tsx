import { notFound } from "next/navigation";
import type { Viewport } from "next";
import { ClinicalEncounterDemoV2 } from "@/features/clinical-encounter-preview/clinical-encounter-demo-v2";

// Habilita safe areas (env(safe-area-inset-*)) en mobile sin tocar el layout raíz.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Preview only: interactive refinement of the clinical encounter UI (v2).
// Uses in-memory mock data; no validation, network calls or persistence.
export default function ClinicalEncounterDemoV2Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ClinicalEncounterDemoV2 />;
}
