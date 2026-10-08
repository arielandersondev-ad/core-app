"use client";

import { useState, useEffect } from "react";
import {
  patients,
  services,
  professionals,
  TODAY_DATE,
  formatCurrency,
  Appointment,
  appointments,
} from "@/modules/clinic/__mocks__/data";
import { Modal, Button, Input, Select, Icons } from "@/shared/components/ui";

interface CreateAppointmentModalProps {
  open: boolean;
  initialPatientId?: string;
  initialDate?: string;
  onClose: () => void;
  onSuccess?: (appointment: Appointment) => void;
}

export function CreateAppointmentModal({
  open,
  initialPatientId,
  initialDate,
  onClose,
  onSuccess,
}: CreateAppointmentModalProps) {
  const [form, setForm] = useState({
    patientId: initialPatientId || "",
    professionalId: professionals[0]?.id || "",
    serviceIds: [] as string[],
    date: initialDate || TODAY_DATE,
    startTime: "09:00",
    notes: "",
  });
  const [serviceToAdd, setServiceToAdd] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        patientId: initialPatientId || prev.patientId || (patients[0]?.id ?? ""),
        date: initialDate || prev.date || TODAY_DATE,
        serviceIds: prev.serviceIds.length > 0 ? prev.serviceIds : [services[0]?.id ?? ""],
      }));
      setErrors({});
    }
  }, [open, initialPatientId, initialDate]);

  const set = (k: string, v: any) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const selectedServices = services.filter((s) =>
    form.serviceIds.includes(s.id),
  );
  const totalDurationMin = selectedServices.reduce(
    (sum, s) => sum + s.durationMin,
    0,
  );
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const calcEnd = () => {
    if (!form.startTime || totalDurationMin === 0) return "";
    const [h, m] = form.startTime.split(":").map(Number);
    const total = h * 60 + m + totalDurationMin;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
      total % 60,
    ).padStart(2, "0")}`;
  };

  const handleAddService = (sId: string) => {
    if (!sId) return;
    if (!form.serviceIds.includes(sId)) {
      set("serviceIds", [...form.serviceIds, sId]);
    }
    setServiceToAdd("");
  };

  const handleRemoveService = (sId: string) => {
    if (form.serviceIds.length <= 1) return;
    set(
      "serviceIds",
      form.serviceIds.filter((id) => id !== sId),
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.patientId) e.patientId = "Selecciona un paciente";
    if (form.serviceIds.length === 0)
      e.serviceIds = "Selecciona al menos un servicio";
    if (!form.professionalId) e.professionalId = "Asigna un profesional";
    if (!form.date) e.date = "Selecciona una fecha";
    return e;
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }

    setIsSubmitting(true);
    const endTime = calcEnd() || "09:45";

    const newAppt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: form.patientId,
      professionalId: form.professionalId,
      serviceId: form.serviceIds[0],
      serviceIds: form.serviceIds,
      date: form.date,
      startTime: form.startTime,
      endTime,
      status: "programada",
      notes: form.notes.trim(),
    };

    appointments.unshift(newAppt);
    setIsSubmitting(false);

    if (onSuccess) {
      onSuccess(newAppt);
    }
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Agendar Nueva Cita"
      subtitle="Programar turno, servicios odontológicos y profesional asignado"
      icon={Icons.calendar}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Paciente y Profesional */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            1. Paciente & Profesional Responsable
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Paciente *
              </label>
              <Select
                value={form.patientId}
                onChange={(e) => set("patientId", e.target.value)}
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.phone})`,
                }))}
              />
              {errors.patientId && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.patientId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Odontólogo Tratante *
              </label>
              <Select
                value={form.professionalId}
                onChange={(e) => set("professionalId", e.target.value)}
                options={professionals.map((p) => ({
                  value: p.id,
                  label: `${p.name} — ${p.specialty}`,
                }))}
              />
              {errors.professionalId && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.professionalId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fecha y Horario */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            2. Programación de Horario
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Fecha *
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                error={errors.date}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Hora de Inicio *
              </label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                Fin Estimado
              </label>
              <div className="h-10 px-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center font-mono text-sm text-[var(--foreground)]">
                {calcEnd() || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Servicios Odontológicos */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              3. Procedimientos Odontológicos
            </h3>
            <span className="text-[11px] font-mono text-[var(--primary)] font-semibold">
              {totalDurationMin} min · {formatCurrency(totalPrice)}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Lista de seleccionados */}
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((svc) => (
                <div
                  key={svc.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] shadow-2xs"
                >
                  <span className="font-medium">{svc.name}</span>
                  <span className="text-[10px] text-[var(--muted)] font-mono">
                    {svc.durationMin}m · {formatCurrency(svc.price)}
                  </span>
                  {selectedServices.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveService(svc.id)}
                      className="text-[var(--muted)] hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Selector para añadir otro */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1">
                <Select
                  value={serviceToAdd}
                  onChange={(e) => {
                    const v = e.target.value;
                    setServiceToAdd(v);
                    handleAddService(v);
                  }}
                  options={[
                    { value: "", label: "+ Añadir otro tratamiento..." },
                    ...services
                      .filter((s) => !form.serviceIds.includes(s.id))
                      .map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.durationMin}m - ${formatCurrency(s.price)})`,
                      })),
                  ]}
                />
              </div>
            </div>
            {errors.serviceIds && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.serviceIds}
              </p>
            )}
          </div>
        </div>

        {/* Resumen & Notas */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Motivo o Notas de la Consulta (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Indicaciones previas, requerimiento de instrumental o urgencia..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none"
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-[var(--muted)]">Total previsto: </span>
            <strong className="font-mono text-sm text-[var(--primary)]">
              {formatCurrency(totalPrice)}
            </strong>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="rounded-xl shadow-xs"
            >
              {isSubmitting ? "Agendando..." : "Agendar Cita"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
