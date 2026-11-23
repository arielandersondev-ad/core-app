import { test } from 'node:test';
import assert from 'node:assert/strict';

// Reglas de dominio puras: no abren servidor ni conexión.
process.env.DATABASE_URL ??= 'postgresql://isolated:isolated@127.0.0.1:1/never_connect';
const { assertValidBudget, decideTreatmentChange, normalizeText, normalizeTitle } = await import(
  '../dist/modules/treatment/application/treatment-rules.js'
);

const actor = '11111111-1111-4111-8111-111111111111';
const now = new Date('2026-11-23T15:00:00.000Z');
const treatment = (overrides = {}) => ({
  id: 'treatment-1',
  status: 'PROPOSED',
  startedAt: null,
  endedAt: null,
  agreedPriceMinor: 1_000_000,
  currency: 'BOB',
  paidMinor: 0,
  balanceMinor: 1_000_000,
  ...overrides,
});
const codeOf = (action) => {
  try {
    action();
  } catch (error) {
    return error.code;
  }
  return null;
};

test('presupuesto y moneda van juntos y en unidades menores enteras', () => {
  assert.equal(codeOf(() => assertValidBudget({ agreedPriceMinor: null, currency: null })), null);
  assert.equal(codeOf(() => assertValidBudget({ agreedPriceMinor: 0, currency: 'BOB' })), null);
  assert.equal(codeOf(() => assertValidBudget({ agreedPriceMinor: 1_000_000, currency: 'BOB' })), null);
  for (const budget of [
    { agreedPriceMinor: null, currency: 'BOB' },
    { agreedPriceMinor: 100, currency: null },
    { agreedPriceMinor: 100, currency: 'bob' },
    { agreedPriceMinor: 100, currency: 'BOLIV' },
    { agreedPriceMinor: -1, currency: 'BOB' },
    { agreedPriceMinor: 10.5, currency: 'BOB' },
    { agreedPriceMinor: 2_147_483_648, currency: 'BOB' },
  ]) {
    assert.equal(
      codeOf(() => assertValidBudget(budget)),
      'INVALID_TREATMENT_BUDGET',
      JSON.stringify(budget),
    );
  }
});

test('normalizeText recorta y convierte vacío en null', () => {
  assert.equal(normalizeText('  hola  '), 'hola');
  assert.equal(normalizeText('   '), null);
  assert.equal(normalizeText(undefined), null);
  assert.equal(normalizeText(null), null);
});

test('el título es obligatorio, se recorta y admite hasta 120 caracteres', () => {
  assert.equal(normalizeTitle('  Ortodoncia  '), 'Ortodoncia');
  assert.equal(normalizeTitle('x'.repeat(120)).length, 120);
  for (const value of ['', '   ', null, undefined, 'x'.repeat(121)]) {
    assert.equal(codeOf(() => normalizeTitle(value)), 'INVALID_TREATMENT_TITLE', String(value));
  }
  const renamed = decideTreatmentChange(treatment(), { title: '  Ortodoncia fija ' }, actor, now);
  assert.equal(renamed.title, 'Ortodoncia fija');
  assert.equal(
    codeOf(() => decideTreatmentChange(treatment(), { title: '  ' }, actor, now)),
    'INVALID_TREATMENT_TITLE',
  );
  // Sin título en el cambio, no se toca.
  assert.equal(decideTreatmentChange(treatment(), { notes: 'x' }, actor, now).title, undefined);
});

test('el presupuesto nunca baja de lo ya cobrado', () => {
  const paid = treatment({ paidMinor: 20_000, balanceMinor: 980_000 });
  assert.equal(
    codeOf(() => decideTreatmentChange(paid, { agreedPriceMinor: 19_999 }, actor, now)),
    'BUDGET_BELOW_PAID',
  );
  const equal = decideTreatmentChange(paid, { agreedPriceMinor: 20_000 }, actor, now);
  assert.equal(equal.agreedPriceMinor, 20_000);
  const higher = decideTreatmentChange(paid, { agreedPriceMinor: 1_200_000 }, actor, now);
  assert.equal(higher.agreedPriceMinor, 1_200_000);
  assert.equal(higher.updatedByMembershipId, actor);
});

test('con pagos no se retira el presupuesto ni se cambia la moneda', () => {
  const paid = treatment({ paidMinor: 20_000, balanceMinor: 980_000 });
  assert.equal(
    codeOf(() => decideTreatmentChange(paid, { agreedPriceMinor: null }, actor, now)),
    'BUDGET_BELOW_PAID',
  );
  assert.equal(
    codeOf(() => decideTreatmentChange(paid, { currency: 'USD' }, actor, now)),
    'TREATMENT_CURRENCY_LOCKED',
  );
  // Sin pagos sí se puede corregir ambas cosas.
  const free = treatment();
  assert.equal(decideTreatmentChange(free, { currency: 'USD' }, actor, now).currency, 'USD');
  const removed = decideTreatmentChange(free, { agreedPriceMinor: null }, actor, now);
  assert.equal(removed.agreedPriceMinor, null);
  assert.equal(removed.currency, null);
});

test('una moneda sola, sin presupuesto, se rechaza', () => {
  const noBudget = treatment({ agreedPriceMinor: null, currency: null, balanceMinor: null });
  assert.equal(
    codeOf(() => decideTreatmentChange(noBudget, { currency: 'BOB' }, actor, now)),
    'INVALID_TREATMENT_BUDGET',
  );
  const set = decideTreatmentChange(noBudget, { agreedPriceMinor: 500, currency: 'BOB' }, actor, now);
  assert.equal(set.agreedPriceMinor, 500);
  assert.equal(set.currency, 'BOB');
});

test('los estados finales son de solo lectura', () => {
  for (const status of ['COMPLETED', 'DECLINED', 'CANCELED']) {
    assert.equal(
      codeOf(() => decideTreatmentChange(treatment({ status }), { notes: 'x' }, actor, now)),
      'TREATMENT_CLOSED',
      status,
    );
  }
});

test('las fechas siguen al estado y respetan la restricción de periodo', () => {
  const started = decideTreatmentChange(treatment(), { status: 'IN_PROGRESS' }, actor, now);
  assert.equal(started.startedAt, now);
  assert.equal(started.endedAt, undefined);

  const keepStart = new Date('2026-10-01T10:00:00.000Z');
  const resumed = decideTreatmentChange(
    treatment({ status: 'ON_HOLD', startedAt: keepStart }),
    { status: 'IN_PROGRESS' },
    actor,
    now,
  );
  assert.equal(resumed.startedAt, undefined, 'no pisa el inicio original');

  const completedFromNew = decideTreatmentChange(treatment(), { status: 'COMPLETED' }, actor, now);
  assert.equal(completedFromNew.startedAt, now);
  assert.equal(completedFromNew.endedAt, now);

  const completed = decideTreatmentChange(
    treatment({ status: 'IN_PROGRESS', startedAt: keepStart }),
    { status: 'COMPLETED' },
    actor,
    now,
  );
  assert.equal(completed.startedAt, keepStart);
  assert.equal(completed.endedAt, now);

  // CANCELED sin inicio no puede llevar fin: la base lo rechazaría.
  const canceledNew = decideTreatmentChange(treatment(), { status: 'CANCELED' }, actor, now);
  assert.equal(canceledNew.status, 'CANCELED');
  assert.equal(canceledNew.endedAt, undefined);
  const canceledStarted = decideTreatmentChange(
    treatment({ status: 'IN_PROGRESS', startedAt: keepStart }),
    { status: 'CANCELED' },
    actor,
    now,
  );
  assert.equal(canceledStarted.endedAt, now);
});

test('repetir el mismo estado no cambia nada y solo se guardan los campos enviados', () => {
  const same = decideTreatmentChange(treatment(), { status: 'PROPOSED', notes: '  nota  ' }, actor, now);
  assert.equal(same.status, undefined);
  assert.equal(same.notes, 'nota');
  assert.equal(same.agreedPriceMinor, undefined);
  assert.equal(same.currency, undefined);
});
