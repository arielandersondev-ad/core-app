import { db } from '../dist/prisma/db.js';

const ownerRoleId = '01a03fc9-4ebb-72ef-b56b-d63526470e82';
const codes = [
  'users:read', 'users:create', 'users:update',
  'organizations:read', 'organizations:create', 'organizations:update',
  'branches:read', 'branches:create', 'branches:update',
  'roles:read', 'roles:create', 'roles:update',
  'users:read:organization',
];

try {
  for (const code of codes) {
    const permission = await db.orm.core.Permission.where({ code }).first();
    if (!permission) throw new Error(`Falta el permiso ${code}`);

    const existing = await db.orm.core.RolePermission.where({
      roleId: ownerRoleId,
      permissionId: permission.id,
    }).first();

    if (!existing) {
      const assignment = await db.orm.core.RolePermission.create({
        roleId: ownerRoleId,
        permissionId: permission.id,
      });
      console.log(`${code}: ${assignment.id}`);
    } else {
      console.log(`${code}: ya asignado (${existing.id})`);
    }
  }
} finally {
  await db.close();
}
