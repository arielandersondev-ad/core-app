export function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm">
        <h2 className="text-xl font-display font-semibold text-primary">
          {title}
        </h2>
        <p className="mt-2 text-base text-muted">{description}</p>
      </div>
    </div>
  );
}
