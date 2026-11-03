import { redirect } from "next/navigation";
import PatientsPageView from "@/features/patient/views/patients-page";

type Props = {
  searchParams: Promise<{ patientId?: string | string[] }>;
};

export default async function PatientsPage({ searchParams }: Props) {
  const { patientId } = await searchParams;
  if (typeof patientId === "string" && patientId.length > 0) {
    redirect(`/patients/${encodeURIComponent(patientId)}`);
  }

  return <PatientsPageView />;
}
