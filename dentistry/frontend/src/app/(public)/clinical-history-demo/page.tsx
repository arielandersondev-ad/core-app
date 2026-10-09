import { notFound } from "next/navigation";
import { ClinicalDemo } from "@/features/clinical-history/components/clinical-demo";
import { getPatientById } from "@/modules/clinic/__mocks__/data";

// Preview only: no authentication bypass for platform routes or patient APIs.
export default async function ClinicalHistoryDemo({ searchParams }: { searchParams: Promise<{ patientId?: string | string[] }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const patientId = typeof query.patientId === "string" ? query.patientId : undefined;
  if (patientId && !getPatientById(patientId)) notFound();
  return <ClinicalDemo key={patientId || "list"} patientId={patientId} />;
}
