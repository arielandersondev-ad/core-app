#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/918d188226620b23dcddc86697efacdc0bb1ff20e5a8b9c1489a4c263582d1ab/contract';
import endContract from '../../snapshots/918d188226620b23dcddc86697efacdc0bb1ff20e5a8b9c1489a4c263582d1ab/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'AuditLog',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('branchId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('metadata', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('organizationId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('resource', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('resourceId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Authorization',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('failedAttempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('lockedUntil', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('passwordChangedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('userId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Branch',
        columns: [
          col('addressLine1', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('addressLine2', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('latitude', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('longitude', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('postalCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('state', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('timezone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Membership',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('joinedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('INVITED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('userId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'MembershipBranch',
        columns: [
          col('branchId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('membershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'MembershipRole',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('membershipId', 'character(36)', {
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
      this.createTable({
        schema: 'public',
        table: 'Organization',
        columns: [
          col('country', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('legalName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('taxId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('timezone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('website', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Role',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
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
        schema: 'public',
        table: 'Session',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('expiresAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lastUsedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('refreshTokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('emailVerifiedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('lastName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Authorization',
        constraint: 'Authorization_userId_key',
        columns: ['userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
