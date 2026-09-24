import type { OrganizationFormData } from "./types";

const inputClassName = [
  "h-11 w-full rounded-lg border border-border",
  "bg-surface px-3 text-sm text-foreground",
  "placeholder:text-muted",
  "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
].join(" ");

const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";
type OrganizationGeneralFormProps = {
  defaultValues: OrganizationFormData;
};

export function OrganizationGeneralForm({ defaultValues }: OrganizationGeneralFormProps) {
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
            defaultValue={defaultValues.name}
            placeholder="Ej. Clínica Central"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            Nombre legal <span className="text-danger">*</span>
          </span>

          <input
            required
            name="legalName"
            type="text"
            defaultValue={defaultValues.legalName}
            placeholder="Ej. Clínica Central S.R.L."
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            NIT <span className="text-danger">*</span>
          </span>

          <input
            required
            name="taxId"
            type="text"
            defaultValue={defaultValues.taxId}
            inputMode="numeric"
            placeholder="Ej. 1020304050"
            className={inputClassName}
          />
        </label>

        <label>
          <span className={labelClassName}>
            País <span className="text-danger">*</span>
          </span>

          <select
            required
            name="country"
            defaultValue={defaultValues.country}
            className={inputClassName}
          >
            <option value="BO">Bolivia</option>
            <option value="PE">Perú</option>
            <option value="CL">Chile</option>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="AR">Argentina</option>
            <option value="EC">Ecuador</option>
          </select>
        </label>

        <label>
          <span className={labelClassName}>
            Email <span className="text-danger">*</span>
          </span>

          <input
            required
            name="email"
            type="email"
            defaultValue={defaultValues.email}
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
            defaultValue={defaultValues.phone}
            placeholder="+591 70000000"
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
            defaultValue={defaultValues.timezone}
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
          <span className={labelClassName}>Sitio web</span>

          <input
            name="website"
            type="url"
            defaultValue={defaultValues.website}
            autoComplete="url"
            placeholder="https://organizacion.com"
            className={inputClassName}
          />
        </label>
      </div>
    </section>
  );
}
