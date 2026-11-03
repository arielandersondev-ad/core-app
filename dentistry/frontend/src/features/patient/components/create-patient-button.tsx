"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Icons } from "@/shared/components/ui";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { CreatePatientDialog } from "@/features/patient/components/create-patient-dialog";
import type { PatientDto } from "@/features/patient/types/patient";

export function CreatePatientButton({ onCreated }: { onCreated: (patient: PatientDto) => void }) {
  const [open, setOpen] = useState(false);
  const session = useAuthenticatedSession();
  const searchParams = useSearchParams();
  const requested = searchParams.get("create") === "true";

  function close() {
    setOpen(false);
    if (requested) {
      const url = new URL(window.location.href);
      url.searchParams.delete("create");
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }

  if (!session.permissions.includes("dentistry:patients:create")) return null;
  return (
    <>
      <Button variant="primary" leftIcon={Icons.plus} onClick={() => setOpen(true)}>Nuevo paciente</Button>
      {(open || requested) && <CreatePatientDialog onClose={close} onCreated={onCreated} />}
    </>
  );
}
