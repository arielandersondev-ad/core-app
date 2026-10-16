"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { branchSchema } from "../../schemas/organization-setup.schema";
import { initialBranchValues, type BranchFormValues } from "../../types/organization-setup";

const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";
const errorClassName = "mt-1 text-xs text-danger";

type BranchFormInput = z.input<typeof branchSchema>;

type BranchesStepProps = {
  branches: BranchFormValues[];
  onAdd: (branch: BranchFormValues) => void;
  onRemove: (index: number) => void;
};

function DeleteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
    </svg>
  );
}

export function BranchesStep({ branches, onAdd, onRemove }: BranchesStepProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: initialBranchValues,
  });

  function addBranch(branch: BranchFormValues) {
    onAdd(branch);
    reset(initialBranchValues);
  }

  return (
    <section aria-labelledby="branch-data-title">
      <div className="mb-5">
        <h3 id="branch-data-title" className="text-base font-semibold text-foreground">Crear sucursales</h3>
        <p className="mt-1 text-sm text-muted">Ingresa los datos de cada sucursal y añádela a la lista.</p>
      </div>

      <form noValidate onSubmit={handleSubmit(addBranch)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>Nombre <span className="text-danger">*</span></span>
            <input {...register("name")} type="text" autoComplete="organization" placeholder="Ej. Sucursal Central" className={inputClassName} />
            {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Codigo <span className="text-danger">*</span></span>
            <input {...register("code")} type="text" placeholder="Ej. Clínica Central S.R.L." className={inputClassName} />
            {errors.code && <p className={errorClassName}>{errors.code.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Ciudad <span className="text-danger">*</span></span>
            <input {...register("city")} type="text" autoComplete="address-level2" placeholder="Ej. La Paz" className={inputClassName} />
            {errors.city && <p className={errorClassName}>{errors.city.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>País <span className="text-danger">*</span></span>
            <select {...register("country")} className={inputClassName}>
              <option value="BO">Bolivia</option><option value="PE">Perú</option><option value="CL">Chile</option>
              <option value="CO">Colombia</option><option value="MX">México</option><option value="AR">Argentina</option><option value="EC">Ecuador</option>
            </select>
            {errors.country && <p className={errorClassName}>{errors.country.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Email <span className="text-danger">*</span></span>
            <input {...register("email")} type="email" autoComplete="email" placeholder="contacto@organizacion.com" className={inputClassName} />
            {errors.email && <p className={errorClassName}>{errors.email.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Teléfono <span className="text-danger">*</span></span>
            <input {...register("phone")} type="tel" autoComplete="tel" placeholder="+591 70000000" className={inputClassName} />
            {errors.phone && <p className={errorClassName}>{errors.phone.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Latitud <span className="text-danger">*</span></span>
            <input {...register("latitude")} type="number" step="any" placeholder="-16.4897" className={inputClassName} />
            {errors.latitude && <p className={errorClassName}>{errors.latitude.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Longitud <span className="text-danger">*</span></span>
            <input {...register("longitude")} type="number" step="any" placeholder="-68.1193" className={inputClassName} />
            {errors.longitude && <p className={errorClassName}>{errors.longitude.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Zona horaria <span className="text-danger">*</span></span>
            <select {...register("timezone")} className={inputClassName}>
              <option value="America/La_Paz">La Paz (UTC-4)</option><option value="America/Lima">Lima (UTC-5)</option>
              <option value="America/Bogota">Bogotá (UTC-5)</option><option value="America/Santiago">Santiago</option>
              <option value="America/Mexico_City">Ciudad de México</option>
            </select>
            {errors.timezone && <p className={errorClassName}>{errors.timezone.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Codigo Postal</span>
            <input {...register("postalCode")} type="text" placeholder="0000" className={inputClassName} />
            {errors.postalCode && <p className={errorClassName}>{errors.postalCode.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Address Line 1</span>
            <input {...register("addressLine1")} type="text" placeholder="direccion 1" className={inputClassName} />
            {errors.addressLine1 && <p className={errorClassName}>{errors.addressLine1.message}</p>}
          </label>
          <label>
            <span className={labelClassName}>Address Line 2</span>
            <input {...register("addressLine2")} type="text" placeholder="direccion 2" className={inputClassName} />
            {errors.addressLine2 && <p className={errorClassName}>{errors.addressLine2.message}</p>}
          </label>
        </div>

        <button type="submit" className="mt-4 rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle">
          Añadir sucursal
        </button>
      </form>

      <div className="mt-6" aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">Sucursales añadidas</h4>
          <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">{branches.length}</span>
        </div>
        {branches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Añade al menos una sucursal para crear la organización.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {branches.map((branch, index) => (
              <article key={`${branch.code}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{branch.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{branch.code}</p>
                  <p className="mt-2 text-xs text-muted">{branch.city}, {branch.country} · {branch.email}</p>
                </div>
                <button type="button" onClick={() => onRemove(index)} aria-label={`Eliminar sucursal ${branch.name}`} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger">
                  <DeleteIcon />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
