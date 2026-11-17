import { PatientDetailPage } from "@/features/patient/components/patient-detail-page";

export default async function PatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return <PatientDetailPage patientId={patientId} />;
}
