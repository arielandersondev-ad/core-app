"use client";

import { useEffect } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { useCreateOrganizationSetup } from "../hooks/use-organizations";
import { useCreateOrganizationWizard } from "../hooks/use-create-organization-wizard";
import { BranchesStep } from "./forms/branches-step";
import { OrganizationStep } from "./forms/organization-step";
import { RolesStep } from "./forms/roles-step";
import { CreateOrganizationWizardActions } from "./create-organization-wizard-actions";
import { CreateOrganizationWizardHeader } from "./create-organization-wizard-header";

type CreateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateOrganizationDialog({ open, onClose }: CreateOrganizationDialogProps) {
  const wizard = useCreateOrganizationWizard();
  const createOrganization = useCreateOrganizationSetup();
  const resetWizard = wizard.reset;
  const resetMutation = createOrganization.reset;

  useEffect(() => {
    if (!open) {
      resetWizard();
      resetMutation();
    }
  }, [open, resetWizard, resetMutation]);

  async function handleCreate() {
    if (wizard.data.roles.length === 0 || wizard.data.branches.length === 0) {
      return;
    }

    await createOrganization.mutateAsync(wizard.data, {
      onSuccess: onClose,
    });
  }

  const error = createOrganization.error instanceof Error
    ? createOrganization.error.message
    : createOrganization.error
      ? "No se pudo crear la organización."
      : null;

  const canContinue = wizard.currentStep === 0
    || (wizard.currentStep === 1 && wizard.data.roles.length > 0)
    || (wizard.currentStep === 2 && wizard.data.branches.length > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear organización"
      description="Configura la organización, sus roles y sucursales."
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <CreateOrganizationWizardHeader currentStep={wizard.currentStep} />

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {wizard.currentStep === 0 && (
            <OrganizationStep
              defaultValues={wizard.data.organization}
              onSubmit={wizard.saveOrganization}
            />
          )}
          {wizard.currentStep === 1 && (
            <RolesStep
              roles={wizard.data.roles}
              onAdd={wizard.addRole}
              onRemove={wizard.removeRole}
            />
          )}
          {wizard.currentStep === 2 && (
            <BranchesStep
              branches={wizard.data.branches}
              onAdd={wizard.addBranch}
              onRemove={wizard.removeBranch}
            />
          )}
        </div>

        {error && (
          <p role="alert" className="border-t border-danger/20 bg-danger/10 px-5 py-3 text-sm text-danger sm:px-6">
            {error}
          </p>
        )}

        <CreateOrganizationWizardActions
          currentStep={wizard.currentStep}
          canContinue={canContinue}
          isSubmitting={createOrganization.isPending}
          onBack={wizard.goBack}
          onCancel={onClose}
          onContinue={wizard.goToBranches}
          onCreate={() => void handleCreate()}
        />
      </div>
    </Modal>
  );
}
