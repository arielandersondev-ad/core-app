const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function BranchGeneralForm() {
  return (
    <section aria-labelledby="organization-data-title">
      <div className="mb-5">
        <h3
          id="organization-data-title"
          className="text-base font-semibold text-foreground"
        >
          Información general
        </h3>

        <p className="mt-1 text-sm text-muted">
          Ingresa los datos principales de la organización.
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
            placeholder="Ej. Clínica Central"
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
            pais <span className="text-danger">*</span>
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
            placeholder="591,70000000"
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
            placeholder="591,70000000"
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
    </section>
  );
}