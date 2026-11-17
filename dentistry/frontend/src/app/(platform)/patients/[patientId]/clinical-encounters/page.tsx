import { ClinicalEncounterListPage } from "@/features/clinical-encounter/components/clinical-encounter-list-page";

export default async function PatientClinicalEncountersPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <ClinicalEncounterListPage patientId={patientId} />;
}
