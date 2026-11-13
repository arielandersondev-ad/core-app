#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/60caa8643e70224c6142a506aaabf149485d3e2f295b0d885866c0d2856a4216/contract';
import startContract from '../../snapshots/60caa8643e70224c6142a506aaabf149485d3e2f295b0d885866c0d2856a4216/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f5c0089e6a6991ed41f5356139ae71499adcae0c935ec1f9a0f076c580919723/contract';
import endContract from '../../snapshots/f5c0089e6a6991ed41f5356139ae71499adcae0c935ec1f9a0f076c580919723/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'dentistry',
        table: 'InventoryItem',
        columns: [
          col('branchId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('category', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('BOB'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('currentStock', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('deletedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('minStock', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('rowVersion', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unit', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitCostMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('inventory_item_currency_bbe8c718', '"currency" ~ \'^[A-Z]{3}$\''),
          checkExpression('inventory_item_current_stock_2a235ec0', '"currentStock" >= 0'),
          checkExpression('inventory_item_min_stock_70584dcc', '"minStock" >= 0'),
          checkExpression(
            'inventory_item_name_0ae1ec01',
            'length(btrim("name")) > 0 AND length(btrim("sku")) > 0 AND length(btrim("unit")) > 0',
          ),
          checkExpression(
            'inventory_item_unit_cost_2d621560',
            '"unitCostMinor" IS NULL OR "unitCostMinor" >= 0',
          ),
          checkExpression('inventory_item_version_dd7c92f3', '"rowVersion" > 0'),
        ],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'InventoryMovement',
        columns: [
          col('branchId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('BOB'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('expiryDate', 'date', { codecRef: { codecId: 'pg/date@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('itemId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lotNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('relatedClinicalEncounterId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('relatedTreatmentId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitCostMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('inventory_movement_currency_bbe8c718', '"currency" ~ \'^[A-Z]{3}$\''),
          checkExpression(
            'inventory_movement_direction_21566819',
            '"type" = \'ADJUSTMENT\' OR "quantity" > 0',
          ),
          checkExpression('inventory_movement_quantity_846f9dc1', '"quantity" <> 0'),
          checkExpression(
            'inventory_movement_type_539b6a05',
            "\"type\" IN ('IN', 'OUT', 'ADJUSTMENT')",
          ),
          checkExpression(
            'inventory_movement_unit_cost_2d621560',
            '"unitCostMinor" IS NULL OR "unitCostMinor" >= 0',
          ),
        ],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'InventoryItem',
        constraint: 'InventoryItem_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryItem',
        index: 'inventory_item_branch_sku_uidx_90a80faf',
        columns: ['branchId', 'sku'],
        extras: { where: '"deletedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryItem',
        index: 'inventory_item_org_active_idx_c89f2a48',
        columns: ['organizationId', 'isActive'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryItem',
        index: 'inventory_item_org_branch_idx_9d922e31',
        columns: ['organizationId', 'branchId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryMovement',
        index: 'InventoryMovement_organizationId_itemId_idx_ed264bce',
        columns: ['organizationId', 'itemId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryMovement',
        index: 'inventory_movement_branch_created_idx_7c12b2dc',
        columns: ['organizationId', 'branchId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryMovement',
        index: 'inventory_movement_item_created_idx_d577e708',
        columns: ['itemId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'InventoryMovement',
        index: 'inventory_movement_org_type_idx_ff4b8294',
        columns: ['organizationId', 'type'],
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'InventoryMovement',
        foreignKey: {
          name: 'InventoryMovement_organizationId_itemId_fkey',
          columns: ['organizationId', 'itemId'],
          references: {
            schema: 'dentistry',
            table: 'InventoryItem',
            columns: ['organizationId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
