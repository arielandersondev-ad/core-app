"use client";

import { useRef, useState } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { OrganizationGeneralForm } from "./forms/organization-general-form";
import { RoleGeneralForm } from "./forms/role-general-form";
import { BranchGeneralForm } from "./forms/branch-general-form";
import {
  initialFormData,
  type BranchFormData,
  type CreateOrganizationPayload,
  type OrganizationFormData,
  type RoleFormData,
} from "./forms/types";

type CreateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
};

const steps = [
  { number: 1, label: "Organización" },
  { number: 2, label: "Roles" },
  { number: 3, label: "Sucursal" },
];
function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function readOrganization(formData: FormData): OrganizationFormData {
  return {
    name: getValue(formData, "name"),
    legalName: getValue(formData, "legalName"),
    taxId: getValue(formData, "taxId"),
    city: getValue(formData, "city"),
    email: getValue(formData, "email"),
    phone: getValue(formData, "phone"),
    timezone: getValue(formData, "timezone"),
    website: getValue(formData, "website"),
  };
}

function readRole(formData: FormData): RoleFormData {
  return {
    name: getValue(formData, "name"),
    code: getValue(formData, "code"),
    description: getValue(formData, "description"),
  };
}

function readBranch(formData: FormData): BranchFormData {
  return {
    name: getValue(formData, "name"),
    code: getValue(formData, "code"),
    country: getValue(formData, "country"),
    email: getValue(formData, "email"),
    phone: getValue(formData, "phone"),
    latitude: getValue(formData, "latitude"),
    longitude: getValue(formData, "longitude"),
    timezone: getValue(formData, "timezone"),
    postalCode: getValue(formData, "postalCode"),
    addressLine1: getValue(formData, "addressLine1"),
    addressLine2: getValue(formData, "addressLine2"),
  };
}

export function CreateOrganizationDialog({ open, onClose }: CreateOrganizationDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<CreateOrganizationPayload>(initialFormData);
  const [organizationFormKey, setOrganizationFormKey] = useState(0);
  const [roleFormKey, setRoleFormKey] = useState(0);
  const [branchFormKey, setBranchFormKey] = useState(0);

  function resetWizard() {
    setCurrentStep(0);
    setWizardData(initialFormData);
    setOrganizationFormKey((key) => key + 1);
    setRoleFormKey((key) => key + 1);
    setBranchFormKey((key) => key + 1);
  }

  function handleClose() {
    resetWizard();
    onClose();
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (currentStep === 0) {
      setWizardData((data) => ({
        ...data,
        organization: readOrganization(formData),
      }));
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      setWizardData((data) => ({
        ...data,
        roles: [...data.roles, readRole(formData)],
      }));
      setRoleFormKey((key) => key + 1);
      return;
    }

    setWizardData((data) => ({
      ...data,
      branches: [...data.branches, readBranch(formData)],
    }));
    setBranchFormKey((key) => key + 1);
  }

  function removeRole(indexToRemove: number) {
    setWizardData((data) => ({
      ...data,
      roles: data.roles.filter((_, index) => index !== indexToRemove),
    }));
  }

  function removeBranch(indexToRemove: number) {
    setWizardData((data) => ({
      ...data,
      branches: data.branches.filter((_, index) => index !== indexToRemove),
    }));
  }

  function handleCreate() {
    if (wizardData.roles.length === 0 || wizardData.branches.length === 0) {
      return;
    }

    console.log("Datos enviados:", wizardData);

    // Reemplazar por la llamada a la API. Reiniciar solo después de que responda correctamente.
    resetWizard();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear organización"
      description="Configura la organización, sus roles y sucursales."
    >
      <form
        ref={formRef}
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
          {currentStep === 0 && (
            <OrganizationGeneralForm
              key={organizationFormKey}
              defaultValues={wizardData.organization}
            />
          )}
          {currentStep === 1 && (
            <RoleGeneralForm
              key={roleFormKey}
              roles={wizardData.roles}
              onRemove={removeRole}
            />
          )}
          {currentStep === 2 && (
            <BranchGeneralForm
              key={branchFormKey}
              branches={wizardData.branches}
              onRemove={removeBranch}
            />
          )}
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
              type="button"
              onClick={(event) => {
                event.preventDefault();

                if (currentStep === 0) {
                  formRef.current?.requestSubmit();
                  return;
                }

                if (currentStep === 1) {
                  setCurrentStep(2);
                  return;
                }

                handleCreate();
              }}
              disabled={
                (currentStep === 1 && wizardData.roles.length === 0) ||
                (currentStep === 2 && wizardData.branches.length === 0)
              }
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
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
