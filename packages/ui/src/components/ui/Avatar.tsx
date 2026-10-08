export interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarColors = [
  "bg-amber-700 text-amber-50",
  "bg-stone-700 text-stone-50",
  "bg-neutral-600 text-neutral-50",
  "bg-emerald-800 text-emerald-50",
  "bg-stone-800 text-stone-100",
];

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const charCode = name && name.length > 0 ? name.charCodeAt(0) : 0;
  const idx = charCode % avatarColors.length;
  const color = avatarColors[idx];
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div
      className={`${sizes[size]} ${color} rounded-[var(--radius-sm)] flex items-center justify-center font-display font-semibold shrink-0 select-none ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
