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
    ({ db } = await import('../dist/prisma/db.js'));

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
      async create(data) {
        calls.push({ operation: 'create', data });
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
      providers: Reflect.getMetadata('providers', PatientModule).map(
        (provider) =>
          provider.provide === PatientRepository
            ? { provide: PatientRepository, useValue: repository }
            : provider,
      ),
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
  },
);
