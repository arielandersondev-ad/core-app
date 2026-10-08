"use client";

import { useState } from "react";
import { patients, Patient } from "@/modules/clinic/__mocks__/data";
import { Modal, Button, Input, Select, Icons } from "@/shared/components/ui";

interface CreatePatientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (patient: Patient) => void;
}

export function CreatePatientModal({
  open,
  onClose,
  onSuccess,
}: CreatePatientModalProps) {
  const [form, setForm] = useState({
    name: "",
    documentId: "",
    dob: "",
    gender: "F",
    phone: "",
    email: "",
    address: "",
    bloodType: "O+",
    allergies: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nombre requerido";
    if (!form.phone.trim()) e.phone = "Teléfono requerido";
    if (!form.dob) e.dob = "Fecha de nacimiento requerida";
    return e;
  };

  const handleClose = () => {
    setForm({
      name: "",
      documentId: "",
      dob: "",
      gender: "F",
      phone: "",
      email: "",
      address: "",
      bloodType: "O+",
      allergies: "",
      notes: "",
    });
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
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: form.name.trim(),
      dob: form.dob,
      phone: form.phone.trim(),
      email: form.email.trim() || `${form.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      address: form.address.trim() || "Dirección no registrada",
      bloodType: form.bloodType,
      allergies: form.allergies
        ? form.allergies.split(",").map((a) => a.trim()).filter(Boolean)
        : [],
      notes: form.notes.trim() || "Paciente registrado desde la plataforma.",
      createdAt: new Date().toISOString().split("T")[0],
      lastVisit: new Date().toISOString().split("T")[0],
    };

    patients.unshift(newPatient);
    setIsSubmitting(false);

    if (onSuccess) {
      onSuccess(newPatient);
    }
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo Paciente"
      subtitle="Registrar nuevo expediente clínico e información médica"
      icon={Icons.users}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Sección 1: Datos Personales */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            1. Datos Personales & Filiación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Nombre Completo *
              </label>
              <Input
                placeholder="Ej. Ana Cristina Vidal Torres"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Fecha de Nacimiento *
              </label>
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                error={errors.dob}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Tipo de Sangre
              </label>
              <Select
                value={form.bloodType}
                onChange={(e) => set("bloodType", e.target.value)}
                options={[
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Información de Contacto */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            2. Contacto & Domicilio
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Teléfono / WhatsApp *
              </label>
              <Input
                placeholder="Ej. 70012345"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                error={errors.phone}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Correo Electrónico (Opcional)
              </label>
              <Input
                type="email"
                placeholder="paciente@correo.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Dirección Residencial (Opcional)
              </label>
              <Input
                placeholder="Av. Principal #123, Zona Centro"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Antecedentes Clínicos */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            3. Antecedentes Médicos
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Alergias Conocidas (Separar por comas)
              </label>
              <Input
                placeholder="Ej. Penicilina, Látex, Ibuprofeno..."
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
              />
              <p className="text-[10px] text-[var(--muted)] mt-1">
                Si no presenta alergias conocidas, dejar este campo vacío.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Notas Clínicas Iniciales / Motivo de Consulta
              </label>
              <textarea
                rows={3}
                placeholder="Diagnóstico preliminar, observaciones o derivaciones..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
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
            {isSubmitting ? "Registrando..." : "Registrar Paciente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
