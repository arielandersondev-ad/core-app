#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/473c58e3346c99c9fe6f0dd342bb42ec8dbfbe7b2f23d37cef0405400b9c6315/contract';
import startContract from '../../snapshots/473c58e3346c99c9fe6f0dd342bb42ec8dbfbe7b2f23d37cef0405400b9c6315/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d6f743fff5a8c31a6ee55353e00c233253ea736257b90fbd71dff4c041f8949a/contract';
import endContract from '../../snapshots/d6f743fff5a8c31a6ee55353e00c233253ea736257b90fbd71dff4c041f8949a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'core',
        table: 'Permission',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'core',
        table: 'RolePermission',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('permissionId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('roleId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'core',
        table: 'Permission',
        constraint: 'Permission_code_key',
        columns: ['code'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'RolePermission',
        index: 'RolePermission_permissionId_idx_f46fcdf5',
        columns: ['permissionId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'RolePermission',
        index: 'RolePermission_roleId_idx_ffccc9a4',
        columns: ['roleId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'RolePermission',
        index: 'role_permission_pair_uidx_e509f7f6',
        columns: ['roleId', 'permissionId'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'RolePermission',
        foreignKey: {
          name: 'RolePermission_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'core', table: 'Role', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'RolePermission',
        foreignKey: {
          name: 'RolePermission_permissionId_fkey',
          columns: ['permissionId'],
          references: { schema: 'core', table: 'Permission', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
