import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SignJWT } from 'jose';

test(
  'pacientes HTTP aplica JWT, permisos y contexto del token',
  { timeout: 60_000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'patient-http-auth-'));
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
    // Never use a deployed connection or credentials while importing providers.
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://isolated:isolated@127.0.0.1:1/never_connect',
      FRONTEND_URL: 'http://127.0.0.1:3000',
      JWT_PUBLIC_KEY_PATH: keyPath,
      JWT_ISSUER: 'patient-http-tests',
      JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
    });
    const { PatientModule } = await import(
      '../dist/modules/patient/patient.module.js'
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
    const { PlanLimitReachedException } = await import(
      '../dist/modules/auth/application/contracts/plan-limit-reached.exception.js'
    );
    const { assertPatientSeatAvailable } = await import(
      '../dist/modules/patient/infrastructure/patient-quota.js'
    );
    const { ConvertPersonToPatientUseCase } = await import(
      '../dist/modules/person/application/use-case/convert-person-to-patient.use-case.js'
    );
    ({ db } = await import('../dist/prisma/db.js'));

    // Plan vigente de la organización; cada subtest puede reemplazarlo.
    const starterPlan = (overrides = {}) =>
      parsePlanEntitlements({
        schemaVersion: 1,
        limits: { patients: 300, members: 2, branches: 1 },
        features: { clinicalHistory: true, appointments: true, procedureNotes: true },
        ...overrides,
      });
    let currentPlan = starterPlan();
    const entitlementsReader = { read: async () => currentPlan };

    const principal = {
      sub: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      branchIds: [],
      permissions: [
        'dentistry:patients:read',
        'dentistry:patients:create',
        'dentistry:patients:update',
      ],
    };
    const otherOrganizationId = randomUUID();
    const otherActor = randomUUID();
    const rows = new Map();
    function seed(organizationId) {
      const patient = {
        id: randomUUID(),
        organizationId,
        firstName: 'Ana',
        lastName: 'Pérez',
        phone: null,
        email: null,
        birthDate: null,
        sex: null,
        documentType: null,
        documentNumber: null,
        address: null,
        notes: null,
        status: 'ACTIVE',
        createdByMembershipId: principal.membershipId,
        updatedByMembershipId: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.set(patient.id, patient);
      return patient;
    }
    const own = seed(principal.organizationId);
    const foreign = seed(otherOrganizationId);
    const calls = [];
    const repository = {
      async findByFilters(filters) {
        calls.push({ operation: 'list', filters });
        const items = [...rows.values()].filter(
          (row) =>
            row.organizationId === filters.organizationId &&
            row.deletedAt === null,
        );
        const { page = 1, pageSize = 20 } = filters;
        return createPaginatedResult(
          items.slice((page - 1) * pageSize, page * pageSize),
          { page, pageSize },
          items.length,
        );
      },
      async findById(id, organizationId) {
        calls.push({ operation: 'get', id, organizationId });
        const patient = rows.get(id);
        return patient?.organizationId === organizationId ? patient : null;
      },
      async countSeats(organizationId) {
        return [...rows.values()].filter(
          (row) => row.organizationId === organizationId && row.deletedAt === null,
        ).length;
      },
      async create(data, patientLimit) {
        calls.push({ operation: 'create', data, patientLimit });
        if (
          patientLimit !== null &&
          (await this.countSeats(data.organizationId)) >= patientLimit
        ) {
          throw new PlanLimitReachedException('patients', patientLimit);
        }
        const patient = {
          ...data,
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        rows.set(patient.id, patient);
        return patient;
      },
      async update(patient) {
        calls.push({ operation: 'update', patient });
        rows.set(patient.id, patient);
        return patient;
      },
    };

    // Keep the production controller/use-case/guard wiring, replacing persistence only.
    assert.ok(
      Reflect.getMetadata('imports', PatientModule).includes(
        DentistryAuthModule,
      ),
    );
    class PatientHttpTestModule {}
    Module({
      imports: [DentistryAuthModule],
      controllers: Reflect.getMetadata('controllers', PatientModule),
      providers: [
        ...Reflect.getMetadata('providers', PatientModule).map((provider) =>
          provider.provide === PatientRepository
            ? { provide: PatientRepository, useValue: repository }
            : provider,
        ),
        { provide: PlanEntitlementsReader, useValue: entitlementsReader },
      ],
    })(PatientHttpTestModule);
    app = await NestFactory.create(PatientHttpTestModule, { logger: false });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();

    async function token(overrides = {}, options = {}) {
      const now = Math.floor(Date.now() / 1000);
      return new SignJWT({ ...principal, ...overrides })
        .setProtectedHeader({
          alg: 'RS256',
          typ: 'at+jwt',
          kid: 'patient-http-test',
        })
        .setIssuer(options.issuer ?? process.env.JWT_ISSUER)
        .setAudience(options.audience ?? 'dentistry-api')
        .setIssuedAt(now - 120)
        .setExpirationTime(options.expired ? now - 60 : now + 300)
        .setJti(randomUUID())
        .sign(options.key ?? privateKey);
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
      return { status: response.status, body: await response.json() };
    }
    const routes = [
      {
        path: '/patients',
        method: 'GET',
        permission: 'dentistry:patients:read',
        status: 200,
      },
      {
        path: `/patients/${own.id}`,
        method: 'GET',
        permission: 'dentistry:patients:read',
        status: 200,
      },
      {
        path: '/patients',
        method: 'POST',
        permission: 'dentistry:patients:create',
        status: 201,
        body: { firstName: 'Nueva', lastName: 'Paciente' },
      },
      {
        path: `/patients/${own.id}`,
        method: 'PATCH',
        permission: 'dentistry:patients:update',
        status: 200,
        body: { phone: '123' },
      },
    ];

    await t.test(
      'las cuatro operaciones rechazan tokens ausentes, inválidos, vencidos y de otra audiencia',
      async () => {
        const untrustedKey = generateKeyPairSync('rsa', {
          modulusLength: 2048,
        }).privateKey;
        const invalidTokens = [
          undefined,
          'invalid',
          await token({}, { expired: true }),
          await token({}, { audience: 'core-api' }),
          await token({}, { issuer: 'other-issuer' }),
          await token({}, { key: untrustedKey }),
          await token({ organizationId: 'invalid' }),
        ];
        for (const route of routes) {
          for (const accessToken of invalidTokens) {
            const result = await request(
              route.path,
              route.method,
              accessToken,
              route.body,
            );
            assert.equal(result.status, 401, `${route.method} ${route.path}`);
          }
        }
        assert.equal(calls.length, 0);
      },
    );

    await t.test(
      'las cuatro operaciones exigen su permiso exacto antes de acceder a datos',
      async () => {
        for (const route of routes) {
          for (const permissions of [
            [],
            ['dentistry:appointments:read'],
            [route.permission + '-other'],
          ]) {
            const result = await request(
              route.path,
              route.method,
              await token({ permissions }),
              route.body,
            );
            assert.equal(result.status, 403);
          }
        }
        assert.equal(calls.length, 0);
        for (const route of routes) {
          const result = await request(
            route.path,
            route.method,
            await token({ permissions: [route.permission] }),
            route.body,
          );
          assert.equal(result.status, route.status);
        }
      },
    );

    await t.test(
      'el listado y detalle usan la organización firmada aunque el cliente envíe otra',
      async () => {
        const accessToken = await token({
          permissions: ['dentistry:patients:read'],
        });
        const list = await request(
          `/patients?organizationId=${otherOrganizationId}&page=1&pageSize=20`,
          'GET',
          accessToken,
        );
        assert.equal(list.status, 200);
        assert.ok(list.body.items.length > 0);
        assert.ok(
          list.body.items.every(
            (row) => row.organizationId === principal.organizationId,
          ),
        );
        assert.equal(list.body.pagination.totalItems, list.body.items.length);
        assert.equal(
          calls.findLast((call) => call.operation === 'list').filters
            .organizationId,
          principal.organizationId,
        );
        assert.equal(
          (
            await request(
              `/patients/${own.id}?organizationId=${otherOrganizationId}`,
              'GET',
              accessToken,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/patients/${foreign.id}?organizationId=${otherOrganizationId}`,
              'GET',
              accessToken,
            )
          ).status,
          404,
        );
      },
    );

    await t.test(
      'el alta toma organización y autoría de los claims, no del body',
      async () => {
        const result = await request(
          '/patients',
          'POST',
          await token({ permissions: ['dentistry:patients:create'] }),
          {
            firstName: ' Beatriz ',
            lastName: ' Torres ',
            organizationId: otherOrganizationId,
            createdByMembershipId: otherActor,
            updatedByMembershipId: otherActor,
          },
        );
        assert.equal(result.status, 201);
        assert.equal(result.body.organizationId, principal.organizationId);
        assert.equal(result.body.fullName, 'Beatriz Torres');
        const saved = rows.get(result.body.id);
        assert.equal(saved.createdByMembershipId, principal.membershipId);
        assert.notEqual(saved.createdByMembershipId, principal.sub);
        assert.equal(saved.updatedByMembershipId, null);
      },
    );

    await t.test(
      'la edición conserva la autoría del alta y rechaza pacientes de otra organización',
      async () => {
        const accessToken = await token({
          permissions: ['dentistry:patients:update'],
        });
        const body = {
          phone: '456',
          organizationId: otherOrganizationId,
          createdByMembershipId: otherActor,
          updatedByMembershipId: otherActor,
        };
        const result = await request(
          `/patients/${own.id}`,
          'PATCH',
          accessToken,
          body,
        );
        assert.equal(result.status, 200);
        assert.equal(rows.get(own.id).phone, '456');
        assert.equal(
          rows.get(own.id).updatedByMembershipId,
          principal.membershipId,
        );
        assert.equal(
          rows.get(own.id).createdByMembershipId,
          own.createdByMembershipId,
        );
        assert.equal(
          (await request(`/patients/${foreign.id}`, 'PATCH', accessToken, body))
            .status,
          404,
        );
        assert.equal(rows.get(foreign.id).phone, null);
      },
    );

    await t.test(
      'los DTO y los UUID se validan después de los guards sin acceder al repositorio',
      async () => {
        const accessToken = await token();
        const before = calls.length;
        assert.equal(
          (await request('/patients/invalid', 'GET', accessToken)).status,
          400,
        );
        assert.equal(
          (
            await request('/patients/invalid', 'PATCH', accessToken, {
              phone: '123',
            })
          ).status,
          400,
        );
        assert.equal(
          (await request('/patients?page=0', 'GET', accessToken)).status,
          400,
        );
        assert.equal(
          (
            await request('/patients', 'POST', accessToken, {
              firstName: ' ',
              lastName: 'Pérez',
            })
          ).status,
          400,
        );
        assert.equal(calls.length, before);
      },
    );

    await t.test('el cupo del plan limita las altas y se consulta en /patients/quota', async (t) => {
      t.after(() => { currentPlan = starterPlan(); });
      const accessToken = await token();
      const seats = () => repository.countSeats(principal.organizationId);
      const body = { firstName: 'Carla', lastName: 'Rojas' };

      let quota = await request('/patients/quota', 'GET', accessToken);
      assert.equal(quota.status, 200);
      assert.deepEqual(quota.body, { used: await seats(), limit: 300 });

      // Por debajo del cupo se crea y el repositorio recibe el límite del plan.
      const limit = (await seats()) + 1;
      currentPlan = starterPlan({ limits: { patients: limit, members: 2, branches: 1 } });
      assert.equal((await request('/patients', 'POST', accessToken, body)).status, 201);
      assert.equal(calls.findLast((call) => call.operation === 'create').patientLimit, limit);

      // Al llegar al cupo se bloquea con el código estable.
      const blocked = await request('/patients', 'POST', accessToken, body);
      assert.equal(blocked.status, 403);
      assert.equal(blocked.body.code, 'PLAN_LIMIT_REACHED');
      assert.equal(blocked.body.resource, 'patients');
      assert.equal(blocked.body.limit, limit);
      assert.match(blocked.body.message, /Mejora tu plan/);
      quota = await request('/patients/quota', 'GET', accessToken);
      assert.deepEqual(quota.body, { used: limit, limit });

      // Un paciente eliminado libera cupo.
      rows.get(own.id).deletedAt = new Date();
      assert.equal((await request('/patients', 'POST', accessToken, body)).status, 201);
      rows.get(own.id).deletedAt = null;

      // Un plan antiguo sin la clave no aplica cupo.
      currentPlan = starterPlan({ limits: {} });
      assert.equal((await request('/patients', 'POST', accessToken, body)).status, 201);
      assert.equal(calls.findLast((call) => call.operation === 'create').patientLimit, null);
      assert.equal((await request('/patients/quota', 'GET', accessToken)).body.limit, null);

      // "quota" exige el permiso de lectura.
      const denied = await request('/patients/quota', 'GET', await token({ permissions: [] }));
      assert.equal(denied.status, 403);
    });

    await t.test('el módulo Pacientes debe estar en el plan vigente', async (t) => {
      t.after(() => { currentPlan = starterPlan(); });
      const accessToken = await token();
      const before = calls.length;
      for (const plan of [starterPlan({ features: { appointments: true } }), null]) {
        currentPlan = plan;
        for (const [path, method, body] of [
          ['/patients', 'GET'],
          ['/patients/quota', 'GET'],
          [`/patients/${own.id}`, 'GET'],
          ['/patients', 'POST', { firstName: 'Ana', lastName: 'Luz' }],
        ]) {
          const result = await request(path, method, accessToken, body);
          assert.equal(result.status, 403, `${method} ${path}`);
          assert.equal(result.body.code, 'MODULE_NOT_IN_PLAN');
          assert.equal(result.body.module, 'patients');
        }
      }
      assert.equal(calls.length, before);
    });

    await t.test('el cupo se comprueba bajo bloqueo dentro de la transacción', async () => {
      const organizationId = randomUUID();
      function fakeTx(seats) {
        const steps = [];
        return {
          steps,
          execute: async (plan) => { steps.push(['lock', plan]); return []; },
          orm: { dentistry: { Patient: { where: (filter) => ({
            aggregate: async () => { steps.push(['count', filter]); return { totalItems: seats }; },
          }) } } },
        };
      }
      const unlimited = fakeTx(999);
      await assertPatientSeatAvailable(unlimited, organizationId, null);
      assert.equal(unlimited.steps.length, 0);

      const available = fakeTx(2);
      await assertPatientSeatAvailable(available, organizationId, 3);
      assert.deepEqual(available.steps.map(([step]) => step), ['lock', 'count']);
      assert.match(JSON.stringify(available.steps[0][1]), /pg_advisory_xact_lock/);
      assert.match(JSON.stringify(available.steps[0][1]), new RegExp(organizationId));
      assert.deepEqual(available.steps[1][1], { organizationId, deletedAt: null });

      await assert.rejects(assertPatientSeatAvailable(fakeTx(3), organizationId, 3), (error) => {
        assert.ok(error instanceof PlanLimitReachedException);
        assert.equal(error.getResponse().code, 'PLAN_LIMIT_REACHED');
        return true;
      });
    });

    await t.test('convertir una persona en paciente respeta el cupo', async () => {
      const organizationId = randomUUID();
      const personId = randomUUID();
      function harness(seats) {
        const created = [];
        const tx = {
          execute: async () => [],
          orm: { dentistry: {
            Person: {
              first: async () => ({ id: personId, organizationId, firstName: 'Luis', lastName: 'Soto', phone: null, email: null, notes: null, deletedAt: null, convertedToPatientId: null }),
              where: () => ({ update: async () => ({}) }),
            },
            Patient: {
              where: () => ({ aggregate: async () => ({ totalItems: seats }) }),
              first: async () => null,
              create: async (data) => {
                const row = { ...data, id: randomUUID(), maritalStatus: null, occupation: null, origin: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
                created.push(row);
                return row;
              },
            },
            Appointment: { where: () => ({ all: async () => [], update: async () => null }) },
          } },
        };
        const useCase = new ConvertPersonToPatientUseCase(
          { transaction: (work) => work(tx) },
          { read: async () => starterPlan({ limits: { patients: 3, members: 2, branches: 1 } }) },
        );
        return { useCase, created };
      }
      const command = { organizationId, personId, membershipId: randomUUID() };
      const full = harness(3);
      await assert.rejects(full.useCase.execute(command), PlanLimitReachedException);
      assert.equal(full.created.length, 0);
      const free = harness(2);
      const result = await free.useCase.execute(command);
      assert.equal(result.patient.id, free.created[0].id);
    });
  },
);
