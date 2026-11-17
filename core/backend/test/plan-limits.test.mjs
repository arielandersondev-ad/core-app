import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatalogEntitlements, normalizeEntitlements, readEntitlementLimit } from '../dist/modules/plan/domain/entitlements.js';
import { assertOrganizationQuota, findOrganizationLimit } from '../dist/modules/plan/infrastructure/organization-plan-quota.js';
import { PlanLimitReachedException } from '../dist/modules/plan/domain/plan-limit-reached.exception.js';

const organizationId = '00000000-0000-0000-0000-000000000001';
const now = new Date();
const past = new Date(now.getTime() - 86_400_000);
const future = new Date(now.getTime() + 86_400_000);

function txWith(assignments) {
  return { orm: { core: { OrganizationPlanAssignment: {
    where: (filter) => ({
      all: async () => assignments.filter((row) => row.organizationId === filter.organizationId),
    }),
  } } } };
}

function assignment(overrides = {}) {
  return {
    organizationId, status: 'ACTIVE', startsAt: past, endsAt: future,
    entitlementsSnapshot: { schemaVersion: 1, limits: { members: 2, branches: 1 } },
    ...overrides,
  };
}

test('acepta funciones y límites válidos y conserva claves existentes', () => {
  const result = normalizeEntitlements({
    features: { clinicalHistory: true, payments: false },
    limits: { patients: 300, members: 2, branches: 1, legacy: 'x' },
    customKey: ['a'],
  });
  assert.deepEqual(result.features, { clinicalHistory: true, payments: false });
  assert.equal(result.limits.patients, 300);
  assert.equal(result.limits.legacy, 'x');
  assert.deepEqual(result.customKey, ['a']);
  assert.equal(result.schemaVersion, 1);
});

test('lee como sin cupo los snapshots antiguos sin la clave', () => {
  assert.doesNotThrow(() => normalizeEntitlements({ limits: { patients: null } }));
  assert.equal(readEntitlementLimit({ limits: { patients: null } }, 'patients'), null);
  assert.equal(readEntitlementLimit({}, 'patients'), null);
  assert.equal(readEntitlementLimit({ limits: { users: 2 } }, 'members'), null);
  assert.equal(readEntitlementLimit({ limits: { members: 2 } }, 'members'), 2);
});

test('rechaza funciones que no son un objeto de booleanos', () => {
  for (const features of ['payments', ['payments'], { payments: 'yes' }, { Payments: true }, { 'pay-ments': true }]) {
    assert.throws(() => normalizeEntitlements({ features }), { status: 400 });
  }
});

test('el catálogo exige funciones y los tres límites', () => {
  const complete = { features: { clinicalHistory: true }, limits: { patients: 300, members: 2, branches: 1 } };
  assert.doesNotThrow(() => normalizeCatalogEntitlements(complete));
  assert.throws(() => normalizeCatalogEntitlements({}), { status: 400 });
  assert.throws(() => normalizeCatalogEntitlements({ limits: complete.limits }), { status: 400 });
  for (const key of ['patients', 'members', 'branches']) {
    const limits = { ...complete.limits, [key]: null };
    assert.throws(() => normalizeCatalogEntitlements({ ...complete, limits }), { status: 400 });
    const { [key]: _omitted, ...missing } = complete.limits;
    assert.throws(() => normalizeCatalogEntitlements({ ...complete, limits: missing }), { status: 400 });
  }
});

test('rechaza límites que no son enteros positivos', () => {
  for (const patients of [0, -1, 1.5, '300', true]) {
    assert.throws(() => normalizeEntitlements({ limits: { patients } }), { status: 400 });
  }
  assert.throws(() => normalizeEntitlements({ limits: [] }), { status: 400 });
});

test('toma el límite más restrictivo de las asignaciones vigentes', async () => {
  const tx = txWith([
    assignment(),
    assignment({ entitlementsSnapshot: { schemaVersion: 1, limits: { members: 5 } } }),
    assignment({ status: 'CANCELED', entitlementsSnapshot: { schemaVersion: 1, limits: { members: 1 } } }),
    assignment({ endsAt: past, entitlementsSnapshot: { schemaVersion: 1, limits: { members: 1 } } }),
  ]);
  assert.equal(await findOrganizationLimit(tx, organizationId, 'members', now), 2);
  assert.equal(await findOrganizationLimit(txWith([]), organizationId, 'members', now), null);
});

test('bloquea al alcanzar el cupo y permite por debajo', async () => {
  const tx = txWith([assignment()]);
  await assert.doesNotReject(assertOrganizationQuota(tx, organizationId, 'members', async () => 1));
  await assert.rejects(
    assertOrganizationQuota(tx, organizationId, 'members', async () => 2),
    (error) => {
      assert.ok(error instanceof PlanLimitReachedException);
      assert.equal(error.getStatus(), 403);
      assert.equal(error.getResponse().code, 'PLAN_LIMIT_REACHED');
      assert.equal(error.getResponse().limit, 2);
      return true;
    },
  );
});

test('no consulta el conteo cuando el plan no define límite', async () => {
  let counted = false;
  await assertOrganizationQuota(txWith([]), organizationId, 'branches', async () => { counted = true; return 99; });
  assert.equal(counted, false);
});
