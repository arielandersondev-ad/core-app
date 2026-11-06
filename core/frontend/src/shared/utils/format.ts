export const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  operator: 'Operador',
  viewer: 'Visualizador',
};

export const planLabels: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export const MODULES = [
  'Dashboard',
  'Usuarios',
  'Organizaciones',
  'Sucursales',
  'Reportes',
  'Configuración',
  'Auditoría',
];

export function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return 'N/A';
  const time = new Date(iso).getTime();
  if (isNaN(time)) return 'N/A';
  const diff = Date.now() - time;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'hace menos de 1h';
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}
