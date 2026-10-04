"use client";

import { useRouter } from "next/navigation";
import { SectionTabs } from "@/shared/components/layout/section-tabs";
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

  return (
    <>
      <SectionTabs section="tratamientos" />
      <Treatments onNavigate={handleNavigate} />
    </>
  );
}
