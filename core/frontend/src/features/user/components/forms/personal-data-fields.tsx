import type {FieldErrors, UseFormRegister} from 'react-hook-form';
import { Input } from '@/shared/components/ui/Input';
import { CreateUserFormValues } from '../../chemas/create-user.schema';

type PersonalDataFieldsProps = {
  register: UseFormRegister<CreateUserFormValues>;
  errors: FieldErrors<CreateUserFormValues>;
};

export function PersonalDataFields({
  register,
  errors,
}: PersonalDataFieldsProps) {
  return (
    <section
      aria-labelledby="personal-data-title"
      className="space-y-4"
    >
      <div>
        <h3
          id="personal-data-title"
          className="font-display text-base font-semibold text-foreground"
        >
          Datos personales
        </h3>

        <p className="mt-1 text-sm text-muted">
          Ingresa la información principal del usuario.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="create-user-first-name"
          label="Nombre"
          placeholder="Ej. Valentina"
          autoComplete="given-name"
          aria-invalid={Boolean(errors.firstName)}
          error={errors.firstName?.message}
          {...register('firstName')}
        />

        <Input
          id="create-user-last-name"
          label="Apellido"
          placeholder="Ej. Soto"
          autoComplete="family-name"
          aria-invalid={Boolean(errors.lastName)}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <Input
        id="create-user-email"
        label="Correo electrónico"
        type="email"
        placeholder="correo@empresa.com"
        autoComplete="email"
        aria-invalid={Boolean(errors.email)}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        id="create-user-phone"
        label="Teléfono"
        type="tel"
        placeholder="+591 70000000"
        autoComplete="tel"
        hint="Opcional"
        aria-invalid={Boolean(errors.phone)}
        error={errors.phone?.message}
        {...register('phone')}
      />
    </section>
  );
}