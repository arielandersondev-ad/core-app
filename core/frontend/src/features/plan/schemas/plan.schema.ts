import { z } from 'zod';

const optionalMoney = z.string().trim().refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), 'Ingresa un monto válido con hasta 2 decimales.');

const requiredLimit = z.string().trim().regex(/^[1-9]\d{0,6}$/, 'Ingresa un entero positivo.');

const optionalLimit = z.string().trim().refine((value) => value === '' || /^[1-9]\d{0,6}$/.test(value), 'Ingresa un entero positivo.');

export const planFormSchema = z.object({
  code: z.string().trim().min(2, 'El código es obligatorio.').max(50).regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Usa letras, números y guion bajo.'),
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(120),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['PUBLIC', 'CUSTOM']),
  vertical: z.literal('DENTISTRY'),
  durationDays: z.coerce.number().int().min(1, 'La duración debe ser mayor a cero.').max(3650),
  price: optionalMoney,
  currency: z.string().trim().length(3, 'Usa un código ISO de 3 letras.'),
  isActive: z.boolean(),
  features: z.array(z.string()).min(1, 'Selecciona al menos una función.'),
  patientsLimit: requiredLimit,
  membersLimit: requiredLimit,
  branchesLimit: requiredLimit,
  /** Megabytes; se guarda como `limits.fileStorageBytes`. */
  fileStorageMbLimit: optionalLimit,
  filesPerPatientLimit: optionalLimit,
}).superRefine((values, context) => {
  // Con archivos habilitados ambos cupos son obligatorios: ausente no es ilimitado.
  if (!values.features.includes('files')) return;
  if (values.fileStorageMbLimit === '') {
    context.addIssue({ code: 'custom', path: ['fileStorageMbLimit'], message: 'Obligatorio con archivos clínicos.' });
  }
  if (values.filesPerPatientLimit === '') {
    context.addIssue({ code: 'custom', path: ['filesPerPatientLimit'], message: 'Obligatorio con archivos clínicos.' });
  }
});

export type PlanFormInput = z.input<typeof planFormSchema>;
export type PlanFormValues = z.output<typeof planFormSchema>;
