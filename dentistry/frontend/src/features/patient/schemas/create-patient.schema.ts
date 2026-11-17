import { z } from "zod";
import type { CreatePatientRequest } from "@/features/patient/types/patient";

const optionalText = () => z.string().trim().transform((value) => value || undefined);

export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio."),
  lastName: z.string().trim().min(1, "El apellido es obligatorio."),
  phone: optionalText(),
  email: z.string().trim().pipe(z.union([z.literal(""), z.email({ error: "Ingresa un correo válido." })])).transform((value) => value || undefined),
  birthDate: z.string().pipe(z.union([z.literal(""), z.iso.date({ error: "Ingresa una fecha de nacimiento válida." })])).transform((value) => value || undefined),
  sex: z.enum(["", "MALE", "FEMALE", "OTHER"]).transform((value) => value || undefined),
  documentType: optionalText(),
  documentNumber: optionalText(),
  address: optionalText(),
  notes: optionalText(),
}).superRefine((values, context) => {
  if (values.documentNumber && !values.documentType) {
    context.addIssue({ code: "custom", path: ["documentType"], message: "Ingresa también el tipo de documento." });
  }
  if (values.documentType && !values.documentNumber) {
    context.addIssue({ code: "custom", path: ["documentNumber"], message: "Ingresa también el número de documento." });
  }
}).transform((values): CreatePatientRequest => values);
