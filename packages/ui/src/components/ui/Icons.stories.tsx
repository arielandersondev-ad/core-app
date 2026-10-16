import type { Meta, StoryObj } from "@storybook/react";
import { Icons } from "./Icons";

const meta: Meta = {
  title: "UI/Icons",
  parameters: {
    layout: "padded",
  },
};

export default meta;

export const AllIcons: StoryObj = {
  render: () => {
    const iconEntries = Object.entries(Icons);

    return (
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">
            Catálogo Unificado de Iconos ({iconEntries.length} iconos)
          </h2>
          <p className="text-xs text-[var(--muted)] mt-1">
            Iconos consistentes y optimizados compartidos por Core y Dentistry.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {iconEntries.map(([name, icon]) => (
            <div
              key={name}
              className="flex flex-col items-center justify-center p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all gap-2 group"
            >
              <div className="text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-center h-8">
                {icon}
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] text-center break-all select-all">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
