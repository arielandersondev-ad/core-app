"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { organizationSchema } from "../../schemas/organization-setup.schema";
import type { OrganizationFormValues } from "../../types/organization-setup";

const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";
const errorClassName = "mt-1 text-xs text-danger";

type OrganizationFormInput = z.input<typeof organizationSchema>;

type OrganizationStepProps = {
  defaultValues: OrganizationFormValues;
  onSubmit: (values: OrganizationFormValues) => void;
};

export function OrganizationStep({ defaultValues, onSubmit }: OrganizationStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormInput, unknown, OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues,
  });

  return (
    <form
      id="organization-step-form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="organization-data-title"
    >
      <div className="mb-5">
        <h3 id="organization-data-title" className="text-base font-semibold text-foreground">
          Información general
        </h3>
        <p className="mt-1 text-sm text-muted">
          Ingresa los datos principales de la organización.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClassName}>Nombre <span className="text-danger">*</span></span>
          <input {...register("name")} type="text" placeholder="Ej. Clínica Central" className={inputClassName} />
          {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>Nombre legal <span className="text-danger">*</span></span>
          <input {...register("legalName")} type="text" placeholder="Ej. Clínica Central S.R.L." className={inputClassName} />
          {errors.legalName && <p className={errorClassName}>{errors.legalName.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>NIT <span className="text-danger">*</span></span>
          <input {...register("taxId")} type="text" inputMode="numeric" placeholder="Ej. 1020304050" className={inputClassName} />
          {errors.taxId && <p className={errorClassName}>{errors.taxId.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>País <span className="text-danger">*</span></span>
          <select {...register("country")} className={inputClassName}>
            <option value="BO">Bolivia</option>
            <option value="PE">Perú</option>
            <option value="CL">Chile</option>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="AR">Argentina</option>
            <option value="EC">Ecuador</option>
          </select>
          {errors.country && <p className={errorClassName}>{errors.country.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>Email <span className="text-danger">*</span></span>
          <input {...register("email")} type="email" placeholder="contacto@organizacion.com" className={inputClassName} />
          {errors.email && <p className={errorClassName}>{errors.email.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>Teléfono <span className="text-danger">*</span></span>
          <input {...register("phone")} type="tel" placeholder="+591 70000000" className={inputClassName} />
          {errors.phone && <p className={errorClassName}>{errors.phone.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>Zona horaria <span className="text-danger">*</span></span>
          <select {...register("timezone")} className={inputClassName}>
            <option value="America/La_Paz">La Paz (UTC-4)</option>
            <option value="America/Lima">Lima (UTC-5)</option>
            <option value="America/Bogota">Bogotá (UTC-5)</option>
            <option value="America/Santiago">Santiago</option>
            <option value="America/Mexico_City">Ciudad de México</option>
          </select>
          {errors.timezone && <p className={errorClassName}>{errors.timezone.message}</p>}
        </label>

        <label>
          <span className={labelClassName}>Sitio web</span>
          <input {...register("website")} type="url" autoComplete="url" placeholder="https://organizacion.com" className={inputClassName} />
          {errors.website && <p className={errorClassName}>{errors.website.message}</p>}
        </label>
      </div>
    </form>
  );
}
