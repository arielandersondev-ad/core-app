import { Icons } from "../icons/icons";

/** Marca de la clínica: el mismo distintivo en el sidebar y en la barra móvil. */
export function BrandMark({ className = "size-9 rounded-xl" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center bg-[linear-gradient(140deg,var(--primary),color-mix(in_oklab,var(--primary)_70%,var(--primary-accent)))] text-primary-foreground shadow-[0_4px_12px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)] [&_svg]:size-[55%] ${className}`}
    >
      {Icons.tooth}
    </span>
  );
}
