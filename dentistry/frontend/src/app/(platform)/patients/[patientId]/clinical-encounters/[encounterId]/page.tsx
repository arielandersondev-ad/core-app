import { ClinicalEncounterDetailPage } from "@/features/clinical-encounter/components/clinical-encounter-detail-page";

export default async function ClinicalEncounterDetailRoute({
  params,
}: {
  params: Promise<{ patientId: string; encounterId: string }>;
}) {
  const { patientId, encounterId } = await params;
  return <ClinicalEncounterDetailPage patientId={patientId} encounterId={encounterId} />;
}
