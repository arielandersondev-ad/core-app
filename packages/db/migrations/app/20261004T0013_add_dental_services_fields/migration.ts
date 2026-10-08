#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0ebda04f6a9e692ce82d511f100cd78a2f29836b1b82b73e3ecac8963ff6a6e2/contract';
import endContract from '../../snapshots/0ebda04f6a9e692ce82d511f100cd78a2f29836b1b82b73e3ecac8963ff6a6e2/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/63fd4b7d92e6c92a3fac0a6f3c2112b48614b28eeaf766754ace7b526c20156d/contract';
import startContract from '../../snapshots/63fd4b7d92e6c92a3fac0a6f3c2112b48614b28eeaf766754ace7b526c20156d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'dentistry',
        table: 'appointment_services',
        columns: [
          col('appointmentId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('durationMinutes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('priceMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('serviceId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'dental_service_supplies',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('estimatedCostMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('inventoryItemId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('quantity', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('serviceId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('unit', 'text', {
            notNull: true,
            default: lit('unidades'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'dental_services',
        column: col('category', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'dental_services',
        column: col('labCostMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointment_services',
        index: 'appointment_services_appointmentId_idx_682a8b58',
        columns: ['appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointment_services',
        index: 'appointment_services_serviceId_idx_b5d9acbf',
        columns: ['serviceId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointment_services',
        index: 'apptsvc_org_appt_idx_9087d499',
        columns: ['organizationId', 'appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointment_services',
        index: 'apptsvc_org_svc_idx_8c10b794',
        columns: ['organizationId', 'serviceId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'dental_service_supplies',
        index: 'dental_service_supplies_serviceId_idx_b5d9acbf',
        columns: ['serviceId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'dental_service_supplies',
        index: 'dss_org_service_idx_8c10b794',
        columns: ['organizationId', 'serviceId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'dental_services',
        index: 'svc_org_category_idx_a0ddcd26',
        columns: ['organizationId', 'category'],
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'appointment_services',
        foreignKey: {
          name: 'appointment_services_appointmentId_fkey',
          columns: ['appointmentId'],
          references: { schema: 'dentistry', table: 'appointments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'appointment_services',
        foreignKey: {
          name: 'appointment_services_serviceId_fkey',
          columns: ['serviceId'],
          references: { schema: 'dentistry', table: 'dental_services', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'dental_service_supplies',
        foreignKey: {
          name: 'dental_service_supplies_serviceId_fkey',
          columns: ['serviceId'],
          references: { schema: 'dentistry', table: 'dental_services', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
