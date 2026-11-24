import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SignJWT } from 'jose';

const PERMISSIONS = [
  'dentistry:treatments:read',
  'dentistry:treatments:create',
  'dentistry:treatments:update',
  'dentistry:payments:read',
  'dentistry:payments:create',
  'dentistry:payments:void',
  'dentistry:encounters:read',
  'dentistry:encounters:create',
  'dentistry:encounters:update',
  'dentistry:encounters:void',
];

/**
 * Recorrido del caso del cliente (ortodoncia de 10 000 Bs) por los tres
 * módulos a la vez: tratamientos, atenciones y pagos comparten una sola
 * persistencia en memoria. Es la prueba de punta a punta posible sin una base
 * real; las consultas Prisma y los bloqueos no se ejercitan aquí.
 */
test(
  'ortodoncia: presupuesto, anticipo, abonos por atención, prórroga, anulación y saldo',
  { timeout: 240_000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'billing-flow-'));
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const keyPath = join(directory, 'public.pem');
    writeFileSync(keyPath, publicKey.export({ type: 'spki', format: 'pem' }));
    let app;
    let db;
    t.after(async () => {
      try {
        await app?.close();
        await db?.close();
      } finally {
        unlinkSync(keyPath);
        rmdirSync(directory);
      }
    });
    // Nunca usar una conexión desplegada ni credenciales al importar providers.
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://isolated:isolated@127.0.0.1:1/never_connect',
      FRONTEND_URL: 'http://127.0.0.1:3000',
      JWT_PUBLIC_KEY_PATH: keyPath,
      JWT_ISSUER: 'billing-flow-tests',
      JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
    });
    const { TreatmentModule } = await import('../dist/modules/treatment/treatment.module.js');
    const { TreatmentRepository } = await import('../dist/modules/treatment/domain/repositories/treatment.repository.js');
    const { PaymentModule } = await import('../dist/modules/payment/payment.module.js');
    const { PaymentRepository } = await import('../dist/modules/payment/domain/repositories/payment.repository.js');
    const { ClinicalEncounterModule } = await import('../dist/modules/clinical-encounter/clinical-encounter.module.js');
    const { ClinicalEncounterRepository } = await import(
      '../dist/modules/clinical-encounter/domain/repositories/clinical-encounter.repository.js'
    );
    const { PatientHealthProfileRepository } = await import(
      '../dist/modules/clinical-encounter/domain/repositories/patient-health-profile.repository.js'
    );
    const { ClinicalErrors } = await import('../dist/modules/clinical-encounter/application/clinical-encounter.errors.js');
    const { PatientRepository } = await import('../dist/modules/patient/domain/repositories/patient.repository.js');
    const { DentistryAuthModule } = await import('../dist/modules/auth/dentistry-auth.module.js');
    const { createPaginatedResult } = await import('../dist/common/pagination/pagination.js');
    const { PlanEntitlementsReader } = await import('../dist/modules/auth/application/ports/plan-entitlements.reader.js');
    const { parsePlanEntitlements } = await import('../dist/modules/auth/application/contracts/plan-entitlements.js');
    ({ db } = await import('../dist/prisma/db.js'));

    // Plan estándar del cliente con tratamientos activados.
    const plan = parsePlanEntitlements({
      schemaVersion: 1,
      limits: { patients: 300, members: 2, branches: 1 },
      features: {
        clinicalHistory: true,
        appointments: true,
        procedureNotes: true,
        payments: true,
        treatments: true,
      },
    });

    const branchId = randomUUID();
    const principal = {
      sub: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      branchIds: [branchId],
      permissions: PERMISSIONS,
    };
    const patient = { id: randomUUID(), organizationId: principal.organizationId, deletedAt: null };
    const patientRepository = {
      async findById(id, organizationId) {
        return id === patient.id && organizationId === patient.organizationId ? patient : null;
      },
    };

    // ---- Una sola persistencia para los tres módulos ----------------------
    const treatments = new Map();
    const encounters = new Map();
    const payments = [];
    let clock = 0;
    const inScope = (row, scope) =>
      row && row.organizationId === scope.organizationId && row.patientId === scope.patientId;
    const paidOf = (id) =>
      payments
        .filter((p) => p.treatmentId === id && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amountMinor, 0);
    const withBalance = (row) => {
      const paidMinor = paidOf(row.id);
      return {
        ...row,
        paidMinor,
        balanceMinor: row.agreedPriceMinor === null ? null : row.agreedPriceMinor - paidMinor,
      };
    };
    const snapshot = (row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      agreedPriceMinor: row.agreedPriceMinor,
      currency: row.currency,
      paidMinor: paidOf(row.id),
    });
    const activePayment = (encounterId) =>
      payments.find((p) => p.clinicalEncounterId === encounterId && p.status === 'COMPLETED');

    const treatmentRepository = {
      async findPage(filters) {
        const items = [...treatments.values()].filter((row) => inScope(row, filters)).map(withBalance);
        const { page, pageSize } = filters;
        return createPaginatedResult(items, { page, pageSize, limit: pageSize }, items.length);
      },
      async findById(scope, id) {
        const row = treatments.get(id);
        return inScope(row, scope) ? withBalance(row) : null;
      },
      async serviceExists() {
        return false;
      },
      async create(data) {
        const row = {
          ...data,
          id: randomUUID(),
          serviceName: null,
          status: 'PROPOSED',
          startedAt: null,
          endedAt: null,
          updatedByMembershipId: null,
          createdAt: new Date(2026, 10, 23, 10, 0, clock++),
          updatedAt: new Date(),
        };
        treatments.set(row.id, row);
        return withBalance(row);
      },
      async update(scope, id, decide) {
        const row = treatments.get(id);
        if (!inScope(row, scope)) return null;
        const change = decide(withBalance(row));
        for (const [key, value] of Object.entries(change)) if (value !== undefined) row[key] = value;
        return withBalance(row);
      },
    };

    const encounterRepository = {
      async findPage(filters) {
        const items = [...encounters.values()].filter((row) => inScope(row, filters));
        return createPaginatedResult(items, { page: 1, pageSize: 20 }, items.length);
      },
      async findById(scope, id) {
        const row = encounters.get(id);
        return inScope(row, scope) ? structuredClone(row) : null;
      },
      async create(data) {
        const row = {
          ...data,
          id: randomUUID(),
          branchName: 'Sucursal Centro',
          practitionerName: 'Dra. Prueba',
          endedAt: null,
          status: 'IN_PROGRESS',
          completedAt: null,
          completedByMembershipId: null,
          completedByName: null,
          voidedAt: null,
          voidedByMembershipId: null,
          voidReason: null,
          rowVersion: 1,
          procedures: [],
        };
        encounters.set(row.id, row);
        return structuredClone(row);
      },
      async createCompletedWithProcedures() {
        throw new Error('no se usa en este recorrido');
      },
      async transition(scope, id, expectedRowVersion, change) {
        const row = encounters.get(id);
        if (!inScope(row, scope) || row.rowVersion !== expectedRowVersion) return null;
        Object.assign(row, change, { rowVersion: expectedRowVersion + 1 });
        return structuredClone(row);
      },
      async voidUnpaid(scope, id, expectedRowVersion, change) {
        if (activePayment(id)) throw ClinicalErrors.hasPayment();
        return this.transition(scope, id, expectedRowVersion, change);
      },
      async addProcedures(scope, id, expectedRowVersion, drafts, actor) {
        const row = encounters.get(id);
        if (!inScope(row, scope) || row.status !== 'IN_PROGRESS' || row.rowVersion !== expectedRowVersion) {
          return null;
        }
        row.rowVersion++;
        const created = drafts.map((draft) => ({
          ...draft,
          id: randomUUID(),
          clinicalEncounterId: id,
          status: 'RECORDED',
          voidedAt: null,
          voidedByMembershipId: null,
          voidReason: null,
          createdByMembershipId: actor,
        }));
        row.procedures.push(...created);
        return structuredClone(created);
      },
      async findAppointment() {
        return null;
      },
      async treatmentExists(scope, id) {
        return inScope(treatments.get(id), scope);
      },
      async findTreatmentProcedures() {
        return [];
      },
      async getReferenceData() {
        throw new Error('no se usa en este recorrido');
      },
    };

    const paymentRepository = {
      async findPage(filters) {
        const items = payments.filter((p) => inScope(p, filters));
        const { page, pageSize } = filters;
        return createPaginatedResult(items, { page, pageSize, limit: pageSize }, items.length);
      },
      async findById(scope, id) {
        const row = payments.find((p) => p.id === id);
        return inScope(row, scope) ? { ...row } : null;
      },
      async findActiveByEncounter(scope, encounterId) {
        const row = activePayment(encounterId);
        return inScope(row, scope) ? { ...row } : null;
      },
      async findEncounterBilling(scope, encounterId) {
        const row = encounters.get(encounterId);
        if (!inScope(row, scope)) return null;
        const procedures = row.procedures.filter((p) => p.status === 'RECORDED');
        const treatmentRow = row.treatmentId ? treatments.get(row.treatmentId) : null;
        return {
          encounter: { ...row, activePaymentId: activePayment(row.id)?.id ?? null },
          procedureCount: procedures.length,
          procedurePrices: procedures
            .filter((p) => p.priceMinor !== null)
            .map((p) => ({ priceMinor: p.priceMinor, currency: p.currency })),
          treatments: inScope(treatmentRow, scope) ? [snapshot(treatmentRow)] : [],
        };
      },
      async findAccount(scope, treatmentId) {
        const row = treatments.get(treatmentId);
        if (!inScope(row, scope)) return null;
        return {
          treatment: snapshot(row),
          payments: payments.filter((p) => p.treatmentId === treatmentId).map((p) => ({ ...p })),
        };
      },
      async register(request, decide) {
        const scope = { organizationId: request.organizationId, patientId: request.patientId };
        const encounterRow = request.encounterId ? encounters.get(request.encounterId) : null;
        const encounter = inScope(encounterRow, scope)
          ? { ...encounterRow, activePaymentId: activePayment(encounterRow.id)?.id ?? null }
          : null;
        const treatmentId = request.treatmentId ?? encounter?.treatmentId ?? null;
        const treatmentRow = treatmentId ? treatments.get(treatmentId) : null;
        const treatment = inScope(treatmentRow, scope) ? snapshot(treatmentRow) : null;
        const insert = decide({ treatment, encounter });
        const row = {
          ...insert,
          id: randomUUID(),
          status: 'COMPLETED',
          voidedAt: null,
          voidedByMembershipId: null,
          voidReason: null,
          createdAt: new Date(2026, 10, 23, 11, 0, clock++),
          updatedAt: new Date(),
        };
        payments.push(row);
        return { ...row };
      },
      async void(scope, id, data) {
        const row = payments.find((p) => p.id === id);
        if (!inScope(row, scope) || row.status !== 'COMPLETED') return null;
        Object.assign(row, { status: 'VOIDED', ...data });
        return { ...row };
      },
    };

    const profileRepository = { async find() { return null; } };

    const replacements = new Map([
      [TreatmentRepository, treatmentRepository],
      [PaymentRepository, paymentRepository],
      [ClinicalEncounterRepository, encounterRepository],
      [PatientHealthProfileRepository, profileRepository],
      [PatientRepository, patientRepository],
    ]);
    const withFakes = (providers) =>
      providers.map((provider) =>
        replacements.has(provider.provide)
          ? { provide: provider.provide, useValue: replacements.get(provider.provide) }
          : provider,
      );
    const modules = [TreatmentModule, PaymentModule, ClinicalEncounterModule];
    class BillingFlowTestModule {}
    Module({
      imports: [DentistryAuthModule],
      controllers: modules.flatMap((module) => Reflect.getMetadata('controllers', module)),
      providers: [
        ...withFakes(modules.flatMap((module) => Reflect.getMetadata('providers', module))),
        { provide: PatientRepository, useValue: patientRepository },
        { provide: PlanEntitlementsReader, useValue: { read: async () => plan } },
      ],
    })(BillingFlowTestModule);
    app = await NestFactory.create(BillingFlowTestModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();

    const now = Math.floor(Date.now() / 1000);
    const accessToken = await new SignJWT({ ...principal })
      .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'billing-flow-test' })
      .setIssuer(process.env.JWT_ISSUER)
      .setAudience('dentistry-api')
      .setIssuedAt(now - 120)
      .setExpirationTime(now + 600)
      .setJti(randomUUID())
      .sign(privateKey);
    async function call(path, method = 'GET', body) {
      const response = await fetch(baseUrl + path, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    }
    const base = `/patients/${patient.id}`;
    const cash = (amountMinor, extra = {}) => ({ amountMinor, paymentMethod: 'CASH', ...extra });

    async function balanceOf(treatmentId) {
      const response = await call(`${base}/treatments/${treatmentId}`);
      assert.equal(response.status, 200);
      return response.body.balanceMinor;
    }
    /** Una atención con procedimientos con precio, ya completada. */
    async function completedVisit(treatmentId, startedAt, prices) {
      const opened = await call(`${base}/clinical-encounters`, 'POST', {
        patientId: patient.id,
        branchId,
        startedAt,
        treatmentId,
      });
      assert.equal(opened.status, 201);
      const id = opened.body.id;
      const added = await call(`${base}/clinical-encounters/${id}/procedures`, 'POST', {
        procedures: prices.map((priceMinor) => ({
          targetType: 'WHOLE_MOUTH',
          description: 'Control de ortodoncia',
          priceMinor,
          currency: 'BOB',
        })),
      });
      assert.equal(added.status, 201);
      const endedAt = new Date(Date.parse(startedAt) + 60 * 60 * 1000).toISOString();
      const completed = await call(`${base}/clinical-encounters/${id}/complete`, 'POST', { endedAt });
      assert.equal(completed.status, 200);
      return completed.body;
    }

    // 1. Presupuesto de 10 000 Bs.
    const created = await call(`${base}/treatments`, 'POST', {
      title: 'Ortodoncia',
      agreedPriceMinor: 1_000_000,
      currency: 'BOB',
    });
    assert.equal(created.status, 201);
    const treatmentId = created.body.id;
    assert.equal(created.body.balanceMinor, 1_000_000);

    // 2. Anticipo de 200 Bs, sin atención.
    const advance = await call(`${base}/treatments/${treatmentId}/payments`, 'POST', cash(20_000));
    assert.equal(advance.status, 201);
    assert.equal(advance.body.clinicalEncounterId, null);
    assert.equal(await balanceOf(treatmentId), 980_000);

    // 3. Primera visita: lo realizado suma 200 Bs; recepción cobra 120 Bs (lo recibido).
    const visit1 = await completedVisit(treatmentId, '2026-11-20T14:00:00.000Z', [15_000, 5_000]);
    assert.deepEqual(visit1.proceduresTotal, { amountMinor: 20_000, currency: 'BOB' });
    const proposal1 = await call(`${base}/clinical-encounters/${visit1.id}/payment-proposal`);
    assert.equal(proposal1.status, 200);
    assert.equal(proposal1.body.collectable, true);
    assert.equal(proposal1.body.suggestedTreatmentId, treatmentId);
    assert.equal(proposal1.body.suggestedAmountMinor, 20_000);
    assert.equal(await balanceOf(treatmentId), 980_000, 'proponer no mueve el saldo');

    const payment1 = await call(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', cash(12_000));
    assert.equal(payment1.status, 201);
    assert.equal(payment1.body.clinicalEncounterId, visit1.id);
    assert.equal(payment1.body.treatmentId, treatmentId);
    assert.equal(await balanceOf(treatmentId), 968_000, 'solo lo recibido baja el saldo');

    // La atención admite un solo pago vigente y no se anula mientras lo tenga.
    const duplicate = await call(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', cash(1_000));
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, 'ENCOUNTER_ALREADY_PAID');
    const blockedVoid = await call(`${base}/clinical-encounters/${visit1.id}/void`, 'POST', { reason: 'Duplicada' });
    assert.equal(blockedVoid.status, 409);
    assert.equal(blockedVoid.body.code, 'ENCOUNTER_HAS_PAYMENT');

    // 4. Segunda visita sin cobro: prórroga, el saldo no cambia.
    const visit2 = await completedVisit(treatmentId, '2026-11-21T14:00:00.000Z', [15_000]);
    const noPayment = await call(`${base}/clinical-encounters/${visit2.id}/payment`);
    assert.equal(noPayment.status, 404);
    assert.equal(await balanceOf(treatmentId), 968_000);
    const proposal2 = await call(`${base}/clinical-encounters/${visit2.id}/payment-proposal`);
    assert.equal(proposal2.body.collectable, true);
    assert.equal(proposal2.body.suggestedAmountMinor, 15_000);

    // 5. Estado de cuenta con el saldo tras cada pago.
    const account = await call(`${base}/treatments/${treatmentId}/account`);
    assert.equal(account.status, 200);
    assert.equal(account.body.paidMinor, 32_000);
    assert.equal(account.body.balanceMinor, 968_000);
    assert.deepEqual(
      account.body.movements.map((m) => [m.amountMinor, m.runningBalanceMinor]),
      [
        [20_000, 980_000],
        [12_000, 968_000],
      ],
    );

    // 6. Anular el pago devuelve el dinero al saldo y libera la atención.
    const noReason = await call(`${base}/payments/${payment1.body.id}/void`, 'POST', { reason: '  ' });
    assert.equal(noReason.status, 400);
    const voided = await call(`${base}/payments/${payment1.body.id}/void`, 'POST', { reason: 'Error de digitación' });
    assert.equal(voided.status, 200);
    assert.equal(voided.body.status, 'VOIDED');
    assert.equal(await balanceOf(treatmentId), 980_000);
    const reopened = await call(`${base}/clinical-encounters/${visit1.id}/payment-proposal`);
    assert.equal(reopened.body.collectable, true);
    assert.equal(reopened.body.activePaymentId, null);

    // 7. Ahora sí se cobra bien la primera visita y la prórroga de la segunda.
    assert.equal((await call(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', cash(20_000))).status, 201);
    assert.equal((await call(`${base}/clinical-encounters/${visit2.id}/payment`, 'POST', cash(15_000))).status, 201);
    assert.equal(await balanceOf(treatmentId), 945_000);

    // 8. Nunca se cobra más que el saldo; el saldo exacto lo deja en cero.
    const overpay = await call(`${base}/treatments/${treatmentId}/payments`, 'POST', cash(945_001));
    assert.equal(overpay.body.code, 'PAYMENT_EXCEEDS_BALANCE');
    assert.equal(await balanceOf(treatmentId), 945_000);
    assert.equal((await call(`${base}/treatments/${treatmentId}/payments`, 'POST', cash(945_000))).status, 201);
    assert.equal(await balanceOf(treatmentId), 0);
    const settled = await call(`${base}/treatments/${treatmentId}/payments`, 'POST', cash(1));
    assert.equal(settled.body.code, 'PAYMENT_EXCEEDS_BALANCE');

    // 9. Con el pago de la primera visita vigente no se anula la atención; sin pago, sí.
    assert.equal((await call(`${base}/clinical-encounters/${visit1.id}/void`, 'POST', { reason: 'Duplicada' })).status, 409);
    const paymentsList = await call(`${base}/payments?treatmentId=${treatmentId}`);
    const visit1Payment = paymentsList.body.items.find(
      (p) => p.clinicalEncounterId === visit1.id && p.status === 'COMPLETED',
    );
    assert.equal(
      (await call(`${base}/payments/${visit1Payment.id}/void`, 'POST', { reason: 'Atención duplicada' })).status,
      200,
    );
    const voidedVisit = await call(`${base}/clinical-encounters/${visit1.id}/void`, 'POST', { reason: 'Duplicada' });
    assert.equal(voidedVisit.status, 200);
    assert.equal(voidedVisit.body.status, 'VOIDED');
    assert.equal(await balanceOf(treatmentId), 20_000, 'el dinero del pago anulado vuelve al saldo');
    const afterVoid = await call(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', cash(20_000));
    assert.equal(afterVoid.body.code, 'ENCOUNTER_VOIDED', 'una atención anulada ya no admite cobros');
  },
);
