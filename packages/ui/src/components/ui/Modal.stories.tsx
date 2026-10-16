import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { Icons } from "./Icons";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  tags: ["autodocs"],
};

export default meta;

export const InteractiveModal: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <Button onClick={() => setOpen(true)} leftIcon={Icons.plus}>
          Abrir Modal de Ejemplo
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Crear Nueva Cita"
          subtitle="Completa los datos del paciente para registrar la cita médica."
          icon={Icons.calendar}
        >
          <div className="flex flex-col gap-4">
            <Input label="Nombre del paciente" placeholder="Ej. Juan Pérez" />
            <Input label="Teléfono de contacto" placeholder="+1 (555) 000-0000" />
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Guardar Cita
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};
