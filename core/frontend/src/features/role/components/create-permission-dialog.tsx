'use client';

import { Modal } from '@/shared/components/ui/Modal';
import { CreatePermissionForm } from './forms/create-permission-form';

type CreatePermissionDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreatePermissionDialog({ open, onClose }: CreatePermissionDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Catálogo de permisos"
      title="Crear permiso"
      description="Crea una capacidad reutilizable que luego podrás asignar a uno o más roles."
    >
      <CreatePermissionForm onCancel={onClose} onCreated={onClose} />
    </Modal>
  );
}
