import { db } from '../dist/prisma/db.js';

const modules = [
  ['users', 'Usuarios'],
  ['organizations', 'Organizaciones'],
  ['branches', 'Sucursales'],
  ['roles', 'Roles'],
];

const actions = [
  ['read', 'Leer'],
  ['create', 'Crear'],
  ['update', 'Editar'],
];

const scopedPermissions = [
  ['users:read:organization', 'Leer usuarios de toda la organización'],
  ['users:read:assigned-branches', 'Leer usuarios de sucursales asignadas'],
];

try {
  for (const [moduleCode, moduleName] of modules) {
    for (const [actionCode, actionName] of actions) {
      const code = `${moduleCode}:${actionCode}`;
      const existing = await db.orm.core.Permission.where({ code }).first();

      if (!existing) {
        await db.orm.core.Permission.create({
          code,
          name: `${actionName} ${moduleName}`,
        });
        console.log(`Creado: ${code}`);
      } else {
        console.log(`Ya existe: ${code}`);
      }
    }
  }

  for (const [code, name] of scopedPermissions) {
    const existing = await db.orm.core.Permission.where({ code }).first();
    if (!existing) {
      await db.orm.core.Permission.create({ code, name });
      console.log(`Creado: ${code}`);
    } else {
      console.log(`Ya existe: ${code}`);
    }
  }
} finally {
  await db.close();
}
