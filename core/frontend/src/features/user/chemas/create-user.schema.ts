import { z } from 'zod';
import { CreateUserItem } from '../types/user';

export const createUserSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'El nombre es requerido'),

    lastName: z
      .string()
      .trim()
      .min(1, 'El apellido es requerido'),

    email: z
      .string()
      .trim()
      .min(1, 'El correo electrónico es requerido')
      .email('Ingresa un correo electrónico válido'),

    phone: z
      .string()
      .trim()
      .optional(),

    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede superar los 72 caracteres'),

    confirmPassword: z
      .string()
      .min(1, 'Confirma la contraseña'),

    organizationId: z
      .string()
      .min(1, 'Selecciona una organización'),

    roleIds: z
      .array(z.string())
      .min(1, 'Selecciona al menos un rol')
      .max(20, 'No puedes seleccionar más de 20 roles'),

    branchIds: z
      .array(z.string())
      .min(1, 'Selecciona al menos una sucursal')
      .max(20, 'No puedes seleccionar más de 20 sucursales'),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Las contraseñas no coinciden',
    },
  );

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const createUserDefaultValues: CreateUserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organizationId: '',
  roleIds: [],
  branchIds: [],
};

export function toCreateUserItem(
  values: CreateUserFormValues,
): CreateUserItem {
  const phone = values.phone?.trim();

  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    password: values.password,
    organizationId: values.organizationId,
    roleIds: [...new Set(values.roleIds)],
    branchIds: [...new Set(values.branchIds)],
    ...(phone ? { phone } : {}),
  };
}