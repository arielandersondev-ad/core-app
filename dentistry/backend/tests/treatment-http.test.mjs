import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SignJWT } from 'jose';

const READ = 'dentistry:treatments:read';
const CREATE = 'dentistry:treatments:create';
const UPDATE = 'dentistry:treatments:update';

test(
  'tratamientos aplican JWT, permisos, plan, alcance y reglas de presupuesto y saldo',
  { timeout: 60_000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'treatment-http-'));
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
      JWT_ISSUER: 'treatment-http-tests',
      JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
    });
    const { TreatmentModule } = await import(
      '../dist/modules/treatment/treatment.module.js'
    );
    const { TreatmentRepository } = await import(
      '../dist/modules/treatment/domain/repositories/treatment.repository.js'
    );
    const { PatientRepository } = await import(
      '../dist/modules/patient/domain/repositories/patient.repository.js'
    );
    const { DentistryAuthModule } = await import(
      '../dist/modules/auth/dentistry-auth.module.js'
    );
    const { createPaginatedResult } = await import(
      '../dist/common/pagination/pagination.js'
    );
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
    // Plan estándar del cliente con Tratamientos activado.
    const WITH_TREATMENTS = {
      clinicalHistory: true,
      appointments: true,
      procedureNotes: true,
      payments: true,
      treatments: true,
    };
    let currentPlan = planWith(WITH_TREATMENTS);

    const principal = {
      sub: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      branchIds: [randomUUID()],
      permissions: [READ, CREATE, UPDATE],
    };
    const otherOrganizationId = randomUUID();
    const serviceId = randomUUID();

    // ---- Pacientes en memoria -------------------------------------------
    const patients = new Map();
    function seedPatient(organizationId) {
      const row = { id: randomUUID(), organizationId, deletedAt: null };
      patients.set(row.id, row);
      return row;
    }
    const patient = seedPatient(principal.organizationId);
    const otherPatient = seedPatient(principal.organizationId);
    const foreignPatient = seedPatient(otherOrganizationId);
    const patientRepository = {
      async findById(id, organizationId) {
        const row = patients.get(id);
        return row?.organizationId === organizationId ? row : null;
      },
    };

    // ---- Tratamientos y pagos en memoria ---------------------------------
    const treatments = new Map();
    const payments = [];
    let clock = 0;
    const inScope = (row, scope) =>
      row &&
      row.organizationId === scope.organizationId &&
      row.patientId === scope.patientId;
    const paidOf = (id) =>
      payments
        .filter((p) => p.treatmentId === id && p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amountMinor, 0);
    const withBalance = (row) => {
      const paidMinor = paidOf(row.id);
      return {
        ...row,
        paidMinor,
        balanceMinor:
          row.agreedPriceMinor === null ? null : row.agreedPriceMinor - paidMinor,
      };
    };
    const treatmentRepository = {
      async findPage(filters) {
        const items = [...treatments.values()]
          .filter((row) => inScope(row, filters) && (!filters.status || row.status === filters.status))
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(withBalance);
        const { page, pageSize } = filters;
        return createPaginatedResult(
          items.slice((page - 1) * pageSize, page * pageSize),
          { page, pageSize, limit: pageSize },
          items.length,
        );
      },
      async findById(scope, id) {
        const row = treatments.get(id);
        return inScope(row, scope) ? withBalance(row) : null;
      },
      async serviceExists(organizationId, id) {
        return organizationId === principal.organizationId && id === serviceId;
      },
      async create(data) {
        const row = {
          ...data,
          id: randomUUID(),
          serviceName: data.serviceId ? 'Ortodoncia' : null,
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
        for (const [key, value] of Object.entries(change)) {
          if (value !== undefined) row[key] = value;
        }
        row.updatedAt = new Date();
        return withBalance(row);
      },
    };

    // Conserva el wiring real de controlador, casos de uso y guards;
    // solo sustituye la persistencia.
    const replacements = new Map([[TreatmentRepository, treatmentRepository]]);
    const withFakes = (providers) =>
      providers.map((provider) =>
        replacements.has(provider.provide)
          ? { provide: provider.provide, useValue: replacements.get(provider.provide) }
          : provider,
      );
    class TreatmentHttpTestModule {}
    Module({
      imports: [DentistryAuthModule],
      controllers: [...Reflect.getMetadata('controllers', TreatmentModule)],
      providers: [
        ...withFakes(Reflect.getMetadata('providers', TreatmentModule)),
        { provide: PatientRepository, useValue: patientRepository },
        { provide: PlanEntitlementsReader, useValue: { read: async () => currentPlan } },
      ],
    })(TreatmentHttpTestModule);
    app = await NestFactory.create(TreatmentHttpTestModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();

    async function token(overrides = {}) {
      const now = Math.floor(Date.now() / 1000);
      return new SignJWT({ ...principal, ...overrides })
        .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'treatment-test' })
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
    const base = `/patients/${patient.id}/treatments`;
    const orthodontics = (overrides = {}) => ({
      serviceId,
      estimatedSessions: 24,
      agreedPriceMinor: 1_000_000, // 10 000 Bs
      currency: 'BOB',
      diagnosisSummary: '  Maloclusión clase II  ',
      ...overrides,
    });
    const owner = await token();

    await t.test('cada ruta exige token y su permiso exacto', async () => {
      const someId = randomUUID();
      const routes = [
        [base, 'GET', READ],
        [`${base}/${someId}`, 'GET', READ],
        // Cuerpo inválido a propósito: con el permiso correcto responde 400 y no crea nada.
        [base, 'POST', CREATE, { estimatedSessions: 0 }],
        [`${base}/${someId}`, 'PATCH', UPDATE, { notes: 'x' }],
      ];
      for (const [path, method, permission, body] of routes) {
        assert.equal((await request(path, method, undefined, body)).status, 401, `${method} ${path} sin token`);
        const others = [READ, CREATE, UPDATE].filter((p) => p !== permission);
        const denied = await request(path, method, await token({ permissions: others }), body);
        assert.equal(denied.status, 403, `${method} ${path} sin ${permission}`);
        const allowed = await request(path, method, await token({ permissions: [permission] }), body);
        assert.notEqual(allowed.status, 403, `${method} ${path} con ${permission}`);
        assert.notEqual(allowed.status, 401);
      }
    });

    await t.test('sin la función treatments en el plan responde MODULE_NOT_IN_PLAN', async (st) => {
      st.after(() => { currentPlan = planWith(WITH_TREATMENTS); });
      const before = treatments.size;
      // El plan estándar original: pagos sí, tratamientos no.
      currentPlan = planWith({ ...WITH_TREATMENTS, treatments: false });
      const blocked = await request(base, 'GET', owner);
      assert.equal(blocked.status, 403);
      assert.equal(blocked.body.code, 'MODULE_NOT_IN_PLAN');
      assert.equal(blocked.body.module, 'treatments');
      assert.equal((await request(base, 'POST', owner, orthodontics())).status, 403);
      assert.equal(treatments.size, before, 'no se creó nada');
    });

    let created;
    await t.test('crea el tratamiento de ortodoncia con presupuesto de 10 000 Bs', async () => {
      const response = await request(base, 'POST', owner, orthodontics());
      assert.equal(response.status, 201);
      created = response.body;
      assert.equal(created.status, 'PROPOSED');
      assert.equal(created.serviceName, 'Ortodoncia');
      assert.equal(created.agreedPriceMinor, 1_000_000);
      assert.equal(created.currency, 'BOB');
      assert.equal(created.paidMinor, 0);
      assert.equal(created.balanceMinor, 1_000_000);
      assert.equal(created.diagnosisSummary, 'Maloclusión clase II');
      // El responsable es siempre la membresía de la sesión.
      assert.equal(created.practitionerMembershipId, principal.membershipId);
      assert.equal(created.patientId, patient.id);
      assert.equal(created.startedAt, null);
    });

    await t.test('normaliza la moneda y admite un tratamiento sin presupuesto', async () => {
      const lower = await request(base, 'POST', owner, orthodontics({ currency: 'bob' }));
      assert.equal(lower.status, 201);
      assert.equal(lower.body.currency, 'BOB');
      const free = await request(base, 'POST', owner, { notes: '  Evaluación inicial  ' });
      assert.equal(free.status, 201);
      assert.equal(free.body.agreedPriceMinor, null);
      assert.equal(free.body.currency, null);
      assert.equal(free.body.balanceMinor, null);
      assert.equal(free.body.serviceId, null);
      assert.equal(free.body.notes, 'Evaluación inicial');
    });

    await t.test('rechaza presupuestos inconsistentes', async () => {
      const cases = [
        [{ agreedPriceMinor: 1_000_000, currency: undefined }, 400, 'INVALID_TREATMENT_BUDGET'],
        [{ agreedPriceMinor: undefined, currency: 'BOB' }, 400, 'INVALID_TREATMENT_BUDGET'],
        [{ agreedPriceMinor: -5 }, 400],
        [{ agreedPriceMinor: 10.5 }, 400],
        [{ currency: 'BOLIVIANOS' }, 400],
        [{ estimatedSessions: 0 }, 400],
        [{ serviceId: 'no-es-uuid' }, 400],
      ];
      const before = treatments.size;
      for (const [overrides, status, code] of cases) {
        const response = await request(base, 'POST', owner, orthodontics(overrides));
        assert.equal(response.status, status, JSON.stringify(overrides));
        if (code) assert.equal(response.body.code, code, JSON.stringify(overrides));
      }
      assert.equal(treatments.size, before, 'ninguno se guardó');
    });

    await t.test('un servicio inexistente o de otra organización responde 404', async () => {
      const response = await request(base, 'POST', owner, orthodontics({ serviceId: randomUUID() }));
      assert.equal(response.status, 404);
      assert.equal(response.body.code, 'SERVICE_NOT_FOUND');
    });

    await t.test('el paciente debe ser de la organización de la sesión', async () => {
      const foreign = await request(`/patients/${foreignPatient.id}/treatments`, 'POST', owner, orthodontics());
      assert.equal(foreign.status, 404);
      assert.equal(foreign.body.code, 'PATIENT_NOT_FOUND');
      assert.equal((await request(`/patients/${foreignPatient.id}/treatments`, 'GET', owner)).status, 404);
      assert.equal((await request(`/patients/${randomUUID()}/treatments`, 'GET', owner)).status, 404);
      assert.equal((await request('/patients/no-es-uuid/treatments', 'GET', owner)).status, 400);
      patients.get(otherPatient.id).deletedAt = new Date();
      assert.equal(
        (await request(`/patients/${otherPatient.id}/treatments`, 'POST', owner, orthodontics())).status,
        404,
        'paciente eliminado',
      );
    });

    await t.test('un tratamiento no es accesible desde otro paciente', async () => {
      const wrongPatient = seedPatient(principal.organizationId);
      const response = await request(`/patients/${wrongPatient.id}/treatments/${created.id}`, 'GET', owner);
      assert.equal(response.status, 404);
      assert.equal(response.body.code, 'TREATMENT_NOT_FOUND');
      const patch = await request(`/patients/${wrongPatient.id}/treatments/${created.id}`, 'PATCH', owner, { notes: 'x' });
      assert.equal(patch.status, 404);
    });

    await t.test('el detalle y el listado muestran lo cobrado y el saldo', async () => {
      // Anticipo de 200 Bs y abono de 350 Bs; un pago anulado no cuenta.
      payments.push(
        { treatmentId: created.id, amountMinor: 20_000, status: 'COMPLETED' },
        { treatmentId: created.id, amountMinor: 35_000, status: 'COMPLETED' },
        { treatmentId: created.id, amountMinor: 99_999, status: 'VOIDED' },
      );
      const detail = await request(`${base}/${created.id}`, 'GET', owner);
      assert.equal(detail.status, 200);
      assert.equal(detail.body.paidMinor, 55_000);
      assert.equal(detail.body.balanceMinor, 945_000);

      const list = await request(`${base}?pageSize=2`, 'GET', owner);
      assert.equal(list.status, 200);
      // El paciente tiene 3 tratamientos (ortodoncia, la copia 'bob' y el libre).
      assert.equal(list.body.items.length, 2);
      assert.equal(list.body.pagination.totalItems, 3);
      const all = await request(base, 'GET', owner);
      const row = all.body.items.find((item) => item.id === created.id);
      assert.equal(row.balanceMinor, 945_000);
      assert.equal(row.paidMinor, 55_000);

      const none = await request(`${base}?status=COMPLETED`, 'GET', owner);
      assert.deepEqual(none.body.items, []);
      assert.equal((await request(`${base}?status=NOPE`, 'GET', owner)).status, 400);
    });

    await t.test('el presupuesto no baja de lo cobrado y la moneda queda fija con pagos', async () => {
      const path = `${base}/${created.id}`;
      const below = await request(path, 'PATCH', owner, { agreedPriceMinor: 54_999 });
      assert.equal(below.status, 409);
      assert.equal(below.body.code, 'BUDGET_BELOW_PAID');
      const remove = await request(path, 'PATCH', owner, { agreedPriceMinor: null });
      assert.equal(remove.status, 409);
      const currency = await request(path, 'PATCH', owner, { currency: 'USD' });
      assert.equal(currency.status, 409);
      assert.equal(currency.body.code, 'TREATMENT_CURRENCY_LOCKED');

      const exact = await request(path, 'PATCH', owner, { agreedPriceMinor: 55_000 });
      assert.equal(exact.status, 200);
      assert.equal(exact.body.balanceMinor, 0);
      const restored = await request(path, 'PATCH', owner, { agreedPriceMinor: 1_200_000 });
      assert.equal(restored.body.agreedPriceMinor, 1_200_000);
      assert.equal(restored.body.balanceMinor, 1_145_000);
      assert.equal(restored.body.currency, 'BOB');
    });

    await t.test('el estado fija las fechas y los estados finales no admiten cambios', async () => {
      const path = `${base}/${created.id}`;
      const started = await request(path, 'PATCH', owner, { status: 'IN_PROGRESS' });
      assert.equal(started.status, 200);
      assert.equal(started.body.status, 'IN_PROGRESS');
      assert.ok(started.body.startedAt);
      assert.equal(started.body.endedAt, null);

      const done = await request(path, 'PATCH', owner, { status: 'COMPLETED' });
      assert.equal(done.body.status, 'COMPLETED');
      assert.equal(done.body.startedAt, started.body.startedAt, 'no pisa el inicio');
      assert.ok(done.body.endedAt);
      // Finalizar con saldo pendiente es válido: el saldo sigue visible.
      assert.equal(done.body.balanceMinor, 1_145_000);

      const closed = await request(path, 'PATCH', owner, { notes: 'tarde' });
      assert.equal(closed.status, 409);
      assert.equal(closed.body.code, 'TREATMENT_CLOSED');
    });

    await t.test('los campos que el cliente no puede fijar se descartan', async () => {
      const fresh = await request(base, 'POST', owner, orthodontics());
      const intruder = randomUUID();
      const response = await request(`${base}/${fresh.body.id}`, 'PATCH', owner, {
        organizationId: intruder,
        practitionerMembershipId: intruder,
        paidMinor: 999_999,
        balanceMinor: 0,
        notes: 'solo esto cambia',
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.notes, 'solo esto cambia');
      assert.equal(response.body.practitionerMembershipId, principal.membershipId);
      assert.equal(response.body.paidMinor, 0, 'lo cobrado se deriva de los pagos');
      assert.equal(response.body.balanceMinor, 1_000_000);
      assert.equal(treatments.get(fresh.body.id).organizationId, principal.organizationId);
    });
  },
);
