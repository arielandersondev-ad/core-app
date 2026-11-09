export interface ClinicalEncounterTextBlockProps {
  label: string;
  value?: string | null;
}

export function ClinicalEncounterTextBlock({ label, value }: ClinicalEncounterTextBlockProps) {
  const hasValue = Boolean(value && value.trim());

  return (
    <div className="space-y-1">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p
        className={`whitespace-pre-line text-sm leading-relaxed ${
          hasValue ? "text-foreground" : "italic text-muted"
        }`}
      >
        {hasValue ? value : "Sin registrar"}
      </p>
    </div>
  );
}

export const TextBlock = ClinicalEncounterTextBlock;
