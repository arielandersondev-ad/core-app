"use client";

import { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui";
import { Input } from "../ui";
import { Select } from "../ui";

type CreatePatientModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreatePatientModal({ open, onClose }: CreatePatientModalProps) {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    bloodType: "O+",
    allergies: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.phone.trim()) e.phone = "Requerido";
    if (!form.dob) e.dob = "Requerido";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSuccess(true);
  };

  const handleClose = () => {
    setForm({
      name: "",
      dob: "",
      phone: "",
      email: "",
      address: "",
      bloodType: "O+",
      allergies: "",
      notes: "",
    });
    setErrors({});
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal open={open} onClose={handleClose} title="Paciente registrado">
        <div className="flex flex-col items-center gap-5 py-8">
          <div className="w-14 h-14 rounded-[4px] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-display text-xl font-bold text-foreground">
              Paciente registrado
            </h3>
            <p className="text-sm text-muted mt-1">
              <strong>{form.name}</strong> fue registrado correctamente.
            </p>
          </div>
          <Button onClick={handleClose} fullWidth>
            Cerrar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo paciente">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <section>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
              Datos personales
            </p>
            <div className="bg-background border border-border rounded-[4px] p-5 flex flex-col gap-4">
              <Input
                label="Nombre completo"
                placeholder="Ana Cristina Vidal Torres"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
              />
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                error={errors.dob}
              />
              <Select
                label="Tipo de sangre"
                value={form.bloodType}
                onChange={(e) => set("bloodType", e.target.value)}
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </Select>
            </div>
          </section>
          <section>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
              Contacto
            </p>
            <div className="bg-background border border-border rounded-[4px] p-5 flex flex-col gap-4">
              <Input
                label="Teléfono"
                placeholder="+51 987 654 321"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                error={errors.phone}
              />
              <Input
                label="Correo (opcional)"
                type="email"
                placeholder="paciente@gmail.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <Input
                label="Dirección (opcional)"
                placeholder="Av. Los Álamos 234, Lima"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <section>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
              Información clínica
            </p>
            <div className="bg-background border border-border rounded-[4px] p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted">
                  Alergias conocidas
                </label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => set("allergies", e.target.value)}
                  placeholder="Ibuprofeno, Penicilina… (separar con coma)"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-[3px] text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <p className="text-[10px] text-muted">
                  Si no hay alergias conocidas, dejar en blanco
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted">
                  Notas clínicas iniciales
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Diagnóstico inicial, antecedentes relevantes, condiciones crónicas…"
                  rows={4}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-[3px] text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </section>
          <div className="flex gap-3 mt-auto">
            <Button onClick={handleSubmit} fullWidth>
              Registrar paciente
            </Button>
            <button
              onClick={handleClose}
              className="h-10 px-4 text-sm text-muted border border-border rounded-[3px] hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
