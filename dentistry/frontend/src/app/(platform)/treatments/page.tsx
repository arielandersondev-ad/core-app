"use client";

import { useRouter } from "next/navigation";
import Treatments from "@/modules/clinic/views/Treatments";

export default function TreatmentsPage() {
  const router = useRouter();

  const handleNavigate = (view: string) => {
    if (view === "agenda") {
      router.push("/agenda");
    } else if (view === "pacientes") {
      router.push("/patients");
    }
  };

  return <Treatments onNavigate={handleNavigate} />;
}
