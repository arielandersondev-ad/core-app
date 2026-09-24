type CreateOrganizationWizardActionsProps = {
  currentStep: number;
  canContinue: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onCancel: () => void;
  onContinue: () => void;
  onCreate: () => void;
};

export function CreateOrganizationWizardActions({
  currentStep,
  canContinue,
  isSubmitting,
  onBack,
  onCancel,
  onContinue,
  onCreate,
}: CreateOrganizationWizardActionsProps) {
  const lastStep = currentStep === 2;

  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 0}
        className="rounded-lg border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-neutral-subtle disabled:pointer-events-none disabled:opacity-40"
      >
        Atrás
      </button>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm text-muted hover:text-foreground">
          Cancelar
        </button>
        <button
          type={currentStep === 0 ? "submit" : "button"}
          form={currentStep === 0 ? "organization-step-form" : undefined}
          onClick={currentStep === 1 ? onContinue : lastStep ? onCreate : undefined}
          disabled={isSubmitting || !canContinue}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          {lastStep ? (isSubmitting ? "Creando..." : "Crear organización") : "Siguiente"}
        </button>
      </div>
    </footer>
  );
}
