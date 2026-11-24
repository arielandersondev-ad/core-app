import { PatientAccountPage } from "@/features/billing/components/patient-account-page";

export default async function PatientAccountRoute({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <PatientAccountPage patientId={patientId} />;
}
