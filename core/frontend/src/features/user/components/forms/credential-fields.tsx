'use client';

import { useState } from 'react';
import {
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Icons } from '@/shared/components/ui/Icons';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { CreateUserFormValues } from '../../chemas/create-user.schema';

type CredentialsFieldsProps = {
  control: Control<CreateUserFormValues>;
  register: UseFormRegister<CreateUserFormValues>;
  errors: FieldErrors<CreateUserFormValues>;
};

export function CredentialsFields({control,register,errors,}: CredentialsFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);

  const password = useWatch({
    control,
    name: 'password',
  });

  return (
    <section
      aria-labelledby="credentials-title"
      className="space-y-4"
    >
      <div>
        <h3
          id="credentials-title"
          className="font-display text-base font-semibold text-foreground"
        >
          Credenciales
        </h3>

        <p className="mt-1 text-sm text-muted">
          Define la contraseña inicial de acceso.
        </p>
      </div>

      <div>
        <Label htmlFor="create-user-password">
          Contraseña
        </Label>

        <div className="relative">
          <input
            id="create-user-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            className={[
              'h-11 w-full rounded-md border bg-background px-3 pr-11',
              'text-sm text-foreground outline-none transition',
              'placeholder:text-muted',
              'focus:ring-2 focus:ring-primary/20',
              errors.password
                ? 'border-danger focus:border-danger'
                : 'border-border focus:border-primary',
            ].join(' ')}
            {...register('password')}
          />

          <button
            type="button"
            aria-label={
              showPassword
                ? 'Ocultar contraseña'
                : 'Mostrar contraseña'
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className={[
              'absolute right-2 top-1/2 flex size-8',
              '-translate-y-1/2 items-center justify-center',
              'rounded-md text-muted transition-colors',
              'hover:bg-neutral-subtle hover:text-foreground',
            ].join(' ')}
          >
            {showPassword ? Icons.eyeOff : Icons.eye}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1 text-xs text-danger">
            {errors.password.message}
          </p>
        )}
      </div>

      <Input
        id="create-user-confirm-password"
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite la contraseña"
        autoComplete="new-password"
        aria-invalid={Boolean(errors.confirmPassword)}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {password.length > 0 && (
        <PasswordStrength password={password} />
      )}
    </section>
  );
}

function PasswordStrength({
  password,
}: {
  password: string;
}) {
  const checks = [
    {
      label: '8+ caracteres',
      matches: password.length >= 8,
    },
    {
      label: 'Mayúscula',
      matches: /[A-Z]/.test(password),
    },
    {
      label: 'Número',
      matches: /\d/.test(password),
    },
    {
      label: 'Símbolo',
      matches: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const completedChecks = checks.filter(
    (check) => check.matches,
  ).length;

  return (
    <div className="space-y-2">
      <div
        aria-hidden="true"
        className="flex gap-1"
      >
        {checks.map((check, index) => (
          <span
            key={check.label}
            className={[
              'h-1 flex-1 rounded-full transition-colors',
              index < completedChecks
                ? 'bg-primary'
                : 'bg-neutral-subtle',
            ].join(' ')}
          />
        ))}
      </div>

      <ul
        aria-label="Requisitos recomendados de contraseña"
        className="flex flex-wrap gap-x-3 gap-y-1"
      >
        {checks.map((check) => (
          <li
            key={check.label}
            className={[
              'text-xs',
              check.matches
                ? 'text-success'
                : 'text-muted',
            ].join(' ')}
          >
            {check.matches ? '✓' : '·'} {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}