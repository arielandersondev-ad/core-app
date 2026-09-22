import { db } from '../dist/prisma/db.js';

const [roleId, permissionCode] = process.argv.slice(2);

if (!roleId || !permissionCode) {
  console.error('Uso: node scripts/assign-role-permission.mjs <roleId> <permissionCode>');
  process.exitCode = 1;
} else {
  try {
    const role = await db.orm.core.Role.first({ id: roleId });
    if (!role || role.deleted) throw new Error(`Rol no encontrado: ${roleId}`);

    const permission = await db.orm.core.Permission.where({
      code: permissionCode,
    }).first();
    if (!permission) throw new Error(`Permiso no encontrado: ${permissionCode}`);

    const existing = await db.orm.core.RolePermission.where({
      roleId: role.id,
      permissionId: permission.id,
    }).first();

    if (existing) {
      console.log(`Ya asignado: ${permissionCode} (${existing.id})`);
    } else {
      const assignment = await db.orm.core.RolePermission.create({
        roleId: role.id,
        permissionId: permission.id,
      });
      console.log(`Asignado: ${permissionCode} (${assignment.id})`);
    }
  } finally {
    await db.close();
  }
}
