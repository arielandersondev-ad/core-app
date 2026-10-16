type PermissionGroupPresentation = {
  label: string;
  description: string;
  order: number;
};

const permissionGroupPresentation: Record<string, PermissionGroupPresentation> = {
  users: {
    label: 'Usuarios',
    description: 'Acceso a las cuentas y membresías de la plataforma.',
    order: 10,
  },
  organizations: {
    label: 'Organizaciones',
    description: 'Administración de organizaciones y sus datos principales.',
    order: 20,
  },
  branches: {
    label: 'Sucursales',
    description: 'Administración de sucursales y su operación.',
    order: 30,
  },
  roles: {
    label: 'Roles y permisos',
    description: 'Administración de roles y asignación de accesos.',
    order: 40,
  },
};

function humanizeGroupKey(key: string) {
  return key
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getPermissionGroupPresentation(
  key: string,
): PermissionGroupPresentation {
  return permissionGroupPresentation[key] ?? {
    label: humanizeGroupKey(key),
    description: 'Permisos disponibles para este recurso.',
    order: Number.MAX_SAFE_INTEGER,
  };
}
