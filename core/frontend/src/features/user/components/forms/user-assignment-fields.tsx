'use client';

import {
  Controller,
  useWatch,
  type Control,
  type UseFormSetValue,
} from 'react-hook-form';
import { useOrganizations } from '@/features/organization/hooks/use-organizations';
import { useBranches } from '@/features/organization/hooks/use-organizations';
import { useRoles } from '@/features/role/hooks/use-roles';
import { CreateUserFormValues } from '../../chemas/create-user.schema';
import { MultiSelectField } from './multi-select-branch';

type UserAssignmentFieldsProps = {
  control: Control<CreateUserFormValues>;
  setValue: UseFormSetValue<CreateUserFormValues>;
};

export function UserAssignmentFields({
  control,
  setValue,
}: UserAssignmentFieldsProps) {
  const organizationId = useWatch({
    control,
    name: 'organizationId',
  });

  const organizationsQuery = useOrganizations();
  const rolesQuery = useRoles(organizationId);
  const branchesQuery = useBranches(organizationId);

  const organizations = organizationsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];

  const roleOptions = roles.map((role) => ({
    id: role.id,
    label: role.name,
    description: role.description ?? role.code,
  }));

  const branchOptions = branches.map((branch) => ({
    id: branch.id,
    label: branch.name,
  }));

  function clearDependentSelections() {
    setValue('roleIds', [], {
      shouldDirty: true,
      shouldValidate: false,
    });

    setValue('branchIds', [], {
      shouldDirty: true,
      shouldValidate: false,
    });
  }

  return (
    <section
      aria-labelledby="user-assignment-title"
      className="space-y-4"
    >
      <div>
        <h3
          id="user-assignment-title"
          className="font-display text-base font-semibold text-foreground"
        >
          Organización y accesos
        </h3>

        <p className="mt-1 text-sm text-muted">
          Selecciona la organización y los accesos que tendrá el usuario.
        </p>
      </div>

      <Controller
        control={control}
        name="organizationId"
        render={({ field, fieldState }) => (
          <div>
            <label
              htmlFor="create-user-organization"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Organización
            </label>

            <select
              id="create-user-organization"
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              disabled={
                organizationsQuery.isPending ||
                organizationsQuery.isError
              }
              aria-invalid={fieldState.invalid}
              onChange={(event) => {
                field.onChange(event.target.value);
                clearDependentSelections();
              }}
              className={[
                'h-11 w-full rounded-md border bg-surface px-3 text-sm',
                'text-foreground outline-none transition',
                'focus:ring-2 focus:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-60',
                fieldState.invalid
                  ? 'border-danger focus:border-danger'
                  : 'border-border focus:border-primary',
              ].join(' ')}
            >
              <option value="">
                {organizationsQuery.isPending
                  ? 'Cargando organizaciones…'
                  : organizationsQuery.isError
                    ? 'No se pudieron cargar las organizaciones'
                    : 'Selecciona una organización'}
              </option>

              {organizations.map((organization) => (
                <option
                  key={organization.id}
                  value={organization.id}
                >
                  {organization.name}
                </option>
              ))}
            </select>

            {fieldState.error && (
              <p className="mt-1.5 text-xs text-danger">
                {fieldState.error.message}
              </p>
            )}

            {organizationsQuery.isError && (
              <div
                role="alert"
                className="mt-1.5 flex items-center justify-between gap-3"
              >
                <p className="text-xs text-danger">
                  No se pudieron cargar las organizaciones.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void organizationsQuery.refetch();
                  }}
                  className="text-xs font-medium text-danger underline"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}
      />

      <Controller
        control={control}
        name="roleIds"
        render={({ field, fieldState }) => (
          <MultiSelectField
            label="Roles"
            options={roleOptions}
            selectedIds={field.value}
            onChange={field.onChange}
            placeholder={
              organizationId
                ? 'Selecciona uno o más roles'
                : 'Selecciona primero una organización'
            }
            emptyMessage="Esta organización no tiene roles disponibles."
            disabled={!organizationId}
            isLoading={Boolean(organizationId) && rolesQuery.isPending}
            error={
              rolesQuery.isError
                ? 'No se pudieron cargar los roles.'
                : fieldState.error?.message
            }
            onRetry={
              rolesQuery.isError
                ? () => {
                    void rolesQuery.refetch();
                  }
                : undefined
            }
          />
        )}
      />

      <Controller
        control={control}
        name="branchIds"
        render={({ field, fieldState }) => (
          <MultiSelectField
            label="Sucursales"
            options={branchOptions}
            selectedIds={field.value}
            onChange={field.onChange}
            placeholder={
              organizationId
                ? 'Selecciona una o más sucursales'
                : 'Selecciona primero una organización'
            }
            emptyMessage="Esta organización no tiene sucursales disponibles."
            disabled={!organizationId}
            isLoading={ Boolean(organizationId) && branchesQuery.isPending}
            error={
              branchesQuery.isError
                ? 'No se pudieron cargar las sucursales.'
                : fieldState.error?.message
            }
            onRetry={
              branchesQuery.isError
                ? () => {
                    void branchesQuery.refetch();
                  }
                : undefined
            }
          />
        )}
      />
    </section>
  );
}