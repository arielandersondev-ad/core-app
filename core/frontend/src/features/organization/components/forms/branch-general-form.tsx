import type { BranchFormData } from "./types";

const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

type BranchGeneralFormProps = {
  branches: BranchFormData[];
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

export function BranchGeneralForm({ branches, onRemove }: BranchGeneralFormProps) {
  return (
    <section aria-labelledby="branch-data-title">
      <div className="mb-5">
        <h3
          id="branch-data-title"
          className="text-base font-semibold text-foreground"
        >
          Crear sucursales
        </h3>

        <p className="mt-1 text-sm text-muted">
          Ingresa los datos de cada sucursal y añádela a la lista.
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
            autoComplete="organization"
            placeholder="Ej. Sucursal Central"
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
            placeholder="Ej. Clínica Central S.R.L."
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            País <span className="text-danger">*</span>
          </span>

          <input
            required
            name="country"
            type="text"
            autoComplete="address-level2"
            placeholder="Ej. La Paz"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Email <span className="text-danger">*</span>
          </span>

          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="contacto@organizacion.com"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Teléfono <span className="text-danger">*</span>
          </span>

          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+591 70000000"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Latitud <span className="text-danger">*</span>
          </span>

          <input
            required
            name="latitude"
            type="number"
            step="any"
            placeholder="-16.4897"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Longitud <span className="text-danger">*</span>
          </span>

          <input
            required
            name="longitude"
            type="number"
            step="any"
            placeholder="-68.1193"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Zona horaria <span className="text-danger">*</span>
          </span>

          <select
            required
            name="timezone"
            defaultValue="America/La_Paz"
            className={inputClassName}
          >
            <option value="America/La_Paz">La Paz (UTC-4)</option>
            <option value="America/Lima">Lima (UTC-5)</option>
            <option value="America/Bogota">Bogotá (UTC-5)</option>
            <option value="America/Santiago">Santiago</option>
            <option value="America/Mexico_City">Ciudad de México</option>
          </select>
        </label>

        <label>
          <span className={labelClassName}>Codigo Postal</span>

          <input
            name="postalCode"
            type="text"
            placeholder="0000"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>Address Line 1</span>

          <input
            name="addressLine1"
            type="text"
            placeholder="direccion 1"
            className={inputClassName}
          />
        </label>
        <label>
          <span className={labelClassName}>Address Line 2</span>

          <input
            name="addressLine2"
            type="text"
            placeholder="direccion 2"
            className={inputClassName}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle"
      >
        Añadir sucursal
      </button>

      <div className="mt-6" aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">Sucursales añadidas</h4>
          <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
            {branches.length}
          </span>
        </div>

        {branches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
            Añade al menos una sucursal para crear la organización.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {branches.map((branch, index) => (
              <article
                key={`${branch.code}-${index}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {branch.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{branch.code}</p>
                  <p className="mt-2 text-xs text-muted">
                    {branch.country} · {branch.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Eliminar sucursal ${branch.name}`}
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
