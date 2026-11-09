import { PatientHealthProfilePage } from "@/features/clinical-encounter/components/patient-health-profile-page";

export default async function PatientHealthProfileRoute({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <PatientHealthProfilePage patientId={patientId} />;
}
