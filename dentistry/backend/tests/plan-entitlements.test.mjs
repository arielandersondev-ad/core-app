import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  isModuleEnabled,
  parsePlanEntitlements,
} from '../dist/modules/auth/application/contracts/plan-entitlements.js';
import { PrismaPlanEntitlementsReader } from '../dist/modules/auth/infrastructure/prisma-plan-entitlements.reader.js';
import { DentistryModuleGuard } from '../dist/modules/auth/presentation/http/guards/dentistry-module.guard.js';
import { REQUIRED_MODULE } from '../dist/modules/auth/presentation/http/decorators/require-module.decorator.js';

const organizationId = '00000000-0000-0000-0000-000000000001';
const now = new Date('2026-11-13T12:00:00.000Z');
const BASIC = {
  schemaVersion: 1,
  modules: ['patients', 'agenda', 'appointments', 'procedures', 'unknown-module'],
  limits: { patients: 300, users: 2, branches: 1 },
};

test('parsea módulos conocidos y límites del snapshot', () => {
  const result = parsePlanEntitlements(BASIC);
  assert.deepEqual(result.modules, ['patients', 'agenda', 'appointments', 'procedures']);
  assert.deepEqual(result.limits, { patients: 300, users: 2, branches: 1 });
  assert.equal(isModuleEnabled(result, 'agenda'), true);
  assert.equal(isModuleEnabled(result, 'payments'), false);
});

test('un snapshot sin módulos no restringe y sin límites es ilimitado', () => {
  const result = parsePlanEntitlements({ schemaVersion: 1, limits: { patients: 0 } });
  assert.equal(result.modules, null);
  assert.equal(isModuleEnabled(result, 'payments'), true);
  assert.deepEqual(result.limits, { patients: null, users: null, branches: null });
  assert.deepEqual(parsePlanEntitlements(null).limits.patients, null);
});

function readerWith(assignments) {
  const prisma = { orm: { core: { OrganizationPlanAssignment: {
    where: (filter) => ({
      all: async () => assignments.filter((row) =>
        row.organizationId === filter.organizationId && row.vertical === filter.vertical),
    }),
  } } } };
  return new PrismaPlanEntitlementsReader(prisma);
}

const assignment = (overrides = {}) => ({
  organizationId, vertical: 'DENTISTRY', status: 'ACTIVE',
  startsAt: new Date('2026-11-01T00:00:00.000Z'), endsAt: new Date('2026-12-01T00:00:00.000Z'),
  entitlementsSnapshot: BASIC, ...overrides,
});

test('el lector solo usa la asignación vigente de Dentistry', async () => {
  assert.equal(await readerWith([]).read(organizationId, now), null);
  assert.equal(await readerWith([assignment({ status: 'SUSPENDED' })]).read(organizationId, now), null);
  assert.equal(await readerWith([assignment({ endsAt: now })]).read(organizationId, now), null);
  const current = await readerWith([
    assignment({ status: 'CANCELED', entitlementsSnapshot: { schemaVersion: 1 } }),
    assignment({ status: 'TRIALING' }),
  ]).read(organizationId, now);
  assert.equal(current.limits.patients, 300);
});

function contextFor(module) {
  const handler = () => undefined;
  if (module) Reflect.defineMetadata(REQUIRED_MODULE, module, handler);
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user: { organizationId } }) }),
  };
}

function guardWith(entitlements) {
  let reads = 0;
  const guard = new DentistryModuleGuard(new Reflector(), {
    read: async () => { reads += 1; return entitlements; },
  });
  return { guard, reads: () => reads };
}

test('el guard deja pasar rutas sin módulo requerido sin consultar el plan', async () => {
  const { guard, reads } = guardWith(null);
  assert.equal(await guard.canActivate(contextFor(undefined)), true);
  assert.equal(reads(), 0);
});

test('el guard permite módulos incluidos y rechaza los demás', async () => {
  const { guard } = guardWith(parsePlanEntitlements(BASIC));
  assert.equal(await guard.canActivate(contextFor('agenda')), true);
  await assert.rejects(guard.canActivate(contextFor('inventory')), (error) => {
    assert.ok(error instanceof ForbiddenException);
    assert.equal(error.getResponse().code, 'MODULE_NOT_IN_PLAN');
    assert.equal(error.getResponse().module, 'inventory');
    return true;
  });
});

test('el guard rechaza cuando no hay plan vigente', async () => {
  const { guard } = guardWith(null);
  await assert.rejects(guard.canActivate(contextFor('agenda')), ForbiddenException);
});
