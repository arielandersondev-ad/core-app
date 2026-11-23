"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { QuickProcedureModal } from "@/features/clinical-encounter/components/modals/quick-procedure-modal";
import { encounterHref } from "@/features/clinical-encounter/utils/appointment-encounter";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

/** Cita de la agenda desde la que se registra una atención rápida. */
export interface AppointmentProcedureTarget {
  patientId: string;
  appointmentId: string;
  branchId: string;
  /** Resumen visible en el modal, p. ej. "Ana Pérez · 09:00 – 09:30". */
  label: string;
  patientName?: string;
}

/**
 * Al cerrarse, BottomSheet deshace su entrada del historial con un
 * `history.back()` asíncrono (~150 ms). Si otra hoja se abre en el mismo ciclo,
 * ese "atrás" la cierra al instante en móvil; se espera a que termine.
 */
const SHEET_HISTORY_SETTLE_MS = 200;

type RegisteredEncounter = { patientId: string; encounterId: string; patientName?: string };

/**
 * "Registrar procedimiento" desde la agenda: abre la atención rápida con la cita
 * y, al guardar, muestra un aviso con el enlace a la atención.
 */
export function useAppointmentProcedureFlow(onRegistered?: () => void): {
  open: (target: AppointmentProcedureTarget, options?: { afterSheetClose?: boolean }) => void;
  banner: ReactNode;
  modal: ReactNode;
} {
  const session = useAuthenticatedSession();
  const [target, setTarget] = useState<AppointmentProcedureTarget | null>(null);
  const [registered, setRegistered] = useState<RegisteredEncounter | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function open(next: AppointmentProcedureTarget, options: { afterSheetClose?: boolean } = {}) {
    if (timer.current) clearTimeout(timer.current);
    if (options.afterSheetClose) {
      timer.current = setTimeout(() => setTarget(next), SHEET_HISTORY_SETTLE_MS);
    } else {
      setTarget(next);
    }
  }

  const banner = registered && (
    <div role="status" className="flex flex-col gap-2 rounded-xl bg-success-subtle px-4 py-3 text-sm text-success sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0">
        Procedimiento registrado{registered.patientName ? ` para ${registered.patientName}` : ""}. La cita quedó completada.
      </p>
      <div className="flex shrink-0 items-center gap-4">
        {session.permissions.includes("dentistry:encounters:read") && (
          <Link href={encounterHref(registered.patientId, registered.encounterId)} className="font-medium underline">
            Ver atención
          </Link>
        )}
        <button type="button" onClick={() => setRegistered(null)} className="min-h-10 text-xs font-medium opacity-80 hover:opacity-100">
          Cerrar
        </button>
      </div>
    </div>
  );

  const modal = target && (
    <QuickProcedureModal
      patientId={target.patientId}
      appointment={{ id: target.appointmentId, branchId: target.branchId, label: target.label }}
      onClose={() => setTarget(null)}
      onRegistered={(encounter) => {
        setRegistered({ patientId: target.patientId, encounterId: encounter.id, patientName: target.patientName });
        setTarget(null);
        onRegistered?.();
      }}
    />
  );

  return { open, banner, modal };
}
