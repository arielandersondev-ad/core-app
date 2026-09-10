type Stat = { label: string; value: string | number };

interface StatsBarProps {
  stats: Stat[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-surface border border-border rounded-[4px] p-4"
        >
          <p className="text-3xl font-display font-bold text-foreground">
            {s.value}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mt-1">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
