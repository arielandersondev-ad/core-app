import React, { useState, type ChangeEvent } from "react";
import { Input, Select, Button } from "@/shared/components/ui";
import { PageContainer, PageHeader } from "@/shared/components/layout";

export default function CreatePatient({ onBack }: { onBack: () => void }) {
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

  if (success) {
    return (
      <PageContainer maxWidth="max-w-lg" className="pt-16 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl shadow-xs">
          ✓
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-bold text-[var(--foreground)]">
            Paciente registrado
          </h3>
          <p className="text-sm text-[var(--muted)]">
            <strong>{form.name}</strong> fue registrado con éxito en el sistema clínico.
          </p>
        </div>
        <Button onClick={onBack} fullWidth className="mt-4 shadow-xs">
          Volver a pacientes
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-4xl">
      {/* 1. Cabecera */}
      <PageHeader
        title="Nuevo Paciente"
        description="Registrar expediente, antecedentes personales e información clínica inicial"
        breadcrumbs={[
          { label: "Pacientes", onClick: onBack },
          { label: "Nuevo paciente" },
        ]}
      />

      {/* 2. Formulario en 2 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Datos personales
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4 shadow-xs">
              <Input
                label="Nombre completo *"
                placeholder="Ej. Ana Cristina Vidal Torres"
                value={form.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set("name", e.target.value)
                }
                error={errors.name}
              />
              <Input
                label="Fecha de nacimiento *"
                type="date"
                value={form.dob}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set("dob", e.target.value)
                }
                error={errors.dob}
              />
              <Select
                label="Tipo de sangre"
                value={form.bloodType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  set("bloodType", e.target.value)
                }
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Contacto
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4 shadow-xs">
              <Input
                label="Teléfono principal *"
                placeholder="+51 987 654 321"
                value={form.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set("phone", e.target.value)
                }
                error={errors.phone}
              />
              <Input
                label="Correo electrónico (opcional)"
                type="email"
                placeholder="paciente@correo.com"
                value={form.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set("email", e.target.value)
                }
              />
              <Input
                label="Dirección de residencia (opcional)"
                placeholder="Av. Los Álamos 234, Lima"
                value={form.address}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  set("address", e.target.value)
                }
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
              Información clínica
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4 shadow-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                  Alergias conocidas
                </label>
                <textarea
                  value={form.allergies}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    set("allergies", e.target.value)
                  }
                  placeholder="Ibuprofeno, Penicilina, Látex… (separar por coma)"
                  rows={2}
                  className="w-full px-3 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none transition-all"
                />
                <p className="text-[11px] text-[var(--muted)]">
                  Si no presenta alergias conocidas, dejar este campo en blanco.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                  Notas clínicas iniciales
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    set("notes", e.target.value)
                  }
                  placeholder="Diagnóstico previo, antecedentes médicos o motivos de consulta…"
                  rows={5}
                  className="w-full px-3 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] resize-none transition-all"
                />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2 mt-auto">
            <Button onClick={handleSubmit} fullWidth className="shadow-xs">
              Registrar paciente
            </Button>
            <Button variant="outline" onClick={onBack}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
