'use client';

import type { FormEvent } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Modal } from '@/shared/components/ui/Modal';

type AccessFormDialogProps = {
  open: boolean;
  kind: 'role' | 'permission';
  initialName?: string;
  initialCode?: string;
  onClose: () => void;
};

export function AccessFormDialog({
  open,
  kind,
  initialName = '',
  initialCode = '',
  onClose,
}: AccessFormDialogProps) {
  const isRole = kind === 'role';
  const resource = isRole ? 'rol' : 'permiso';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onClose();
  }

  return (
    <Modal
      open={open}
      eyebrow={isRole ? 'Administración de roles' : 'Catálogo de permisos'}
      title={`Editar ${resource}`}
      description={isRole
        ? 'Define la identidad del rol para la organización seleccionada.'
        : 'Configura una capacidad reutilizable que luego podrás asignar a los roles.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <Input
            id={`${kind}-name`}
            name="name"
            label="Nombre"
            defaultValue={initialName}
            placeholder={isRole ? 'Ej. Coordinador de sucursal' : 'Ej. Exportar reportes'}
            required
          />

          <Input
            id={`${kind}-code`}
            name="code"
            label="Código"
            defaultValue={initialCode}
            placeholder={isRole ? 'COORDINADOR_SUCURSAL' : 'reports:export'}
            hint="Usa un código estable y descriptivo; será utilizado por las reglas de acceso."
            required
            disabled
          />

          <div>
            <Label htmlFor={`${kind}-description`}>Descripción</Label>
            <textarea
              id={`${kind}-description`}
              name="description"
              rows={4}
              placeholder={`Explica para qué se utilizará este ${resource}.`}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {isRole && (
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-sm font-semibold">Alcance organizacional</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                El rol se creará para la organización seleccionada. Sus permisos se podrán configurar después de guardarlo.
              </p>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar cambios</Button>
        </footer>
      </form>
    </Modal>
  );
}
