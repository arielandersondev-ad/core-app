'use client';

import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, Label } from '@/shared/components/ui';
import { Modal } from '@/shared/components/ui/Modal';
import { useCreateRole } from '../hooks/use-roles';
import {
  type CreateRoleFormInput,
  type CreateRoleFormOutput,
  createRoleSchema,
  defaultValues,
} from '../schemas/create-role.schema';

type CreateRoleDialogProps = {
  open: boolean;
  organizationId: string;
  organizationName: string;
  onClose: () => void;
};

export function CreateRoleDialog({open, onClose, organizationId, organizationName}: CreateRoleDialogProps) {
  const form = useForm<CreateRoleFormInput, unknown, CreateRoleFormOutput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues,
  });
  const createRole = useCreateRole();
  const error = createRole.isError
    ? isAxiosError(createRole.error) && typeof createRole.error.response?.data?.message === 'string'
      ? createRole.error.response.data.message
      : 'No se pudo crear el rol.'
    : null;

  function handleClose() {
    form.reset(defaultValues);
    createRole.reset();
    onClose();
  }

  async function handleSubmit(values: CreateRoleFormOutput) {
    await createRole.mutateAsync({
      organizationId,
      ...values,
    });

    handleClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      eyebrow="Administración de roles"
      title="Crear rol"
      description="Define un nuevo rol para la organización seleccionada."
    >
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs text-muted">Organización</p>
            <p className="mt-1 font-semibold text-foreground">{organizationName}</p>
          </div>

          <Input
            id="create-role-name"
            label="Nombre"
            placeholder="Ej. Coordinador de sucursal"
            autoComplete="off"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />

          <Input
            id="create-role-code"
            label="Código"
            placeholder="COORDINADOR_SUCURSAL"
            autoComplete="off"
            hint="Usa un código estable; se guardará en mayúsculas."
            error={form.formState.errors.code?.message}
            {...form.register('code')}
          />

          <div className="flex flex-col gap-1">
            <Label htmlFor="create-role-description">Descripción</Label>
            <textarea
              id="create-role-description"
              rows={4}
              placeholder="Explica para qué se utilizará este rol."
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
          <Button type="button" variant="ghost" onClick={handleClose} disabled={createRole.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createRole.isPending}>
            {createRole.isPending ? 'Creando…' : 'Crear rol'}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
