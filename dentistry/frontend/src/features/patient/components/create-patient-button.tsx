"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Icons } from "@/shared/components/ui";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { CreatePatientDialog } from "@/features/patient/components/create-patient-dialog";
import type { PatientDto } from "@/features/patient/types/patient";

export function CreatePatientButton({
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: {
  onCreated: (patient: PatientDto) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const session = useAuthenticatedSession();
  const searchParams = useSearchParams();
  const requested = searchParams.get("create") === "true";
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  function setOpen(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

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
      <Button
        variant="primary"
        leftIcon={Icons.plus}
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex"
      >
        Nuevo paciente
      </Button>
      {(isOpen || requested) && (
        <CreatePatientDialog onClose={close} onCreated={onCreated} />
      )}
    </>
  );
}
