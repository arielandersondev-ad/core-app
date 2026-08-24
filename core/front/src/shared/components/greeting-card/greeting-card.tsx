import type { ReactNode } from "react";

type GreetingCardProps = {
  title: string;
  message?: string;
  children?: ReactNode;
};

export function GreetingCard({ title, message, children }: GreetingCardProps) {
  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      {message ? <p className="mt-2 text-base text-muted">{message}</p> : null}
      {children}
    </section>
  );
}
