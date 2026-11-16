"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Icons, ResponsiveModal } from "@/shared/components/ui";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { CreatePatientDialog } from "@/features/patient/components/create-patient-dialog";
import { usePatientQuota } from "@/features/patient/hooks/use-patient-quota";
import type { PatientDto } from "@/features/patient/types/patient";
import { isPatientLimitReached, PATIENT_LIMIT_MESSAGE } from "@/features/patient/utils/patient-quota";

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
  const limitReached = isPatientLimitReached(usePatientQuota().data);
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
        disabled={limitReached}
        title={limitReached ? PATIENT_LIMIT_MESSAGE : undefined}
        className="hidden md:inline-flex"
      >
        Nuevo paciente
      </Button>
      {(isOpen || requested) &&
        (limitReached ? (
          // El menú móvil y `?create=true` también abren el alta: con el cupo lleno se explica por qué no.
          <ResponsiveModal open onClose={close} title="Límite de pacientes alcanzado" icon={Icons.users} breakpoint={768} snapPoint="auto" maxWidth="max-w-md">
            <p role="alert" className="text-sm text-foreground">{PATIENT_LIMIT_MESSAGE}</p>
          </ResponsiveModal>
        ) : (
          <CreatePatientDialog onClose={close} onCreated={onCreated} />
        ))}
    </>
  );
}
