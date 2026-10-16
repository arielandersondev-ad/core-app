'use client';

import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Label } from '@/shared/components/ui';
import { useCreatePermission } from '../../hooks/use-permissions';
import {
  createPermissionDefaultValues,
  createPermissionSchema,
  type CreatePermissionFormInput,
  type CreatePermissionFormOutput,
} from '../../schemas/create-permission.schema';

type CreatePermissionFormProps = {
  onCancel: () => void;
  onCreated: () => void;
};

export function CreatePermissionForm({ onCancel, onCreated }: CreatePermissionFormProps) {
  const form = useForm<CreatePermissionFormInput, unknown, CreatePermissionFormOutput>({
    resolver: zodResolver(createPermissionSchema),
    defaultValues: createPermissionDefaultValues,
  });
  const createPermission = useCreatePermission();
  const error = createPermission.isError
    ? isAxiosError(createPermission.error)
      && typeof createPermission.error.response?.data?.message === 'string'
      ? createPermission.error.response.data.message
      : 'No se pudo crear el permiso.'
    : null;

  function handleCancel() {
    form.reset(createPermissionDefaultValues);
    createPermission.reset();
    onCancel();
  }

  async function handleSubmit(values: CreatePermissionFormOutput) {
    await createPermission.mutateAsync(values);
    form.reset(createPermissionDefaultValues);
    createPermission.reset();
    onCreated();
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
        <Input
          id="create-permission-name"
          label="Nombre"
          placeholder="Ej. Crear planes"
          autoComplete="off"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />

        <Input
          id="create-permission-code"
          label="Código"
          placeholder="plans:create"
          autoComplete="off"
          hint="Usa entre 2 y 4 segmentos separados por dos puntos."
          error={form.formState.errors.code?.message}
          {...form.register('code')}
        />

        <div className="flex flex-col gap-1">
          <Label htmlFor="create-permission-description">Descripción</Label>
          <textarea
            id="create-permission-description"
            rows={4}
            placeholder="Explica qué operación habilita este permiso."
            aria-invalid={Boolean(form.formState.errors.description)}
            className={`w-full resize-none rounded-md border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              form.formState.errors.description ? 'border-danger' : 'border-border'
            }`}
            {...form.register('description')}
          />
          {form.formState.errors.description?.message && (
            <p className="text-[11px] text-danger">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:px-6">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={createPermission.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createPermission.isPending}>
          {createPermission.isPending ? 'Creando…' : 'Crear permiso'}
        </Button>
      </footer>
    </form>
  );
}
