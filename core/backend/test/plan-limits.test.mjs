import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEntitlements, readEntitlementLimit } from '../dist/modules/plan/domain/entitlements.js';
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
    entitlementsSnapshot: { schemaVersion: 1, limits: { users: 2, branches: 1 } },
    ...overrides,
  };
}

test('acepta módulos y límites válidos y conserva claves existentes', () => {
  const result = normalizeEntitlements({
    modules: ['patients', 'agenda', 'inventory'],
    limits: { patients: 300, users: 2, branches: 1, legacy: 'x' },
    features: { files: false },
  });
  assert.deepEqual(result.modules, ['patients', 'agenda', 'inventory']);
  assert.equal(result.limits.patients, 300);
  assert.equal(result.limits.legacy, 'x');
  assert.equal(result.schemaVersion, 1);
});

test('acepta límites nulos como ilimitados', () => {
  assert.doesNotThrow(() => normalizeEntitlements({ limits: { patients: null } }));
  assert.equal(readEntitlementLimit({ limits: { patients: null } }, 'patients'), null);
  assert.equal(readEntitlementLimit({}, 'patients'), null);
  assert.equal(readEntitlementLimit({ limits: { patients: 300 } }, 'patients'), 300);
});

test('rechaza módulos inválidos o duplicados', () => {
  for (const modules of ['patients', [1], ['Patients'], ['a', 'a'], [''], {}]) {
    assert.throws(() => normalizeEntitlements({ modules }), { status: 400 });
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
    assignment({ entitlementsSnapshot: { schemaVersion: 1, limits: { users: 5 } } }),
    assignment({ status: 'CANCELED', entitlementsSnapshot: { schemaVersion: 1, limits: { users: 1 } } }),
    assignment({ endsAt: past, entitlementsSnapshot: { schemaVersion: 1, limits: { users: 1 } } }),
  ]);
  assert.equal(await findOrganizationLimit(tx, organizationId, 'users', now), 2);
  assert.equal(await findOrganizationLimit(txWith([]), organizationId, 'users', now), null);
});

test('bloquea al alcanzar el cupo y permite por debajo', async () => {
  const tx = txWith([assignment()]);
  await assert.doesNotReject(assertOrganizationQuota(tx, organizationId, 'users', async () => 1));
  await assert.rejects(
    assertOrganizationQuota(tx, organizationId, 'users', async () => 2),
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
