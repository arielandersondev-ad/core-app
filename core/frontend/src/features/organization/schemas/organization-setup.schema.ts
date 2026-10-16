import { z } from "zod";

const requiredText = (label: string, maxLength: number) =>
  z.string().trim().min(1, `${label} es obligatorio.`).max(maxLength);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).transform((value) => value || undefined);

const coordinate = (label: string, minimum: number, maximum: number) =>
  z.preprocess(
    (value) => value === "" ? undefined : value,
    z.coerce
      .number({ error: `${label} es obligatoria.` })
      .min(minimum, `${label} debe ser mayor o igual a ${minimum}.`)
      .max(maximum, `${label} debe ser menor o igual a ${maximum}.`),
  );

export const organizationSchema = z.object({
  name: requiredText("El nombre", 150),
  legalName: requiredText("El nombre legal", 200),
  taxId: requiredText("El NIT", 50),
  country: z.string().trim().length(2, "Selecciona un país."),
  email: z.string().trim().min(1, "El email es obligatorio.").email("Ingresa un email válido."),
  phone: requiredText("El teléfono", 50),
  timezone: requiredText("La zona horaria", 100),
  website: z
    .string()
    .trim()
    .refine((value) => value === "" || URL.canParse(value), "Ingresa una URL válida.")
    .transform((value) => value || undefined),
});

export const roleSchema = z.object({
  name: requiredText("El nombre", 100),
  code: requiredText("El código", 50)
    .transform((value) => value.toUpperCase())
    .pipe(
      z.string().regex(
        /^[A-Z][A-Z0-9_]*$/,
        "Usa letras, números o guiones bajos y comienza con una letra.",
      ),
    ),
  description: requiredText("La descripción", 500),
});

export const branchSchema = z.object({
  name: requiredText("El nombre", 150),
  code: requiredText("El código", 50),
  city: requiredText("La ciudad", 100),
  country: z.string().trim().length(2, "Selecciona un país."),
  email: z.string().trim().min(1, "El email es obligatorio.").email("Ingresa un email válido."),
  phone: requiredText("El teléfono", 50),
  latitude: coordinate("La latitud", -90, 90),
  longitude: coordinate("La longitud", -180, 180),
  timezone: requiredText("La zona horaria", 100),
  postalCode: optionalText(20),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
});

export const organizationSetupSchema = z.object({
  organization: organizationSchema,
  roles: z.array(roleSchema).min(1).max(20),
  branches: z.array(branchSchema).min(1).max(50),
});
