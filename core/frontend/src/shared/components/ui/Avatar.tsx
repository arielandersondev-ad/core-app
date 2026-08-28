import { getInitials } from '@/shared/utils/data';

const avatarColors = [
  'bg-amber-700 text-amber-50',
  'bg-stone-700 text-stone-50',
  'bg-neutral-600 text-neutral-50',
  'bg-amber-900 text-amber-100',
  'bg-stone-800 text-stone-100',
];

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  const color = avatarColors[idx];
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  return (
    <div className={`${sizes[size]} ${color} rounded-sm flex items-center justify-center font-display font-semibold shrink-0`}>
      {getInitials(name)}
    </div>
  );
}