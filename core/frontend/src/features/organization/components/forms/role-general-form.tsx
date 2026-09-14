import type { RoleFormData } from "./types";

const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

type RoleGeneralFormProps = {
  roles: RoleFormData[];
  onRemove: (index: number) => void;
};

function DeleteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
    >
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
    </svg>
  );
}

export function RoleGeneralForm({ roles, onRemove }: RoleGeneralFormProps) {
  return (
    <section aria-labelledby="role-data-title">
      <div className="mb-5">
        <h3
          id="role-data-title"
          className="text-base font-semibold text-foreground"
        >
          Creacion de Roles
        </h3>

        <p className="mt-1 text-sm text-muted">
          Ingresa los datos principales del rol.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClassName}>
            Nombre <span className="text-danger">*</span>
          </span>

          <input
            required
            name="name"
            type="text"
            autoComplete="off"
            placeholder="Administrador"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Codigo <span className="text-danger">*</span>
          </span>

          <input
            required
            name="code"
            type="text"
            placeholder="admin"
            className={inputClassName}
          />
        </label>


        <label>
          <span className={labelClassName}>
            Descripcion <span className="text-danger">*</span>
          </span>

          <input
            required
            name="description"
            type="text"
            autoComplete="off"
            placeholder="Ej. Administrador del sistema"
            className={inputClassName}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle"
      >
        Añadir rol
      </button>

      <div className="mt-6" aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">Roles añadidos</h4>
          <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
            {roles.length}
          </span>
        </div>

        {roles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
            Añade al menos un rol para continuar.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role, index) => (
              <article
                key={`${role.code}-${index}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {role.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{role.code}</p>
                  <p className="mt-2 text-xs text-muted">{role.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Eliminar rol ${role.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                >
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
