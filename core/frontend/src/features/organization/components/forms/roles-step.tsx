"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { roleSchema } from "../../schemas/organization-setup.schema";
import { initialRoleValues, type RoleFormValues } from "../../types/organization-setup";

const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";
const errorClassName = "mt-1 text-xs text-danger";

type RoleFormInput = z.input<typeof roleSchema>;

type RolesStepProps = {
  roles: RoleFormValues[];
  onAdd: (role: RoleFormValues) => void;
  onRemove: (index: number) => void;
};

function DeleteIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
    </svg>
  );
}

export function RolesStep({ roles, onAdd, onRemove }: RolesStepProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormInput, unknown, RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialRoleValues,
  });

  function addRole(role: RoleFormValues) {
    onAdd(role);
    reset(initialRoleValues);
  }

  return (
    <section aria-labelledby="role-data-title">
      <div className="mb-5">
        <h3 id="role-data-title" className="text-base font-semibold text-foreground">Creacion de Roles</h3>
        <p className="mt-1 text-sm text-muted">Ingresa los datos principales del rol.</p>
      </div>

      <form noValidate onSubmit={handleSubmit(addRole)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>Nombre <span className="text-danger">*</span></span>
            <input {...register("name")} type="text" autoComplete="off" placeholder="Administrador" className={inputClassName} />
            {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
          </label>

          <label>
            <span className={labelClassName}>Codigo <span className="text-danger">*</span></span>
            <input {...register("code")} type="text" autoComplete="off" placeholder="admin" className={inputClassName} />
            {errors.code && <p className={errorClassName}>{errors.code.message}</p>}
          </label>

          <label>
            <span className={labelClassName}>Descripcion <span className="text-danger">*</span></span>
            <input {...register("description")} type="text" autoComplete="off" placeholder="Ej. Administrador del sistema" className={inputClassName} />
            {errors.description && <p className={errorClassName}>{errors.description.message}</p>}
          </label>
        </div>

        <button type="submit" className="mt-4 rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle">
          Añadir rol
        </button>
      </form>

      <div className="mt-6" aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">Roles añadidos</h4>
          <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">{roles.length}</span>
        </div>
        {roles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Añade al menos un rol para continuar.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role, index) => (
              <article key={`${role.code}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{role.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{role.code}</p>
                  <p className="mt-2 text-xs text-muted">{role.description}</p>
                </div>
                <button type="button" onClick={() => onRemove(index)} aria-label={`Eliminar rol ${role.name}`} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger">
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
