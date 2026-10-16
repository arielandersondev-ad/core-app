export type ParsedPermissionCode = {
  resource: string;
  action: string;
  scopes: string[];
};

export function parsePermissionCode(code: string): ParsedPermissionCode {
  const [resource, action, ...scopes] = code.split(':');

  if (!resource || !action || scopes.some((scope) => !scope)) {
    throw new Error(`Código de permiso inválido: ${code}`);
  }

  return { resource, action, scopes };
}
