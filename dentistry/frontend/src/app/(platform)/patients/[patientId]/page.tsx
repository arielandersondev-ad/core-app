import { PatientDetailPage } from "@/features/patient/components/patient-detail-page";
import { parsePatientTab } from "@/features/patient/utils/patient-tabs";

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { patientId } = await params;
  const { tab } = await searchParams;
  return <PatientDetailPage patientId={patientId} tab={parsePatientTab(tab)} />;
}
