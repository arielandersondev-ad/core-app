import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaRoleRepository } from '../dist/modules/role/infrastructure/prisma-role.repository.js';
import { ReplaceRolePermissionsUseCase } from '../dist/modules/role/application/use-case/replace-role-permissions.use-case.js';

const roleId = '00000000-0000-0000-0000-000000000001';
const organizationId = '00000000-0000-0000-0000-000000000002';
const firstId = '00000000-0000-0000-0000-000000000003';
const secondId = '00000000-0000-0000-0000-000000000004';

function harness() {
  const links = [{ id: 'link-1', roleId, permissionId: firstId }];
  const permissions = new Set([firstId, secondId]);
  const orm = { core: {
    Role: { first: async () => ({ id: roleId, organizationId, deleted: false }) },
    Organization: { first: async () => ({ id: organizationId, status: 'ACTIVE', deleted: false }) },
    Permission: { first: async ({ id }) => permissions.has(id) ? { id } : null },
    RolePermission: {
      where: (filter) => ({
        all: async () => links.filter((link) => link.roleId === filter.roleId),
        delete: async () => {
          const index = links.findIndex((link) => link.id === filter.id);
          if (index >= 0) links.splice(index, 1);
        },
      }),
      create: async ({ roleId: newRoleId, permissionId }) => {
        links.push({ id: `link-${links.length + 1}`, roleId: newRoleId, permissionId });
      },
    },
  } };
  const prisma = { transaction: async (work) => work({ orm }) };
  const useCase = new ReplaceRolePermissionsUseCase(new PrismaRoleRepository(prisma, {}));
  return { links, useCase };
}

test('reemplaza permisos de rol de forma idempotente y deduplica el payload', async () => {
  const { links, useCase } = harness();
  const result = await useCase.execute(roleId, [secondId, secondId]);
  assert.deepEqual(result.permissionIds, [secondId]);
  assert.deepEqual(links.map((link) => link.permissionId), [secondId]);
  await useCase.execute(roleId, [secondId]);
  assert.deepEqual(links.map((link) => link.permissionId), [secondId]);
});

test('rechaza un permiso inexistente antes de cambiar asignaciones', async () => {
  const { links, useCase } = harness();
  await assert.rejects(useCase.execute(roleId, ['00000000-0000-0000-0000-000000000099']));
  assert.deepEqual(links.map((link) => link.permissionId), [firstId]);
});
