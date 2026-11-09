import { ClinicalEncounterCreatePage } from "@/features/clinical-encounter/components/clinical-encounter-create-page";

export default async function NewClinicalEncounterPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <ClinicalEncounterCreatePage patientId={patientId} />;
}
