"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, Select } from "@/shared/components/ui";
import { createPatientSchema } from "@/features/patient/schemas/create-patient.schema";
import { initialPatientValues, patientToFormValues, type PatientFormValues } from "@/features/patient/types/patient-form";
import type { CreatePatientRequest } from "@/features/patient/types/patient";
import type { PatientDto } from "@/features/patient/types/patient";
import { ApiError } from "@/infrastructure/http/api-error";
import { SessionContextChangedError } from "@/infrastructure/auth/session-context";

type Props = {
  onSubmit: (values: CreatePatientRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: Error | null;
  patient?: PatientDto;
};

export function PatientForm({ onSubmit, onCancel, isSubmitting, error, patient }: Props) {
  const prefix = useId();
  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormValues, unknown, CreatePatientRequest>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: patient ? patientToFormValues(patient) : initialPatientValues,
  });
  const needsLogin = error instanceof SessionContextChangedError || (error instanceof ApiError && error.status === 401);
  const message = error instanceof ApiError && error.status === 401
    ? "Tu sesión venció. Inicia sesión en otra pestaña y vuelve a guardar. Lo escrito se mantiene en este formulario."
    : error instanceof ApiError && error.status === 403
      ? `No tienes permiso para ${patient ? "actualizar" : "crear"} pacientes.`
      : error?.message;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} aria-label={patient ? "Editar paciente" : "Crear paciente"} aria-busy={isSubmitting} className="space-y-5">
      <p className="text-xs text-muted">Los campos con * son obligatorios.</p>
      <fieldset disabled={isSubmitting} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-display font-semibold text-sm text-foreground">Datos personales</legend>
        <Input id={`${prefix}-firstName`} label="Nombre *" autoComplete="given-name" {...register("firstName")} error={errors.firstName?.message} aria-invalid={Boolean(errors.firstName)} />
        <Input id={`${prefix}-lastName`} label="Apellido *" autoComplete="family-name" {...register("lastName")} error={errors.lastName?.message} aria-invalid={Boolean(errors.lastName)} />
        <Input id={`${prefix}-birthDate`} label="Fecha de nacimiento" type="date" autoComplete="bday" {...register("birthDate")} error={errors.birthDate?.message} aria-invalid={Boolean(errors.birthDate)} />
        <Select id={`${prefix}-sex`} label="Sexo" {...register("sex")} error={errors.sex?.message} aria-invalid={Boolean(errors.sex)} options={[
          { value: "", label: "Sin especificar" }, { value: "FEMALE", label: "Femenino" },
          { value: "MALE", label: "Masculino" }, { value: "OTHER", label: "Otro" },
        ]} />
        <Input id={`${prefix}-documentType`} label="Tipo de documento" placeholder="Ej. CI o pasaporte" {...register("documentType")} error={errors.documentType?.message} aria-invalid={Boolean(errors.documentType)} />
        <Input id={`${prefix}-documentNumber`} label="Número de documento" {...register("documentNumber")} error={errors.documentNumber?.message} aria-invalid={Boolean(errors.documentNumber)} />
        <p className="sm:col-span-2 text-xs text-muted">Si registras un documento, completa su tipo y número.</p>
      </fieldset>
      <fieldset disabled={isSubmitting} className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
        <legend className="font-display font-semibold text-sm text-foreground">Contacto</legend>
        <Input id={`${prefix}-phone`} label="Teléfono" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} aria-invalid={Boolean(errors.phone)} />
        <Input id={`${prefix}-email`} label="Correo electrónico" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} aria-invalid={Boolean(errors.email)} />
        <div className="sm:col-span-2"><Input id={`${prefix}-address`} label="Dirección" autoComplete="street-address" {...register("address")} error={errors.address?.message} /></div>
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor={`${prefix}-notes`}>Notas</Label>
          <textarea id={`${prefix}-notes`} rows={3} {...register("notes")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </fieldset>
      {error && (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger-subtle p-3 text-sm text-danger space-y-2">
          <p>{message}</p>
          {needsLogin && <a href="/login?returnTo=%2Fpatients" target="_blank" rel="noopener noreferrer" className="inline-flex font-semibold underline underline-offset-2">Iniciar sesión en otra pestaña</a>}
        </div>
      )}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{isSubmitting ? "Guardando…" : patient ? "Guardar cambios" : "Guardar paciente"}</Button>
      </div>
    </form>
  );
}
