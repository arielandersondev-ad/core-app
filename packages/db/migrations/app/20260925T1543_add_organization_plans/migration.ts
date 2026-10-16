#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/63fd4b7d92e6c92a3fac0a6f3c2112b48614b28eeaf766754ace7b526c20156d/contract';
import endContract from '../../snapshots/63fd4b7d92e6c92a3fac0a6f3c2112b48614b28eeaf766754ace7b526c20156d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d6f743fff5a8c31a6ee55353e00c233253ea736257b90fbd71dff4c041f8949a/contract';
import startContract from '../../snapshots/d6f743fff5a8c31a6ee55353e00c233253ea736257b90fbd71dff4c041f8949a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'core',
        table: 'OrganizationPlan',
        columns: [
          col('canceledAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('endsAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('lastRenewedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('planId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('renewalCount', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('renewalPreference', 'text', {
            notNull: true,
            default: lit('UNDECIDED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('startsAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('suspendedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('suspensionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('vertical', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'core',
        table: 'Plan',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('configuration', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('currency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('durationDays', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('priceMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', {
            notNull: true,
            default: lit('PUBLIC'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('vertical', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'core',
        table: 'Plan',
        constraint: 'Plan_code_key',
        columns: ['code'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationPlan',
        index: 'OrganizationPlan_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationPlan',
        index: 'OrganizationPlan_planId_idx_5b32079a',
        columns: ['planId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationPlan',
        index: 'organization_plan_expiration_idx_8a078bcc',
        columns: ['endsAt', 'status'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationPlan',
        index: 'organization_plan_vertical_uidx_1e389c18',
        columns: ['organizationId', 'vertical'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'OrganizationPlan',
        foreignKey: {
          name: 'OrganizationPlan_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'core', table: 'Organization', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'OrganizationPlan',
        foreignKey: {
          name: 'OrganizationPlan_planId_fkey',
          columns: ['planId'],
          references: { schema: 'core', table: 'Plan', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
