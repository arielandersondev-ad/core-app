import test from 'node:test';
import assert from 'node:assert/strict';
import { ConflictException } from '@nestjs/common';
import { PrismaPlanRepository } from '../dist/modules/plan/infrastructure/prisma-plan.repository.js';

const organizationId = '00000000-0000-0000-0000-000000000001';
const planId = '00000000-0000-0000-0000-000000000002';

function harness({ assignmentStatus } = {}) {
  const organization = { id: organizationId, name: 'Clínica Uno', status: 'ACTIVE', deleted: false };
  const plan = {
    id: planId,
    code: 'DENTISTRY_STARTER',
    name: 'Starter',
    description: null,
    type: 'PUBLIC',
    vertical: 'DENTISTRY',
    durationDays: 30,
    configuration: {},
    priceMinor: null,
    currency: null,
    active: true,
    deleted: false,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const assignments = assignmentStatus ? [{
    id: '00000000-0000-0000-0000-000000000003',
    organizationId,
    planId,
    vertical: 'DENTISTRY',
    status: assignmentStatus,
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: new Date('2026-01-31T00:00:00.000Z'),
    renewalPreference: 'UNDECIDED', renewalCount: 0, lastRenewedAt: null,
    suspendedAt: null, suspensionReason: null, canceledAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  }] : [];

  const whereAssignments = (filter) => ({
    first: async () => assignments.find((item) =>
      (!filter.id || item.id === filter.id) &&
      (!filter.organizationId || item.organizationId === filter.organizationId) &&
      (!filter.vertical || item.vertical === filter.vertical)) ?? null,
    all: async () => assignments.filter((item) => !filter.planId || item.planId === filter.planId),
    update: async (values) => {
      const item = assignments.find((candidate) => candidate.id === filter.id);
      if (!item) return null;
      Object.assign(item, values, { updatedAt: new Date() });
      return item;
    },
  });
  const orm = { core: {
    Organization: { first: async () => organization },
    Plan: {
      first: async (filter) => filter.id === planId ? plan : null,
      where: (filter) => ({
        update: async (values) => filter.id === planId ? Object.assign(plan, values) : null,
      }),
    },
    OrganizationPlan: {
      where: whereAssignments,
      create: async (values) => {
        const row = { id: '00000000-0000-0000-0000-000000000003', ...values, createdAt: new Date(), updatedAt: new Date() };
        assignments.push(row);
        return row;
      },
    },
    AuditLog: { create: async () => ({}) },
  } };
  const prisma = { orm, transaction: async (work) => work({ orm }) };
  return { assignments, plan, repository: new PrismaPlanRepository(prisma) };
}

test('asigna un plan y deriva endsAt desde durationDays', async () => {
  const { repository } = harness();
  const startsAt = new Date('2026-09-01T12:00:00.000Z');
  const result = await repository.assign({
    organizationId, planId, vertical: 'DENTISTRY', status: 'ACTIVE', startsAt,
  });
  assert.equal(result.endsAt.toISOString(), '2026-10-01T12:00:00.000Z');
  assert.equal(result.organizationName, 'Clínica Uno');
  assert.equal(result.planCode, 'DENTISTRY_STARTER');
});

test('rechaza asignar un plan de otra vertical', async () => {
  const { repository } = harness();
  await assert.rejects(repository.assign({
    organizationId, planId, vertical: 'VETERINARY', status: 'ACTIVE', startsAt: new Date(),
  }));
});

test('impide eliminar lógicamente un plan con una asignación vigente', async () => {
  const { repository, plan } = harness({ assignmentStatus: 'ACTIVE' });
  await assert.rejects(repository.softDelete(planId), ConflictException);
  assert.equal(plan.deleted, false);
});

test('permite el borrado lógico cuando solo hay asignaciones canceladas', async () => {
  const { repository } = harness({ assignmentStatus: 'CANCELED' });
  const result = await repository.softDelete(planId);
  assert.equal(result.deleted, true);
  assert.equal(result.active, false);
  assert.ok(result.deletedAt instanceof Date);
});
