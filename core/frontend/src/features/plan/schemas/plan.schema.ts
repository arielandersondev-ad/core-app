import { z } from 'zod';

const optionalMoney = z.string().trim().refine((value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value), 'Ingresa un monto válido con hasta 2 decimales.');

export const planFormSchema = z.object({
  code: z.string().trim().min(2, 'El código es obligatorio.').max(50).regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'Usa letras, números y guion bajo.'),
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(120),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['PUBLIC', 'CUSTOM']),
  vertical: z.literal('DENTISTRY'),
  durationDays: z.coerce.number().int().min(1, 'La duración debe ser mayor a cero.').max(3650),
  price: optionalMoney,
  currency: z.string().trim().length(3, 'Usa un código ISO de 3 letras.'),
  active: z.boolean(),
});

export type PlanFormInput = z.input<typeof planFormSchema>;
export type PlanFormValues = z.output<typeof planFormSchema>;
