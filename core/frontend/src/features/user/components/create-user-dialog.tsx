'use client';

import { CreateUserForm } from '@/features/user/components/forms/create-user-form';
import { Modal } from '@/shared/components/ui/Modal';

type CreateUserDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateUserDialog({
  open,
  onClose,
}: CreateUserDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Gestión de usuarios"
      title="Crear usuario"
      description="Registra sus datos y asigna los accesos correspondientes."
    >
      {open && (
        <CreateUserForm
          onCancel={onClose}
          onCreated={onClose}
        />
      )}
    </Modal>
  );
}