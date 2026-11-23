import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SignJWT } from 'jose';

const READ = 'dentistry:payments:read';
const CREATE = 'dentistry:payments:create';
const VOID = 'dentistry:payments:void';

test(
  'pagos aplican JWT, permisos, plan, alcance y reglas de saldo, 1:1 y anulación',
  { timeout: 60_000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'payment-http-'));
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
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
      JWT_ISSUER: 'payment-http-tests',
      JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
    });
    const { PaymentModule } = await import('../dist/modules/payment/payment.module.js');
    const { PaymentRepository } = await import(
      '../dist/modules/payment/domain/repositories/payment.repository.js'
    );
    const { PatientRepository } = await import(
      '../dist/modules/patient/domain/repositories/patient.repository.js'
    );
    const { DentistryAuthModule } = await import('../dist/modules/auth/dentistry-auth.module.js');
    const { createPaginatedResult } = await import('../dist/common/pagination/pagination.js');
    const { PlanEntitlementsReader } = await import(
      '../dist/modules/auth/application/ports/plan-entitlements.reader.js'
    );
    const { parsePlanEntitlements } = await import(
      '../dist/modules/auth/application/contracts/plan-entitlements.js'
    );
    ({ db } = await import('../dist/prisma/db.js'));

    const planWith = (features) =>
      parsePlanEntitlements({
        schemaVersion: 1,
        limits: { patients: 300, members: 2, branches: 1 },
        features,
      });
    // Plan estándar del cliente: pagos activos; tratamientos no hacen falta para cobrar.
    const WITH_PAYMENTS = { clinicalHistory: true, appointments: true, procedureNotes: true, payments: true };
    let currentPlan = planWith(WITH_PAYMENTS);

    const branchId = randomUUID();
    const otherBranchId = randomUUID();
    const principal = {
      sub: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      branchIds: [branchId],
      permissions: [READ, CREATE, VOID],
    };
    const otherOrganizationId = randomUUID();

    // ---- Pacientes -------------------------------------------------------
    const patients = new Map();
    const seedPatient = (organizationId) => {
      const row = { id: randomUUID(), organizationId, deletedAt: null };
      patients.set(row.id, row);
      return row;
    };
    const patient = seedPatient(principal.organizationId);
    const otherPatient = seedPatient(principal.organizationId);
    const foreignPatient = seedPatient(otherOrganizationId);
    const patientRepository = {
      async findById(id, organizationId) {
        const row = patients.get(id);
        return row?.organizationId === organizationId ? row : null;
      },
    };

    // ---- Tratamientos y atenciones sembrados -----------------------------
    const treatments = new Map();
    const seedTreatment = (overrides = {}) => {
      const row = {
        id: randomUUID(),
        organizationId: principal.organizationId,
        patientId: patient.id,
        title: 'Ortodoncia',
        status: 'IN_PROGRESS',
        agreedPriceMinor: 1_000_000, // 10 000 Bs
        currency: 'BOB',
        ...overrides,
      };
      treatments.set(row.id, row);
      return row;
    };
    const encounters = new Map();
    const seedEncounter = (overrides = {}) => {
      const row = {
        id: randomUUID(),
        organizationId: principal.organizationId,
        patientId: patient.id,
        branchId,
        appointmentId: randomUUID(),
        treatmentId: null,
        status: 'COMPLETED',
        ...overrides,
      };
      encounters.set(row.id, row);
      return row;
    };

    const ortho = seedTreatment();
    const noBudget = seedTreatment({ title: 'Evaluación', agreedPriceMinor: null, currency: null });
    const canceled = seedTreatment({ title: 'Cancelado', status: 'CANCELED' });
    const foreignTreatment = seedTreatment({ patientId: otherPatient.id });
    const visit1 = seedEncounter({ treatmentId: ortho.id });
    const visit2 = seedEncounter({ treatmentId: ortho.id });
    const loose = seedEncounter();
    const voidedVisit = seedEncounter({ status: 'VOIDED', treatmentId: ortho.id });
    const faraway = seedEncounter({ branchId: otherBranchId, treatmentId: ortho.id });

    // ---- Pagos en memoria ------------------------------------------------
    const payments = [];
    let clock = 0;
    const inScope = (row, scope) =>
      row && row.organizationId === scope.organizationId && row.patientId === scope.patientId;
    const paidOf = (treatmentId) =>
      payments
        .filter((p) => p.treatmentId === treatmentId && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amountMinor, 0);
    const snapshot = (row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      agreedPriceMinor: row.agreedPriceMinor,
      currency: row.currency,
      paidMinor: paidOf(row.id),
    });
    const paymentRepository = {
      async findPage(filters) {
        const items = payments
          .filter(
            (p) =>
              inScope(p, filters) &&
              filters.authorizedBranchIds.includes(p.branchId) &&
              (!filters.treatmentId || p.treatmentId === filters.treatmentId) &&
              (!filters.status || p.status === filters.status),
          )
          .sort((a, b) => b.paidAt - a.paidAt || b.id.localeCompare(a.id));
        const { page, pageSize } = filters;
        return createPaginatedResult(
          items.slice((page - 1) * pageSize, page * pageSize),
          { page, pageSize, limit: pageSize },
          items.length,
        );
      },
      async findById(scope, id) {
        const row = payments.find((p) => p.id === id);
        return inScope(row, scope) ? { ...row } : null;
      },
      async findActiveByEncounter(scope, encounterId) {
        const row = payments.find(
          (p) => inScope(p, scope) && p.clinicalEncounterId === encounterId && p.status === 'COMPLETED',
        );
        return row ? { ...row } : null;
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
        let encounter = null;
        if (request.encounterId) {
          const row = encounters.get(request.encounterId);
          if (inScope(row, scope)) {
            const active = payments.find(
              (p) => p.clinicalEncounterId === row.id && p.status === 'COMPLETED',
            );
            encounter = { ...row, activePaymentId: active?.id ?? null };
          }
        }
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
          createdAt: new Date(2026, 10, 23, 10, 0, clock++),
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

    // Conserva el wiring real de controlador, casos de uso y guards;
    // solo sustituye la persistencia.
    const replacements = new Map([[PaymentRepository, paymentRepository]]);
    const withFakes = (providers) =>
      providers.map((provider) =>
        replacements.has(provider.provide)
          ? { provide: provider.provide, useValue: replacements.get(provider.provide) }
          : provider,
      );
    class PaymentHttpTestModule {}
    Module({
      imports: [DentistryAuthModule],
      controllers: [...Reflect.getMetadata('controllers', PaymentModule)],
      providers: [
        ...withFakes(Reflect.getMetadata('providers', PaymentModule)),
        { provide: PatientRepository, useValue: patientRepository },
        { provide: PlanEntitlementsReader, useValue: { read: async () => currentPlan } },
      ],
    })(PaymentHttpTestModule);
    app = await NestFactory.create(PaymentHttpTestModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();

    async function token(overrides = {}) {
      const now = Math.floor(Date.now() / 1000);
      return new SignJWT({ ...principal, ...overrides })
        .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'payment-test' })
        .setIssuer(process.env.JWT_ISSUER)
        .setAudience('dentistry-api')
        .setIssuedAt(now - 120)
        .setExpirationTime(now + 300)
        .setJti(randomUUID())
        .sign(privateKey);
    }
    async function request(path, method = 'GET', accessToken, body) {
      const response = await fetch(baseUrl + path, {
        method,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    }
    const base = `/patients/${patient.id}`;
    const owner = await token();
    const cash = (amountMinor, overrides = {}) => ({ amountMinor, paymentMethod: 'CASH', ...overrides });

    await t.test('cada ruta exige token y su permiso exacto', async () => {
      const someId = randomUUID();
      const routes = [
        [`${base}/payments`, 'GET', READ],
        [`${base}/payments/${someId}`, 'GET', READ],
        [`${base}/payments/${someId}/void`, 'POST', VOID, { reason: 'x' }],
        [`${base}/treatments/${someId}/account`, 'GET', READ],
        // Cuerpos inválidos a propósito: con el permiso correcto responden 400 y no crean nada.
        [`${base}/treatments/${someId}/payments`, 'POST', CREATE, { amountMinor: 0 }],
        [`${base}/clinical-encounters/${someId}/payment`, 'GET', READ],
        [`${base}/clinical-encounters/${someId}/payment`, 'POST', CREATE, { amountMinor: 0 }],
      ];
      for (const [path, method, permission, body] of routes) {
        assert.equal((await request(path, method, undefined, body)).status, 401, `${method} ${path} sin token`);
        const others = [READ, CREATE, VOID].filter((p) => p !== permission);
        const denied = await request(path, method, await token({ permissions: others }), body);
        assert.equal(denied.status, 403, `${method} ${path} sin ${permission}`);
        const allowed = await request(path, method, await token({ permissions: [permission] }), body);
        assert.notEqual(allowed.status, 403, `${method} ${path} con ${permission}`);
        assert.notEqual(allowed.status, 401);
      }
      assert.equal(payments.length, 0, 'ninguna ruta de prueba creó pagos');
    });

    await t.test('sin la función payments en el plan responde MODULE_NOT_IN_PLAN', async (st) => {
      st.after(() => { currentPlan = planWith(WITH_PAYMENTS); });
      currentPlan = planWith({ ...WITH_PAYMENTS, payments: false });
      const blocked = await request(`${base}/payments`, 'GET', owner);
      assert.equal(blocked.status, 403);
      assert.equal(blocked.body.code, 'MODULE_NOT_IN_PLAN');
      assert.equal(blocked.body.module, 'payments');
      const post = await request(`${base}/treatments/${ortho.id}/payments`, 'POST', owner, cash(20_000));
      assert.equal(post.status, 403);
      assert.equal(payments.length, 0);
    });

    let advance;
    await t.test('anticipo de 200 Bs sobre el presupuesto de 10 000 Bs', async () => {
      const response = await request(`${base}/treatments/${ortho.id}/payments`, 'POST', owner, cash(20_000, {
        reference: '  Recibo 001  ',
      }));
      assert.equal(response.status, 201);
      advance = response.body;
      assert.equal(advance.amountMinor, 20_000);
      assert.equal(advance.currency, 'BOB', 'la moneda sale del tratamiento');
      assert.equal(advance.treatmentId, ortho.id);
      assert.equal(advance.clinicalEncounterId, null);
      assert.equal(advance.branchId, branchId, 'única sucursal del usuario');
      assert.equal(advance.status, 'COMPLETED');
      assert.equal(advance.reference, 'Recibo 001');
      assert.equal(advance.receivedByMembershipId, principal.membershipId);

      const account = await request(`${base}/treatments/${ortho.id}/account`, 'GET', owner);
      assert.equal(account.status, 200);
      assert.equal(account.body.treatment.agreedPriceMinor, 1_000_000);
      assert.equal(account.body.paidMinor, 20_000);
      assert.equal(account.body.balanceMinor, 980_000);
      assert.equal(account.body.movements.length, 1);
      assert.equal(account.body.movements[0].runningBalanceMinor, 980_000);
    });

    let visit1Payment;
    await t.test('el abono de una atención lleva su sucursal y su cita y reduce el tratamiento', async () => {
      const response = await request(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', owner, {
        amountMinor: 20_000,
        paymentMethod: 'QR',
      });
      assert.equal(response.status, 201);
      visit1Payment = response.body;
      assert.equal(visit1Payment.clinicalEncounterId, visit1.id);
      assert.equal(visit1Payment.appointmentId, visit1.appointmentId);
      assert.equal(visit1Payment.treatmentId, ortho.id, 'por defecto, el de la atención');
      assert.equal(visit1Payment.branchId, branchId);
      assert.equal(visit1Payment.paymentMethod, 'QR');

      const account = await request(`${base}/treatments/${ortho.id}/account`, 'GET', owner);
      assert.equal(account.body.balanceMinor, 960_000);
      assert.deepEqual(
        account.body.movements.map((m) => m.runningBalanceMinor),
        [980_000, 960_000],
      );
    });

    await t.test('una atención admite un solo pago: el segundo se rechaza', async () => {
      const again = await request(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', owner, cash(5_000));
      assert.equal(again.status, 409);
      assert.equal(again.body.code, 'ENCOUNTER_ALREADY_PAID');
      assert.equal(payments.filter((p) => p.clinicalEncounterId === visit1.id).length, 1);

      const current = await request(`${base}/clinical-encounters/${visit1.id}/payment`, 'GET', owner);
      assert.equal(current.status, 200);
      assert.equal(current.body.id, visit1Payment.id);
    });

    await t.test('una atención sin pago es una prórroga: no hay fila ni cambia el saldo', async () => {
      const none = await request(`${base}/clinical-encounters/${visit2.id}/payment`, 'GET', owner);
      assert.equal(none.status, 404);
      assert.equal(none.body.code, 'PAYMENT_NOT_FOUND');
      const account = await request(`${base}/treatments/${ortho.id}/account`, 'GET', owner);
      assert.equal(account.body.balanceMinor, 960_000);
    });

    await t.test('se rechazan importes, monedas y tratamientos inválidos', async () => {
      const path = `${base}/treatments/${ortho.id}/payments`;
      const before = payments.length;
      const bad = [
        [cash(0), 400],
        [cash(-5), 400],
        [cash(10.5), 400],
        [{ amountMinor: 100 }, 400, undefined], // sin medio de pago
        [cash(100, { paymentMethod: 'BITCOIN' }), 400],
        [cash(100, { currency: 'BOLIVIANOS' }), 400],
        [cash(100, { currency: 'usd' }), 400, 'PAYMENT_CURRENCY_MISMATCH'],
        [cash(100, { paidAt: 'ayer' }), 400],
        [cash(100, { paidAt: '2099-01-01T00:00:00.000Z' }), 400, 'INVALID_PAID_AT'],
        [cash(100, { branchId: otherBranchId }), 403, 'BRANCH_FORBIDDEN'],
      ];
      for (const [body, status, code] of bad) {
        const response = await request(path, 'POST', owner, body);
        assert.equal(response.status, status, JSON.stringify(body));
        if (code) assert.equal(response.body.code, code, JSON.stringify(body));
      }
      assert.equal(payments.length, before, 'ninguno se guardó');
    });

    await t.test('el tratamiento debe existir, ser del paciente, tener presupuesto y estar vigente', async () => {
      const pay = (treatmentId, patientId = patient.id) =>
        request(`/patients/${patientId}/treatments/${treatmentId}/payments`, 'POST', owner, cash(100));
      const missing = await pay(randomUUID());
      assert.equal(missing.status, 404);
      assert.equal(missing.body.code, 'TREATMENT_NOT_FOUND');
      assert.equal((await pay(foreignTreatment.id)).status, 404, 'tratamiento de otro paciente');
      const withoutBudget = await pay(noBudget.id);
      assert.equal(withoutBudget.status, 409);
      assert.equal(withoutBudget.body.code, 'TREATMENT_WITHOUT_BUDGET');
      const notPayable = await pay(canceled.id);
      assert.equal(notPayable.status, 409);
      assert.equal(notPayable.body.code, 'TREATMENT_NOT_PAYABLE');
    });

    await t.test('el paciente debe ser de la organización de la sesión', async () => {
      const foreign = await request(
        `/patients/${foreignPatient.id}/treatments/${ortho.id}/payments`, 'POST', owner, cash(100),
      );
      assert.equal(foreign.status, 404);
      assert.equal(foreign.body.code, 'PATIENT_NOT_FOUND');
      assert.equal((await request(`/patients/${foreignPatient.id}/payments`, 'GET', owner)).status, 404);
      assert.equal((await request(`/patients/${randomUUID()}/payments`, 'GET', owner)).status, 404);
      assert.equal((await request('/patients/no-es-uuid/payments', 'GET', owner)).status, 400);
    });

    await t.test('nunca se cobra más que el saldo y el saldo exacto lo deja en cero', async () => {
      const path = `${base}/treatments/${ortho.id}/payments`;
      const tooMuch = await request(path, 'POST', owner, cash(960_001));
      assert.equal(tooMuch.status, 409);
      assert.equal(tooMuch.body.code, 'PAYMENT_EXCEEDS_BALANCE');
      assert.match(tooMuch.body.message, /960000/);

      const settle = await request(path, 'POST', owner, cash(960_000, { paymentMethod: 'TRANSFER' }));
      assert.equal(settle.status, 201);
      const account = await request(`${base}/treatments/${ortho.id}/account`, 'GET', owner);
      assert.equal(account.body.balanceMinor, 0);
      assert.equal(account.body.paidMinor, 1_000_000);

      const more = await request(path, 'POST', owner, cash(1));
      assert.equal(more.status, 409);
      assert.equal(more.body.code, 'PAYMENT_EXCEEDS_BALANCE');
    });

    await t.test('anular exige motivo, restablece el saldo y libera la atención', async () => {
      const path = `${base}/payments/${visit1Payment.id}/void`;
      for (const reason of ['', '   ']) {
        const rejected = await request(path, 'POST', owner, { reason });
        assert.equal(rejected.status, 400);
        assert.equal(rejected.body.code, 'VOID_REASON_REQUIRED');
      }
      assert.equal((await request(path, 'POST', owner, {})).status, 400, 'sin motivo');

      const voided = await request(path, 'POST', owner, { reason: '  Error de digitación  ' });
      assert.equal(voided.status, 200);
      assert.equal(voided.body.status, 'VOIDED');
      assert.equal(voided.body.voidReason, 'Error de digitación');
      assert.equal(voided.body.voidedByMembershipId, principal.membershipId);
      assert.ok(voided.body.voidedAt);

      const again = await request(path, 'POST', owner, { reason: 'otra vez' });
      assert.equal(again.status, 409);
      assert.equal(again.body.code, 'PAYMENT_ALREADY_VOIDED');

      // El dinero anulado deja de contar: el saldo vuelve a abrirse.
      const account = await request(`${base}/treatments/${ortho.id}/account`, 'GET', owner);
      assert.equal(account.body.paidMinor, 980_000);
      assert.equal(account.body.balanceMinor, 20_000);
      const movement = account.body.movements.find((m) => m.id === visit1Payment.id);
      assert.equal(movement.status, 'VOIDED');
      assert.equal(movement.runningBalanceMinor, null);

      // Y la atención queda libre para registrar el pago correcto.
      const none = await request(`${base}/clinical-encounters/${visit1.id}/payment`, 'GET', owner);
      assert.equal(none.status, 404);
      const corrected = await request(`${base}/clinical-encounters/${visit1.id}/payment`, 'POST', owner, cash(20_000));
      assert.equal(corrected.status, 201);
      assert.equal((await request(`${base}/treatments/${ortho.id}/account`, 'GET', owner)).body.balanceMinor, 0);
    });

    await t.test('no se puede anular un pago inexistente ni de otro paciente', async () => {
      const missing = await request(`${base}/payments/${randomUUID()}/void`, 'POST', owner, { reason: 'x' });
      assert.equal(missing.status, 404);
      assert.equal(missing.body.code, 'PAYMENT_NOT_FOUND');
      const wrongPatient = await request(
        `/patients/${otherPatient.id}/payments/${advance.id}/void`, 'POST', owner, { reason: 'x' },
      );
      assert.equal(wrongPatient.status, 404);
      assert.equal((await request(`/patients/${otherPatient.id}/payments/${advance.id}`, 'GET', owner)).status, 404);
    });

    await t.test('una atención anulada o de otra sucursal no admite pagos', async () => {
      const voidedEncounter = await request(`${base}/clinical-encounters/${voidedVisit.id}/payment`, 'POST', owner, cash(100));
      assert.equal(voidedEncounter.status, 409);
      assert.equal(voidedEncounter.body.code, 'ENCOUNTER_VOIDED');
      const farAway = await request(`${base}/clinical-encounters/${faraway.id}/payment`, 'POST', owner, cash(100));
      assert.equal(farAway.status, 403);
      assert.equal(farAway.body.code, 'BRANCH_FORBIDDEN');
      const missing = await request(`${base}/clinical-encounters/${randomUUID()}/payment`, 'POST', owner, cash(100));
      assert.equal(missing.status, 404);
      assert.equal(missing.body.code, 'ENCOUNTER_NOT_FOUND');
    });

    await t.test('una atención sin tratamiento admite un cobro suelto que no toca ningún saldo', async () => {
      const path = `${base}/clinical-encounters/${loose.id}/payment`;
      const noCurrency = await request(path, 'POST', owner, cash(15_000));
      assert.equal(noCurrency.status, 400);
      assert.equal(noCurrency.body.code, 'PAYMENT_CURRENCY_REQUIRED');
      const before = paidOf(ortho.id);
      const response = await request(path, 'POST', owner, cash(15_000, { currency: 'bob' }));
      assert.equal(response.status, 201);
      assert.equal(response.body.treatmentId, null);
      assert.equal(response.body.currency, 'BOB');
      assert.equal(paidOf(ortho.id), before);
    });

    await t.test('en la atención se puede elegir qué tratamiento reduce el pago', async () => {
      const second = seedTreatment({ title: 'Endodoncia', agreedPriceMinor: 50_000 });
      const encounter = seedEncounter({ treatmentId: ortho.id });
      const response = await request(`${base}/clinical-encounters/${encounter.id}/payment`, 'POST', owner, {
        ...cash(30_000),
        treatmentId: second.id,
      });
      assert.equal(response.status, 201);
      assert.equal(response.body.treatmentId, second.id);
      assert.equal(paidOf(second.id), 30_000);
      // El tope es el saldo del tratamiento elegido.
      const other = seedEncounter({ treatmentId: ortho.id });
      const over = await request(`${base}/clinical-encounters/${other.id}/payment`, 'POST', owner, {
        ...cash(20_001),
        treatmentId: second.id,
      });
      assert.equal(over.status, 409);
      assert.equal(over.body.code, 'PAYMENT_EXCEEDS_BALANCE');
      const missing = await request(`${base}/clinical-encounters/${other.id}/payment`, 'POST', owner, {
        ...cash(100),
        treatmentId: randomUUID(),
      });
      assert.equal(missing.status, 404);
      assert.equal(missing.body.code, 'TREATMENT_NOT_FOUND');
    });

    await t.test('el listado se pagina, filtra y respeta las sucursales autorizadas', async () => {
      payments.push({
        ...payments[0], id: randomUUID(), branchId: otherBranchId, amountMinor: 1, paidAt: new Date(),
      });
      const all = await request(`${base}/payments?pageSize=2`, 'GET', owner);
      assert.equal(all.status, 200);
      assert.equal(all.body.items.length, 2);
      assert.ok(all.body.pagination.totalItems > 2);
      assert.ok(
        all.body.items.every((p) => p.branchId === branchId),
        'no aparecen pagos de sucursales no autorizadas',
      );

      const forTreatment = await request(`${base}/payments?treatmentId=${ortho.id}&status=VOIDED`, 'GET', owner);
      assert.deepEqual(forTreatment.body.items.map((p) => p.id), [visit1Payment.id]);
      assert.equal((await request(`${base}/payments?status=NOPE`, 'GET', owner)).status, 400);

      const hidden = payments.at(-1);
      const forbidden = await request(`${base}/payments/${hidden.id}`, 'GET', owner);
      assert.equal(forbidden.status, 403);
      assert.equal(forbidden.body.code, 'BRANCH_FORBIDDEN');
      const detail = await request(`${base}/payments/${advance.id}`, 'GET', owner);
      assert.equal(detail.status, 200);
      assert.equal(detail.body.id, advance.id);
    });

    await t.test('los campos que el cliente no puede fijar se descartan', async () => {
      const fresh = seedTreatment({ title: 'Nuevo' });
      const intruder = randomUUID();
      const response = await request(`${base}/treatments/${fresh.id}/payments`, 'POST', owner, {
        ...cash(1_000),
        organizationId: intruder,
        receivedByMembershipId: intruder,
        status: 'VOIDED',
        voidReason: 'trampa',
        currency: undefined,
      });
      assert.equal(response.status, 201);
      assert.equal(response.body.status, 'COMPLETED');
      assert.equal(response.body.receivedByMembershipId, principal.membershipId);
      assert.equal(response.body.voidReason, null);
      assert.equal(payments.at(-1).organizationId, principal.organizationId);
    });
  },
);
