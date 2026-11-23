import { test } from 'node:test';
import assert from 'node:assert/strict';

// Reglas de dominio puras: no abren servidor ni conexión.
process.env.DATABASE_URL ??= 'postgresql://isolated:isolated@127.0.0.1:1/never_connect';
const {
  buildAccount,
  buildPaymentProposal,
  decideEncounterPayment,
  decideTreatmentPayment,
  requireVoidReason,
  resolveBranch,
} = await import('../dist/modules/payment/application/payment-rules.js');

const organizationId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const actor = '33333333-3333-4333-8333-333333333333';
const branch = '44444444-4444-4444-8444-444444444444';
const otherBranch = '55555555-5555-4555-8555-555555555555';
const now = new Date('2026-11-23T15:00:00.000Z');

const treatment = (overrides = {}) => ({
  id: 'treatment-1',
  title: 'Ortodoncia',
  status: 'IN_PROGRESS',
  agreedPriceMinor: 1_000_000, // 10 000 Bs
  currency: 'BOB',
  paidMinor: 0,
  ...overrides,
});
const encounter = (overrides = {}) => ({
  id: 'encounter-1',
  branchId: branch,
  appointmentId: 'appointment-1',
  treatmentId: 'treatment-1',
  status: 'COMPLETED',
  activePaymentId: null,
  ...overrides,
});
const input = (overrides = {}) => ({
  amountMinor: 20_000, // 200 Bs
  paymentMethod: 'CASH',
  ...overrides,
});
const treatmentCommand = (overrides = {}) => ({
  organizationId,
  patientId,
  treatmentId: 'treatment-1',
  authorizedBranchIds: [branch],
  actorMembershipId: actor,
  now,
  input: input(),
  ...overrides,
});
const encounterCommand = (overrides = {}) => ({
  organizationId,
  patientId,
  authorizedBranchIds: [branch],
  actorMembershipId: actor,
  now,
  input: input(),
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

test('el anticipo de 200 Bs sobre un presupuesto de 10 000 Bs se registra en la moneda del tratamiento', () => {
  const insert = decideTreatmentPayment({ treatment: treatment(), encounter: null }, treatmentCommand());
  assert.equal(insert.amountMinor, 20_000);
  assert.equal(insert.currency, 'BOB');
  assert.equal(insert.treatmentId, 'treatment-1');
  assert.equal(insert.clinicalEncounterId, null);
  assert.equal(insert.appointmentId, null);
  // Sin sucursal indicada se usa la única autorizada.
  assert.equal(insert.branchId, branch);
  assert.equal(insert.receivedByMembershipId, actor);
  assert.equal(insert.paidAt, now);
  assert.equal(insert.organizationId, organizationId);
  assert.equal(insert.patientId, patientId);
});

test('el importe es un entero positivo en unidades menores', () => {
  for (const amountMinor of [0, -1, 1.5, 2_147_483_648, Number.NaN]) {
    assert.equal(
      codeOf(() =>
        decideTreatmentPayment(
          { treatment: treatment(), encounter: null },
          treatmentCommand({ input: input({ amountMinor }) }),
        ),
      ),
      'INVALID_PAYMENT_AMOUNT',
      String(amountMinor),
    );
  }
});

test('nunca se cobra más que el saldo, y el saldo exacto se puede saldar', () => {
  const paid = treatment({ paidMinor: 20_000 });
  const balance = 1_000_000 - 20_000;
  assert.equal(
    codeOf(() =>
      decideTreatmentPayment(
        { treatment: paid, encounter: null },
        treatmentCommand({ input: input({ amountMinor: balance + 1 }) }),
      ),
    ),
    'PAYMENT_EXCEEDS_BALANCE',
  );
  const settle = decideTreatmentPayment(
    { treatment: paid, encounter: null },
    treatmentCommand({ input: input({ amountMinor: balance }) }),
  );
  assert.equal(settle.amountMinor, balance);
  // Saldado, ya no cabe nada más.
  assert.equal(
    codeOf(() =>
      decideTreatmentPayment(
        { treatment: treatment({ paidMinor: 1_000_000 }), encounter: null },
        treatmentCommand({ input: input({ amountMinor: 1 }) }),
      ),
    ),
    'PAYMENT_EXCEEDS_BALANCE',
  );
});

test('el tratamiento debe existir, tener presupuesto y no estar rechazado ni cancelado', () => {
  const decide = (context) =>
    codeOf(() => decideTreatmentPayment(context, treatmentCommand()));
  assert.equal(decide({ treatment: null, encounter: null }), 'TREATMENT_NOT_FOUND');
  assert.equal(
    decide({ treatment: treatment({ agreedPriceMinor: null, currency: null }), encounter: null }),
    'TREATMENT_WITHOUT_BUDGET',
  );
  for (const status of ['DECLINED', 'CANCELED']) {
    assert.equal(decide({ treatment: treatment({ status }), encounter: null }), 'TREATMENT_NOT_PAYABLE', status);
  }
  // Un tratamiento finalizado con saldo pendiente sigue admitiendo abonos.
  for (const status of ['PROPOSED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']) {
    assert.equal(decide({ treatment: treatment({ status }), encounter: null }), null, status);
  }
});

test('la moneda sale del tratamiento y no puede contradecirlo', () => {
  const ctx = { treatment: treatment(), encounter: null };
  assert.equal(
    codeOf(() => decideTreatmentPayment(ctx, treatmentCommand({ input: input({ currency: 'USD' }) }))),
    'PAYMENT_CURRENCY_MISMATCH',
  );
  const same = decideTreatmentPayment(ctx, treatmentCommand({ input: input({ currency: 'BOB' }) }));
  assert.equal(same.currency, 'BOB');
});

test('la sucursal se resuelve sin adivinar entre varias', () => {
  assert.equal(resolveBranch(undefined, [branch]), branch);
  assert.equal(resolveBranch(otherBranch, [branch, otherBranch]), otherBranch);
  assert.equal(codeOf(() => resolveBranch(undefined, [branch, otherBranch])), 'BRANCH_REQUIRED');
  assert.equal(codeOf(() => resolveBranch(undefined, [])), 'BRANCH_REQUIRED');
  assert.equal(codeOf(() => resolveBranch(otherBranch, [branch])), 'BRANCH_FORBIDDEN');
});

test('la fecha del pago puede ser pasada pero no futura', () => {
  const ctx = { treatment: treatment(), encounter: null };
  const at = (paidAt) =>
    codeOf(() => decideTreatmentPayment(ctx, treatmentCommand({ input: input({ paidAt }) })));
  assert.equal(at(new Date('2026-11-01T10:00:00.000Z')), null);
  assert.equal(at(new Date(now.getTime() + 60_000)), null, 'tolera desfase de reloj');
  assert.equal(at(new Date(now.getTime() + 10 * 60_000)), 'INVALID_PAID_AT');
  assert.equal(at(new Date('no es fecha')), 'INVALID_PAID_AT');
});

test('referencia y notas se recortan y el vacío es null', () => {
  const insert = decideTreatmentPayment(
    { treatment: treatment(), encounter: null },
    treatmentCommand({ input: input({ reference: '  QR-123  ', notes: '   ' }) }),
  );
  assert.equal(insert.reference, 'QR-123');
  assert.equal(insert.notes, null);
});

test('el pago de una atención reduce el tratamiento de la atención y hereda su sucursal y cita', () => {
  const insert = decideEncounterPayment(
    { treatment: treatment(), encounter: encounter() },
    encounterCommand(),
  );
  assert.equal(insert.clinicalEncounterId, 'encounter-1');
  assert.equal(insert.appointmentId, 'appointment-1');
  assert.equal(insert.branchId, branch);
  assert.equal(insert.treatmentId, 'treatment-1');
  assert.equal(insert.currency, 'BOB');
});

test('una atención admite un solo pago vigente y no una atención anulada', () => {
  const decide = (overrides) =>
    codeOf(() =>
      decideEncounterPayment({ treatment: treatment(), encounter: encounter(overrides) }, encounterCommand()),
    );
  assert.equal(decide({ activePaymentId: 'payment-1' }), 'ENCOUNTER_ALREADY_PAID');
  assert.equal(decide({ status: 'VOIDED' }), 'ENCOUNTER_VOIDED');
  assert.equal(decide({ status: 'IN_PROGRESS' }), null, 'se puede cobrar al cerrar o antes');
  assert.equal(
    codeOf(() => decideEncounterPayment({ treatment: treatment(), encounter: null }, encounterCommand())),
    'ENCOUNTER_NOT_FOUND',
  );
});

test('la atención debe ser de una sucursal autorizada', () => {
  assert.equal(
    codeOf(() =>
      decideEncounterPayment(
        { treatment: treatment(), encounter: encounter({ branchId: otherBranch }) },
        encounterCommand(),
      ),
    ),
    'BRANCH_FORBIDDEN',
  );
});

test('en el pago de una atención se puede elegir otro tratamiento', () => {
  const other = treatment({ id: 'treatment-2', currency: 'BOB', agreedPriceMinor: 50_000 });
  const insert = decideEncounterPayment(
    { treatment: other, encounter: encounter() },
    encounterCommand({ requestedTreatmentId: 'treatment-2' }),
  );
  assert.equal(insert.treatmentId, 'treatment-2');
  // El tope es el saldo del tratamiento elegido, no el de la atención.
  assert.equal(
    codeOf(() =>
      decideEncounterPayment(
        { treatment: other, encounter: encounter() },
        encounterCommand({ requestedTreatmentId: 'treatment-2', input: input({ amountMinor: 50_001 }) }),
      ),
    ),
    'PAYMENT_EXCEEDS_BALANCE',
  );
  // Pedido y no encontrado: no se cae en un cobro suelto.
  assert.equal(
    codeOf(() =>
      decideEncounterPayment(
        { treatment: null, encounter: encounter() },
        encounterCommand({ requestedTreatmentId: 'treatment-x' }),
      ),
    ),
    'TREATMENT_NOT_FOUND',
  );
});

test('una atención sin tratamiento admite un cobro suelto con moneda explícita', () => {
  const free = encounter({ treatmentId: null });
  assert.equal(
    codeOf(() => decideEncounterPayment({ treatment: null, encounter: free }, encounterCommand())),
    'PAYMENT_CURRENCY_REQUIRED',
  );
  const insert = decideEncounterPayment(
    { treatment: null, encounter: free },
    encounterCommand({ input: input({ currency: 'BOB' }) }),
  );
  assert.equal(insert.treatmentId, null);
  assert.equal(insert.currency, 'BOB');
  assert.equal(insert.clinicalEncounterId, 'encounter-1');
});

const payment = (id, minutes, amountMinor, status = 'COMPLETED') => ({
  id,
  amountMinor,
  status,
  paidAt: new Date(now.getTime() + minutes * 60_000),
  createdAt: new Date(now.getTime() + minutes * 60_000),
});

test('el estado de cuenta acumula el saldo por pago y deja fuera los anulados', () => {
  const account = buildAccount(treatment(), [
    payment('c', 30, 35_000),
    payment('a', 0, 20_000),
    payment('v', 10, 99_999, 'VOIDED'),
  ]);
  assert.deepEqual(
    account.movements.map((m) => [m.payment.id, m.runningBalanceMinor]),
    [
      ['a', 980_000],
      ['v', null],
      ['c', 945_000],
    ],
  );
  assert.equal(account.treatment.paidMinor, 55_000);
  assert.equal(account.balanceMinor, 945_000);
});

test('sin presupuesto no hay saldo, pero sí lo recibido', () => {
  const account = buildAccount(treatment({ agreedPriceMinor: null, currency: null }), [
    payment('a', 0, 20_000),
  ]);
  assert.equal(account.balanceMinor, null);
  assert.equal(account.movements[0].runningBalanceMinor, null);
  assert.equal(account.treatment.paidMinor, 20_000);
  assert.deepEqual(buildAccount(treatment(), []).movements, []);
  assert.equal(buildAccount(treatment(), []).balanceMinor, 1_000_000);
});

test('anular exige un motivo', () => {
  assert.equal(requireVoidReason('  Error de digitación  '), 'Error de digitación');
  for (const reason of ['', '   ', null, undefined]) {
    assert.equal(codeOf(() => requireVoidReason(reason)), 'VOID_REASON_REQUIRED', String(reason));
  }
});

// ---- Propuesta de cobro de una atención --------------------------------
const billing = (overrides = {}) => ({
  encounter: encounter(),
  procedureCount: 2,
  procedurePrices: [
    { priceMinor: 15_000, currency: 'BOB' },
    { priceMinor: 5_000, currency: 'BOB' },
  ],
  treatments: [treatment()],
  ...overrides,
});

test('la propuesta suma los precios de los procedimientos y los acota al saldo', () => {
  const proposal = buildPaymentProposal(billing());
  assert.equal(proposal.collectable, true);
  assert.equal(proposal.proceduresTotalMinor, 20_000);
  assert.equal(proposal.currency, 'BOB');
  assert.equal(proposal.pricedProcedureCount, 2);
  assert.equal(proposal.suggestedTreatmentId, 'treatment-1');
  assert.equal(proposal.suggestedAmountMinor, 20_000);

  // Con poco saldo pendiente, la propuesta no supera lo que aún se debe.
  const nearlyPaid = buildPaymentProposal(
    billing({ treatments: [treatment({ paidMinor: 990_000 })] }),
  );
  assert.equal(nearlyPaid.proceduresTotalMinor, 20_000);
  assert.equal(nearlyPaid.suggestedAmountMinor, 10_000);
  assert.equal(nearlyPaid.treatments[0].balanceMinor, 10_000);
});

test('sin precios no hay monto propuesto, pero se sabe qué se hizo', () => {
  const proposal = buildPaymentProposal(billing({ procedurePrices: [], procedureCount: 3 }));
  assert.equal(proposal.proceduresTotalMinor, null);
  assert.equal(proposal.currency, null);
  assert.equal(proposal.procedureCount, 3);
  assert.equal(proposal.suggestedAmountMinor, null);

  const zero = buildPaymentProposal(
    billing({ procedurePrices: [{ priceMinor: 0, currency: 'BOB' }] }),
  );
  assert.equal(zero.proceduresTotalMinor, 0);
  assert.equal(zero.suggestedAmountMinor, null, 'un monto de cero no es cobrable');
});

test('una atención pagada o anulada no tiene cobro pendiente', () => {
  const paid = buildPaymentProposal(
    billing({ encounter: encounter({ activePaymentId: 'payment-1' }) }),
  );
  assert.equal(paid.collectable, false);
  assert.equal(paid.activePaymentId, 'payment-1');
  assert.equal(paid.suggestedAmountMinor, null);
  const voided = buildPaymentProposal(
    billing({ encounter: encounter({ status: 'VOIDED' }) }),
  );
  assert.equal(voided.collectable, false);
  assert.equal(voided.suggestedAmountMinor, null);
});

test('un tratamiento saldado, sin presupuesto o cancelado no se propone', () => {
  const settled = buildPaymentProposal(
    billing({ treatments: [treatment({ paidMinor: 1_000_000 })] }),
  );
  assert.equal(settled.treatments[0].balanceMinor, 0);
  assert.equal(settled.suggestedAmountMinor, null);

  for (const overrides of [
    { agreedPriceMinor: null, currency: null },
    { status: 'CANCELED' },
    { status: 'DECLINED' },
  ]) {
    const proposal = buildPaymentProposal(billing({ treatments: [treatment(overrides)] }));
    assert.equal(proposal.treatments[0].payable, false, JSON.stringify(overrides));
    assert.equal(proposal.suggestedTreatmentId, null);
    assert.equal(proposal.suggestedAmountMinor, null);
  }
});

test('una moneda distinta a la del tratamiento no se propone', () => {
  const proposal = buildPaymentProposal(
    billing({ treatments: [treatment({ currency: 'USD' })] }),
  );
  assert.equal(proposal.treatments[0].suggestedAmountMinor, null);
  assert.equal(proposal.suggestedAmountMinor, null);
});

test('con procedimientos de varios tratamientos el tratamiento se elige al cobrar', () => {
  const a = treatment({ id: 'a', title: 'Ortodoncia' });
  const b = treatment({ id: 'b', title: 'Endodoncia', agreedPriceMinor: 12_000, paidMinor: 4_000 });
  const proposal = buildPaymentProposal(
    billing({ encounter: encounter({ treatmentId: null }), treatments: [b, a] }),
  );
  assert.deepEqual(proposal.treatments.map((x) => x.id), ['a', 'b']);
  assert.equal(proposal.suggestedTreatmentId, null);
  assert.equal(proposal.suggestedAmountMinor, null, 'hay que elegir tratamiento');
  assert.equal(proposal.treatments[0].suggestedAmountMinor, 20_000);
  assert.equal(proposal.treatments[1].suggestedAmountMinor, 8_000, 'acotado a su saldo');

  // Si la atención ya apunta a un tratamiento, ese es el sugerido y va primero.
  const own = buildPaymentProposal(
    billing({ encounter: encounter({ treatmentId: 'b' }), treatments: [a, b] }),
  );
  assert.deepEqual(own.treatments.map((x) => x.id), ['b', 'a']);
  assert.equal(own.suggestedTreatmentId, 'b');
  assert.equal(own.suggestedAmountMinor, 8_000);
});

test('un único tratamiento cobrable entre los de los procedimientos se sugiere solo', () => {
  const proposal = buildPaymentProposal(
    billing({
      encounter: encounter({ treatmentId: null }),
      treatments: [treatment({ id: 'a' }), treatment({ id: 'b', status: 'CANCELED' })],
    }),
  );
  assert.equal(proposal.suggestedTreatmentId, 'a');
  assert.equal(proposal.suggestedAmountMinor, 20_000);
});

test('sin tratamiento es un cobro suelto por el total realizado', () => {
  const proposal = buildPaymentProposal(
    billing({ encounter: encounter({ treatmentId: null }), treatments: [] }),
  );
  assert.equal(proposal.suggestedTreatmentId, null);
  assert.equal(proposal.suggestedAmountMinor, 20_000);
  assert.equal(proposal.currency, 'BOB');
});
