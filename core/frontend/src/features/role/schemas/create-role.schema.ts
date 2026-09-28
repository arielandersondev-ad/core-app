import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
  code: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio.')
    .max(50)
    .transform((value) => value.toUpperCase())
    .pipe(
      z.string().regex(
        /^[A-Z][A-Z0-9_]*$/,
        'Usa letras, números o guiones bajos y comienza con una letra.',
      ),
    ),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((value) => value || null),
});


export const defaultValues: z.input<typeof createRoleSchema> = {
  name: '',
  code: '',
  description: '',
};


export type CreateRoleFormInput = z.input<typeof createRoleSchema>;
export type CreateRoleFormOutput = z.output<typeof createRoleSchema>;
