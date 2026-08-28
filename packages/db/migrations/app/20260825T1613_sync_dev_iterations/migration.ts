#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/918d188226620b23dcddc86697efacdc0bb1ff20e5a8b9c1489a4c263582d1ab/contract';
import startContract from '../../snapshots/918d188226620b23dcddc86697efacdc0bb1ff20e5a8b9c1489a4c263582d1ab/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e895710bb8af14d332edc7b921da8bccdf0a24bec3aee590d47ff063fc4d2598/contract';
import endContract from '../../snapshots/e895710bb8af14d332edc7b921da8bccdf0a24bec3aee590d47ff063fc4d2598/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_branchId_idx_d04da5bb',
        columns: ['branchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Branch',
        index: 'Branch_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Membership',
        index: 'Membership_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Membership',
        index: 'Membership_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MembershipBranch',
        index: 'MembershipBranch_branchId_idx_d04da5bb',
        columns: ['branchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MembershipBranch',
        index: 'MembershipBranch_membershipId_idx_fdcfb7b5',
        columns: ['membershipId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MembershipRole',
        index: 'MembershipRole_membershipId_idx_fdcfb7b5',
        columns: ['membershipId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MembershipRole',
        index: 'MembershipRole_roleId_idx_ffccc9a4',
        columns: ['roleId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Role',
        index: 'Role_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Session',
        index: 'Session_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AuditLog',
        foreignKey: {
          name: 'AuditLog_branchId_fkey',
          columns: ['branchId'],
          references: { schema: 'public', table: 'Branch', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AuditLog',
        foreignKey: {
          name: 'AuditLog_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'Organization', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AuditLog',
        foreignKey: {
          name: 'AuditLog_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Authorization',
        foreignKey: {
          name: 'Authorization_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Branch',
        foreignKey: {
          name: 'Branch_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'Organization', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Membership',
        foreignKey: {
          name: 'Membership_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'Organization', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Membership',
        foreignKey: {
          name: 'Membership_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MembershipBranch',
        foreignKey: {
          name: 'MembershipBranch_branchId_fkey',
          columns: ['branchId'],
          references: { schema: 'public', table: 'Branch', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MembershipBranch',
        foreignKey: {
          name: 'MembershipBranch_membershipId_fkey',
          columns: ['membershipId'],
          references: { schema: 'public', table: 'Membership', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MembershipRole',
        foreignKey: {
          name: 'MembershipRole_membershipId_fkey',
          columns: ['membershipId'],
          references: { schema: 'public', table: 'Membership', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MembershipRole',
        foreignKey: {
          name: 'MembershipRole_roleId_fkey',
          columns: ['roleId'],
          references: { schema: 'public', table: 'Role', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Role',
        foreignKey: {
          name: 'Role_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'Organization', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Session',
        foreignKey: {
          name: 'Session_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
