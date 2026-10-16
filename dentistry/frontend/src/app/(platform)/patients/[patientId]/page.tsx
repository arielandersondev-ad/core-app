import { notFound } from "next/navigation";
import { getPatientById } from "@/modules/clinic/__mocks__/data";
import { PatientDetailRoute } from "@/features/clinical-history/components/patient-detail-route";

export default async function PatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  if (!getPatientById(patientId)) notFound();
  return <PatientDetailRoute patientId={patientId} />;
}
