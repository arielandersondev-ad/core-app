import { ReactNode } from 'react';
import { Card } from './Card';

export function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="text-(--muted-foreground)">{icon}</div>
      <div>
        <p className="text-2xl font-display font-bold text-(--foreground)">{value}</p>
        <p className="text-[11px] font-mono text-(--muted-foreground) uppercase tracking-wider">{label}</p>
      </div>
    </Card>
  );
}