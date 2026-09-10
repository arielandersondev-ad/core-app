"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { OrganizationGeneralForm } from "./forms/organization-general-form";
import { BranchGeneralForm } from "./forms/branch-general-form";

type CreateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
};

const steps = [
  { number: 1, label: "Organización" },
  { number: 2, label: "Roles" },
  { number: 3, label: "Sucursal" },
];

export function CreateOrganizationDialog({ open, onClose }: CreateOrganizationDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  function handleClose() {
    setCurrentStep(0);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    const formData = new FormData(event.currentTarget);

    console.log(
      "Datos de la organización:",
      Object.fromEntries(formData.entries()),
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear organización"
      description="Configura la organización, sus roles y su sucursal inicial."
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <ol className="grid grid-cols-3 border-b border-border px-5 sm:px-6">
          {steps.map((step, index) => {
            const active = index === currentStep;
            const completed = index < currentStep;

            return (
              <li
                key={step.number}
                className={[
                  "relative flex min-h-16 items-center gap-2 text-xs sm:text-sm",
                  active || completed ? "text-primary" : "text-muted",
                  active
                    ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                    : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex size-7 shrink-0 items-center justify-center rounded-full border",
                    active || completed
                      ? "border-primary bg-primary-subtle font-semibold"
                      : "border-border",
                  ].join(" ")}
                >
                  {step.number}
                </span>

                <span className="hidden sm:inline">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <div className={currentStep === 0 ? "block" : "hidden"}>
            <OrganizationGeneralForm />
          </div>

          <div className={currentStep === 1 ? "block" : "hidden"}>
            <OrganizationGeneralForm />
            <h3 className="text-base font-semibold">ROl </h3>

            <p className="mt-1 text-sm text-muted">
              Aquí agregaremos la opción para crear roles.
            </p>
          </div>

          <div className={currentStep === 2 ? "block" : "hidden"}>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setCurrentStep((step) => step - 1)}
            disabled={currentStep === 0}
            className={[
              "rounded-lg border border-border px-4 py-2.5 text-sm",
              "text-foreground transition-colors hover:bg-neutral-subtle",
              "disabled:pointer-events-none disabled:opacity-40",
            ].join(" ")}
          >
            Atrás
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {currentStep === steps.length - 1
                ? "Crear organización"
                : "Siguiente"}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}