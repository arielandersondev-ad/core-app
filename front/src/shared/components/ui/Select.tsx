import { SelectHTMLAttributes } from 'react';
import { Label } from './Label';

export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <select
        {...props}
        className="h-11 w-full px-3 bg-background border border-(--border) rounded-(--radius) text-sm text-(--foreground) focus:outline-none focus:ring-1 focus:ring-(--ring) appearance-none transition-shadow"
      >
        {children}
      </select>
    </div>
  );
}