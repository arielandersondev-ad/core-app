import type { Permission } from '../../domain/entities/permission.entity.js';
import { parsePermissionCode } from '../../domain/value-objects/permission-code.js';
import type { PermissionGroup } from '../contracts/permission-group.js';

export function groupPermissionsByResource(
  permissions: Permission[],
): PermissionGroup[] {
  const groups = new Map<string, PermissionGroup['permissions']>();

  for (const permission of permissions) {
    const { resource } = parsePermissionCode(permission.code);
    const item = {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description,
    };
    const existingPermissions = groups.get(resource);

    if (existingPermissions) {
      existingPermissions.push(item);
    } else {
      groups.set(resource, [item]);
    }
  }

  return [...groups.entries()]
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, groupedPermissions]) => ({
      key,
      permissions: groupedPermissions.sort((permissionA, permissionB) =>
        permissionA.code.localeCompare(permissionB.code),
      ),
    }));
}
