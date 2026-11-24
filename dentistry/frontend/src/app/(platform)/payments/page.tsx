import { redirect } from "next/navigation";

// El prototipo global se retiró: la cuenta y los abonos viven en el paciente.
export default function PaymentsPage() {
  redirect("/patients");
}
