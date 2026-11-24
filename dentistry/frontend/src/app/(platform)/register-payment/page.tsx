import { redirect } from "next/navigation";
import { legacyBillingDestination } from "@/features/billing/utils/legacy-routes";

// Enlaces antiguos `?patientId=…` llevan a la cuenta de ese paciente.
export default async function RegisterPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string | string[] }>;
}) {
  const { patientId } = await searchParams;
  redirect(legacyBillingDestination(patientId));
}
