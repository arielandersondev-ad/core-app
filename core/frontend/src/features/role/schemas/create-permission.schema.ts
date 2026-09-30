import { z } from 'zod';

export const createPermissionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio.')
    .max(100, 'El código no puede superar 100 caracteres.')
    .transform((value) => value.toLowerCase())
    .pipe(
      z.string().regex(
        /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*){1,3}$/,
        'Usa entre 2 y 4 segmentos en minúsculas separados por dos puntos.',
      ),
    ),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(100, 'El nombre no puede superar 100 caracteres.'),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar 500 caracteres.')
    .transform((value) => value || null),
});

export const createPermissionDefaultValues: z.input<typeof createPermissionSchema> = {
  code: '',
  name: '',
  description: '',
};

export type CreatePermissionFormInput = z.input<typeof createPermissionSchema>;
export type CreatePermissionFormOutput = z.output<typeof createPermissionSchema>;
