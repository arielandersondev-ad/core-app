const steps = [
  { number: 1, label: "Organización" },
  { number: 2, label: "Roles" },
  { number: 3, label: "Sucursal" },
] as const;

export function CreateOrganizationWizardHeader({ currentStep }: { currentStep: number }) {
  return (
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
              active ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "",
            ].join(" ")}
          >
            <span
              className={[
                "flex size-7 shrink-0 items-center justify-center rounded-full border",
                active || completed ? "border-primary bg-primary-subtle font-semibold" : "border-border",
              ].join(" ")}
            >
              {step.number}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
