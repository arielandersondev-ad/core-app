import { ClinicalEncounterCreatePage } from "@/features/clinical-encounter/components/clinical-encounter-create-page";

export default async function NewClinicalEncounterPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ appointmentId?: string | string[] }>;
}) {
  const { patientId } = await params;
  const { appointmentId } = await searchParams;
  return (
    <ClinicalEncounterCreatePage
      patientId={patientId}
      requestedAppointmentId={typeof appointmentId === "string" ? appointmentId : undefined}
    />
  );
}
