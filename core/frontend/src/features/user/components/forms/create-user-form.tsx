'use client';

import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateUser } from '@/features/user/hooks/use-users';

import { Button } from '@/shared/components/ui/Button';
import { PersonalDataFields } from './personal-data-fields';
import { UserAssignmentFields } from './user-assignment-fields';
import { createUserDefaultValues, CreateUserFormValues, createUserSchema, toCreateUserItem } from '../../chemas/create-user.schema';
import { CredentialsFields } from './credential-fields';

type CreateUserFormProps = {
  onCancel: () => void;
  onCreated: () => void;
};

export function CreateUserForm({
  onCancel,
  onCreated,
}: CreateUserFormProps) {
  const createUser = useCreateUser();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: createUserDefaultValues,
  });

  const submitting = isSubmitting || createUser.isPending;
  const submitError = getSubmitError(createUser.error);

  async function onSubmit(values: CreateUserFormValues) {
    try {
      await createUser.mutateAsync(toCreateUserItem(values));
      reset(createUserDefaultValues);
      onCreated();
    } catch {
      // La mutación conserva el error para mostrarlo en el formulario.
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
        <PersonalDataFields
          register={register}
          errors={errors}
        />

        <div className="border-t border-border" />

        <CredentialsFields
          control={control}
          register={register}
          errors={errors}
        />

        <div className="border-t border-border" />

        <UserAssignmentFields
          control={control}
          setValue={setValue}
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="border-t border-danger/20 bg-danger-subtle px-5 py-3 text-sm text-danger sm:px-6"
        >
          {submitError}
        </div>
      )}

      <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Creando usuario…' : 'Crear usuario'}
        </Button>
      </footer>
    </form>
  );
}

function getSubmitError(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (
    isAxiosError<{ message?: string }>(error) &&
    typeof error.response?.data?.message === 'string'
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'No se pudo crear el usuario. Inténtalo nuevamente.';
}