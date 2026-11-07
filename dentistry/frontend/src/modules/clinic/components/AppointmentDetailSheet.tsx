"use client";

import { useState, useEffect, useRef } from "react";
import { BottomSheet } from "@/shared/components/ui";
import { Icons } from "@/shared/components/ui/Icons";
import { formatCurrency } from "@app/ui";
import {
  fetchAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  AppointmentDto,
} from "@/modules/clinic/api/appointments";
import { useAppointmentDetail } from "@/modules/clinic/hooks";
import { fetchPatientById } from "@/features/patient/services/patient.service";
import { fetchDentalServices, DentalServiceDto } from "@/modules/clinic/api/services";
import { normalizePhoneNumber } from "@/shared/utils/whatsapp-generator";

interface AppointmentDetailSheetProps {
  open: boolean;
  citaId: string | null;
  initialAppointment?: any | null;
  onClose: () => void;
  onStatusUpdated?: (citaId: string, newStatus: string) => void;
  onOpenPayment?: (citaId: string, patientId?: string, amount?: number) => void;
  onOpenWhatsApp?: (patientName: string, patientPhone: string, serviceName: string, dateStr: string, timeStr: string) => void;
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  WAITING_ROOM: "En sala de espera",
  IN_PROGRESS: "En curso (Sillón)",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
  CANCELED: "Cancelada",
};

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/20",
  CONFIRMED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  WAITING_ROOM: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  COMPLETED: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
  NO_SHOW: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  CANCELED: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
};

export function AppointmentDetailSheet({
  open,
  citaId,
  initialAppointment,
  onClose,
  onStatusUpdated,
  onOpenPayment,
  onOpenWhatsApp,
}: AppointmentDetailSheetProps) {
  const [appointment, setAppointment] = useState<AppointmentDto | null>(
    initialAppointment || null,
  );
  const [patientDetails, setPatientDetails] = useState<{
    name: string;
    phone: string | null;
    email: string | null;
    documentNumber: string | null;
    notes: string | null;
  } | null>(() => {
    if (initialAppointment) {
      const initName =
        initialAppointment.patientName ||
        initialAppointment.personName ||
        null;
      const initPhone =
        initialAppointment.patientPhone ||
        initialAppointment.personPhone ||
        null;
      if (initName) {
        return {
          name: initName,
          phone: initPhone,
          email: null,
          documentNumber: null,
          notes: null,
        };
      }
    }
    return null;
  });
  const [servicesList, setServicesList] = useState<DentalServiceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // TanStack Query hook
  const { refetch: refetchAppointment } =
    useAppointmentDetail(open && citaId ? citaId : "");

  // Kebab menu state (3 vertical dots)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close kebab menu on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  // Load real data when sheet opens
  useEffect(() => {
    if (!open || !citaId) {
      setAppointment(null);
      setPatientDetails(null);
      setIsMenuOpen(false);
      setShowCancelPrompt(false);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsLoading(!initialAppointment);
    setErrorMessage(null);

    // Si viene initialAppointment, establecer datos de inmediato
    if (initialAppointment) {
      setAppointment(initialAppointment);
      const initName =
        initialAppointment.patientName || initialAppointment.personName;
      const initPhone =
        initialAppointment.patientPhone || initialAppointment.personPhone;
      if (initName) {
        setPatientDetails({
          name: initName,
          phone: initPhone || null,
          email: null,
          documentNumber: null,
          notes: null,
        });
      }
    }

    // 1. Fetch real appointment from API
    fetchAppointmentById(citaId)
      .then(async (apt) => {
        if (!isMounted) return;
        setAppointment(apt);

        const realName =
          apt.patientName || apt.personName || undefined;
        const realPhone =
          apt.patientPhone || apt.personPhone || null;

        if (realName) {
          setPatientDetails((prev) => ({
            name: realName,
            phone: realPhone,
            email: prev?.email || null,
            documentNumber: prev?.documentNumber || null,
            notes: prev?.notes || null,
          }));
        }

        // 2. Fetch real patient from API if patientId is present
        if (apt.patientId) {
          try {
            const pat = await fetchPatientById(apt.patientId);
            if (isMounted) {
              setPatientDetails({
                name: pat.fullName || realName || `Paciente`,
                phone: pat.phone || realPhone,
                email: pat.email,
                documentNumber: pat.documentNumber,
                notes: pat.notes,
              });
            }
          } catch {
            if (isMounted && !realName) {
              setPatientDetails({
                name: `Paciente #${apt.patientId.slice(0, 8)}`,
                phone: realPhone,
                email: null,
                documentNumber: null,
                notes: null,
              });
            }
          }
        }

        // 3. Fetch real dental services catalog
        try {
          const svcs = await fetchDentalServices({
            organizationId: apt.organizationId,
          });
          if (isMounted) {
            setServicesList(svcs);
          }
        } catch {
          // If services list query fails, keep fallback
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : "Error al cargar la cita.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, citaId, initialAppointment]);

  if (!open) return null;

  // Formatting helpers
  const startDate = appointment ? new Date(appointment.scheduledStartAt) : null;
  const endDate = appointment ? new Date(appointment.scheduledEndAt) : null;

  const dateFormatted = startDate && !Number.isNaN(startDate.getTime())
    ? startDate.toLocaleDateString("es-BO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Fecha no disponible";

  const startTimeStr = startDate && !Number.isNaN(startDate.getTime())
    ? startDate.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const endTimeStr = endDate && !Number.isNaN(endDate.getTime())
    ? endDate.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const durationMinutes = startDate && endDate
    ? Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 60000), 15)
    : 30;

  // Resolve matching services from real API catalog
  const currentServiceIds = appointment?.serviceIds && appointment.serviceIds.length > 0
    ? appointment.serviceIds
    : appointment?.serviceId
      ? [appointment.serviceId]
      : [];

  const matchedServices = currentServiceIds.map((id) => {
    const found = servicesList.find((s) => s.id === id);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        price: found.basePriceMinor / 100,
        currency: found.currency || "BOB",
        duration: found.durationMinutes,
      };
    }
    const aptSvc = appointment?.services?.find((s) => s.serviceId === id);
    if (aptSvc?.serviceName) {
      return {
        id,
        name: aptSvc.serviceName,
        price: (aptSvc.priceMinor ?? 0) / 100,
        currency: aptSvc.currency || "BOB",
        duration: aptSvc.durationMinutes || 30,
      };
    }
    return {
      id,
      name: appointment?.serviceName || "Consulta / Evaluación general",
      price: 0,
      currency: "BOB",
      duration: 30,
    };
  });

  const effectiveServices =
    matchedServices.length > 0
      ? matchedServices
      : [
          {
            id: "general",
            name: appointment?.serviceName || "Consulta / Evaluación general",
            price: 0,
            currency: "BOB",
            duration: durationMinutes || 30,
          },
        ];

  const totalPrice = effectiveServices.reduce((sum, s) => sum + s.price, 0);

  // Kebab menu actions (modificaciones de estado)
  const handleMutateStatus = async (targetStatus: string) => {
    if (!citaId || !appointment) return;
    setIsUpdatingStatus(true);
    setIsMenuOpen(false);

    try {
      if (targetStatus === "CANCELED") {
        await cancelAppointment(citaId, {
          reason: cancelReasonInput.trim() || "Cancelación solicitada por el usuario",
        });
      } else {
        await updateAppointmentStatus(citaId, {
          status: targetStatus as any,
          notes: appointment.notes ?? undefined,
        });
      }
      setAppointment((prev) => (prev ? { ...prev, status: targetStatus as any } : null));
      onStatusUpdated?.(citaId, targetStatus);
      setShowCancelPrompt(false);
      setCancelReasonInput("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar el estado de la cita.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTriggerPayment = () => {
    setIsMenuOpen(false);
    if (!citaId || !appointment) return;
    onOpenPayment?.(citaId, appointment.patientId, totalPrice);
  };

  const handleTriggerWhatsApp = () => {
    setIsMenuOpen(false);
    if (!appointment) return;
    const patName = patientDetails?.name || "Paciente";
    const patPhone = patientDetails?.phone || "";
    const svcName = matchedServices[0]?.name || "Consulta odontológica";
    onOpenWhatsApp?.(patName, patPhone, svcName, dateFormatted, startTimeStr);
  };

  const currentStatus = appointment?.status ?? "SCHEDULED";

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Detalle de Cita"
      subtitle={`${dateFormatted} · ${startTimeStr} – ${endTimeStr}`}
      snapPoint="auto"
      maxWidth="max-w-xl"
      headerAction={
        <div className="relative flex items-center gap-2" ref={menuRef}>
          {/* Badge de estado actual */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
              statusStyles[currentStatus] ?? "bg-stone-500/10 text-stone-700 border-stone-500/20"
            }`}
          >
            {statusLabels[currentStatus] ?? currentStatus}
          </span>

          {/* Menú de 3 puntos verticales (Kebab Menu) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            disabled={isUpdatingStatus || isLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] active:scale-95 transition-all cursor-pointer"
            title="Opciones y cambios de estado"
            aria-label="Opciones y cambios de estado"
          >
            <span className="text-base font-bold leading-none select-none">⋮</span>
          </button>

          {/* Dropdown Kebab Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-xl py-1.5 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
                Acciones de Cita
              </div>

              {/* Opciones de Estado */}
              {currentStatus !== "CONFIRMED" && currentStatus !== "COMPLETED" && currentStatus !== "CANCELED" && (
                <button
                  type="button"
                  onClick={() => handleMutateStatus("CONFIRMED")}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-[var(--foreground)] transition-colors"
                >
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Confirmar turno</span>
                </button>
              )}

              {currentStatus !== "WAITING_ROOM" && currentStatus !== "COMPLETED" && currentStatus !== "CANCELED" && (
                <button
                  type="button"
                  onClick={() => handleMutateStatus("WAITING_ROOM")}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-[var(--foreground)] transition-colors"
                >
                  <span className="text-purple-600 font-bold">🛋</span>
                  <span>Marcar en sala de espera</span>
                </button>
              )}

              {currentStatus !== "IN_PROGRESS" && currentStatus !== "COMPLETED" && currentStatus !== "CANCELED" && (
                <button
                  type="button"
                  onClick={() => handleMutateStatus("IN_PROGRESS")}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-[var(--foreground)] transition-colors"
                >
                  <span className="text-amber-600 font-bold">🦷</span>
                  <span>Iniciar atención (Pasar a sillón)</span>
                </button>
              )}

              {currentStatus !== "COMPLETED" && currentStatus !== "CANCELED" && (
                <button
                  type="button"
                  onClick={() => handleMutateStatus("COMPLETED")}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-[var(--foreground)] transition-colors"
                >
                  <span className="text-zinc-600 font-bold">🏁</span>
                  <span>Completar atención</span>
                </button>
              )}

              {currentStatus !== "NO_SHOW" && currentStatus !== "COMPLETED" && currentStatus !== "CANCELED" && (
                <button
                  type="button"
                  onClick={() => handleMutateStatus("NO_SHOW")}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-[var(--foreground)] transition-colors"
                >
                  <span className="text-orange-600 font-bold">✕</span>
                  <span>Marcar como no asistió</span>
                </button>
              )}

              <div className="border-t border-[var(--border)] my-1" />

              {/* Acciones de Cobro y Contacto */}
              <button
                type="button"
                onClick={handleTriggerPayment}
                className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-[var(--primary)] font-semibold transition-colors"
              >
                <span>💳</span>
                <span>Registrar cobro / pago</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerWhatsApp}
                className="w-full text-left px-3 py-2 hover:bg-[var(--surface-subtle)] flex items-center gap-2 text-emerald-600 font-semibold transition-colors"
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  {Icons.whatsappReal}
                </span>
                <span>Enviar mensaje de WhatsApp</span>
              </button>

              {currentStatus !== "CANCELED" && currentStatus !== "COMPLETED" && (
                <>
                  <div className="border-t border-[var(--border)] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowCancelPrompt(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 font-medium transition-colors"
                  >
                    🚫 Cancelar cita...
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      }
    >
      {/* CUERPO DEL BOTTOMSHEET: 100% DATOS DE LECTURA */}
      <div className="flex flex-col gap-4 text-xs">
        {isLoading ? (
          <div className="flex flex-col gap-3.5 py-2 animate-pulse">
            <div className="p-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface-subtle)] space-y-2">
              <div className="h-4 bg-[var(--border)]/50 rounded w-1/3" />
              <div className="h-3 bg-[var(--border)]/30 rounded w-1/2" />
            </div>
            <div className="p-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface-subtle)] space-y-2">
              <div className="h-4 bg-[var(--border)]/50 rounded w-2/5" />
              <div className="h-3 bg-[var(--border)]/30 rounded w-3/4" />
            </div>
            <div className="p-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface-subtle)] space-y-2">
              <div className="h-4 bg-[var(--border)]/50 rounded w-1/4" />
              <div className="h-3 bg-[var(--border)]/30 rounded w-full" />
            </div>
          </div>
        ) : errorMessage ? (
          <div
            role="alert"
            className="p-5 rounded-xl border border-rose-500/25 bg-rose-500/5 text-center flex flex-col items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center text-sm font-bold">
              ⚠️
            </div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMessage}
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              No fue posible obtener los datos actualizados de la cita.
            </p>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                refetchAppointment();
              }}
              className="mt-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold hover:bg-[var(--surface-subtle)] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Modal de confirmación de cancelación en caso de activarse desde los 3 puntos */}
            {showCancelPrompt && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 flex flex-col gap-2.5">
                <p className="font-semibold text-rose-700 dark:text-rose-300">
                  Motivo de cancelación de la cita:
                </p>
                <input
                  type="text"
                  placeholder="Ej. Paciente reprogramó por emergencia..."
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-2.5 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMutateStatus("CANCELED")}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 active:scale-95 transition-all"
                  >
                    Confirmar Cancelación
                  </button>
                </div>
              </div>
            )}

            {/* SECCIÓN 1: Paciente / Persona (Read-only) */}
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                Paciente / Titular de la Cita
              </span>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[var(--foreground)] truncate">
                    {patientDetails?.name || "Paciente no especificado"}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] font-mono mt-0.5">
                    {patientDetails?.phone && (
                      <span>📞 {patientDetails.phone}</span>
                    )}
                    {patientDetails?.email && (
                      <span>✉ {patientDetails.email}</span>
                    )}
                    {patientDetails?.documentNumber && (
                      <span>Doc: {patientDetails.documentNumber}</span>
                    )}
                  </div>
                </div>

                {patientDetails?.phone && (
                  <a
                    href={`tel:+${normalizePhoneNumber(patientDetails.phone, "591")}`}
                    className="shrink-0 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/40 text-[var(--muted)] hover:text-[var(--foreground)] text-xs font-mono flex items-center gap-1 transition-all"
                  >
                    <span className="w-3.5 h-3.5 flex items-center justify-center">
                      {Icons.phoneCall}
                    </span>
                    <span>Llamar</span>
                  </a>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Programación & Horario (Read-only) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold block mb-1">
                  Horario Asignado
                </span>
                <p className="font-mono text-sm font-bold text-[var(--foreground)]">
                  {startTimeStr} – {endTimeStr}
                </p>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  Duración estimada: {durationMinutes} min
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold block mb-1">
                  Fecha Civil
                </span>
                <p className="font-display text-xs font-semibold text-[var(--foreground)] capitalize truncate">
                  {dateFormatted}
                </p>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  Turno presencial
                </span>
              </div>
            </div>

            {/* SECCIÓN 3: Procedimientos Odontológicos & Costo (Read-only) */}
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                  Procedimientos Planificados
                </span>
                <span className="font-mono font-bold text-xs text-[var(--primary)]">
                  Total: {formatCurrency(totalPrice, { currency: "BOB" })}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                {effectiveServices.map((svc, idx) => (
                  <div
                    key={`${svc.id}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]/70 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-[var(--foreground)] truncate">
                        {svc.name}
                      </p>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {svc.duration} min
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-[var(--foreground)] shrink-0">
                      {formatCurrency(svc.price, { currency: svc.currency || "BOB" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 4: Odontólogo Tratante & Ubicación (Read-only) */}
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold block mb-0.5">
                  Profesional Tratante
                </span>
                <p className="font-display text-xs font-bold text-[var(--foreground)]">
                  Dr. Odontólogo Responsable
                </p>
                <span className="text-[10px] text-[var(--muted)]">
                  Sillón Odontológico #1 · Sucursal Principal
                </span>
              </div>
            </div>

            {/* SECCIÓN 5: Notas Clínicas & Motivo (Read-only) */}
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                Motivo / Observaciones Clínicas
              </span>
              <div className="p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/70 text-xs text-[var(--foreground)] font-mono min-h-[3rem]">
                {appointment?.notes?.trim() || appointment?.reason?.trim() || "Sin notas registradas para esta cita."}
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
