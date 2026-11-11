import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SignJWT } from 'jose';

const READ = 'dentistry:encounters:read';
const CREATE = 'dentistry:encounters:create';
const UPDATE = 'dentistry:encounters:update';
const VOID = 'dentistry:encounters:void';

test(
  'atenciones clínicas y perfil de salud aplican JWT, permisos, alcance y reglas de estado',
  { timeout: 60_000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'clinical-http-'));
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
      JWT_ISSUER: 'clinical-http-tests',
      JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
    });
    const { ClinicalEncounterModule } = await import(
      '../dist/modules/clinical-encounter/clinical-encounter.module.js'
    );
    const { ClinicalEncounterRepository } = await import(
      '../dist/modules/clinical-encounter/domain/repositories/clinical-encounter.repository.js'
    );
    const { PatientHealthProfileRepository } = await import(
      '../dist/modules/clinical-encounter/domain/repositories/patient-health-profile.repository.js'
    );
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

    const branchId = randomUUID();
    const otherBranchId = randomUUID();
    const principal = {
      sub: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      branchIds: [branchId],
      permissions: [READ, CREATE, UPDATE, VOID],
    };
    const otherOrganizationId = randomUUID();

    // ---- Pacientes en memoria -------------------------------------------
    const patients = new Map();
    function seedPatient(organizationId) {
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
        maritalStatus: null,
        occupation: null,
        origin: null,
        notes: null,
        status: 'ACTIVE',
        createdByMembershipId: principal.membershipId,
        updatedByMembershipId: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      patients.set(patient.id, patient);
      return patient;
    }
    const patient = seedPatient(principal.organizationId);
    const foreignPatient = seedPatient(otherOrganizationId);
    const patientCalls = [];
    const patientRepository = {
      async findById(id, organizationId) {
        const row = patients.get(id);
        return row?.organizationId === organizationId ? row : null;
      },
      async findByFilters(filters) {
        patientCalls.push(filters);
        return createPaginatedResult([], { page: 1, pageSize: 20 }, 0);
      },
      async create(data) {
        const row = {
          ...data,
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        patients.set(row.id, row);
        return row;
      },
      async update(row) {
        patients.set(row.id, row);
        return row;
      },
    };

    // ---- Atenciones en memoria -------------------------------------------
    const encounters = new Map();
    const appointments = new Map();
    const treatments = new Map();
    const treatmentProcedures = new Map();
    let encounterRepositoryCalls = 0;
    const inScope = (row, scope) =>
      row &&
      row.organizationId === scope.organizationId &&
      row.patientId === scope.patientId;
    const encounterRepository = {
      async findPage(filters) {
        encounterRepositoryCalls++;
        const items = [...encounters.values()]
          .filter(
            (row) =>
              inScope(row, filters) &&
              filters.authorizedBranchIds.includes(row.branchId) &&
              (!filters.status || row.status === filters.status),
          )
          .sort((a, b) => b.startedAt - a.startedAt);
        const { page, pageSize } = filters;
        return createPaginatedResult(
          items.slice((page - 1) * pageSize, page * pageSize),
          { page, pageSize },
          items.length,
        );
      },
      async findById(scope, id) {
        encounterRepositoryCalls++;
        const row = encounters.get(id);
        return inScope(row, scope) ? structuredClone(row) : null;
      },
      async create(data) {
        encounterRepositoryCalls++;
        if (
          data.appointmentId &&
          [...encounters.values()].some(
            (row) => row.appointmentId === data.appointmentId,
          )
        ) {
          const { ClinicalErrors } = await import(
            '../dist/modules/clinical-encounter/application/clinical-encounter.errors.js'
          );
          throw ClinicalErrors.appointmentTaken();
        }
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
      async transition(scope, id, expectedRowVersion, change) {
        encounterRepositoryCalls++;
        const row = encounters.get(id);
        if (!inScope(row, scope) || row.rowVersion !== expectedRowVersion) {
          return null;
        }
        Object.assign(row, change, { rowVersion: expectedRowVersion + 1 });
        return structuredClone(row);
      },
      async addProcedures(scope, id, expectedRowVersion, drafts, actor) {
        encounterRepositoryCalls++;
        const row = encounters.get(id);
        if (
          !inScope(row, scope) ||
          row.status !== 'IN_PROGRESS' ||
          row.rowVersion !== expectedRowVersion
        ) {
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
      async findAppointment(scope, id) {
        const row = appointments.get(id);
        return inScope(row, scope) ? row : null;
      },
      async treatmentExists(scope, id) {
        return inScope(treatments.get(id), scope);
      },
      async findTreatmentProcedures(scope, ids) {
        return ids
          .map((id) => treatmentProcedures.get(id))
          .filter((row) => inScope(row, scope));
      },
      async getReferenceData(scope) {
        encounterRepositoryCalls++;
        return {
          branches: scope.authorizedBranchIds.map((id) => ({
            id,
            label: 'Sucursal',
          })),
          practitioners: [{ id: scope.membershipId, label: 'Dra. Prueba' }],
          appointments: [],
          treatments: [],
          treatmentProcedures: [],
        };
      },
    };

    const profiles = new Map();
    const profileRepository = {
      async find(scope) {
        return profiles.get(scope.patientId) ?? null;
      },
      async create(scope, texts) {
        const row = {
          patientId: scope.patientId,
          ...texts,
          updatedAt: new Date(),
          rowVersion: 1,
        };
        profiles.set(scope.patientId, row);
        return { ...row };
      },
      async update(scope, expected, texts) {
        const row = profiles.get(scope.patientId);
        if (!row || row.rowVersion !== expected) return null;
        Object.assign(row, texts, {
          updatedAt: new Date(),
          rowVersion: expected + 1,
        });
        return { ...row };
      },
    };

    // Conserva el wiring real de controladores, casos de uso y guards;
    // solo sustituye la persistencia.
    const replacements = new Map([
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
    class ClinicalHttpTestModule {}
    Module({
      imports: [DentistryAuthModule],
      controllers: [
        ...Reflect.getMetadata('controllers', ClinicalEncounterModule),
        ...Reflect.getMetadata('controllers', PatientModule),
      ],
      providers: withFakes([
        ...Reflect.getMetadata('providers', ClinicalEncounterModule),
        ...Reflect.getMetadata('providers', PatientModule),
      ]),
    })(ClinicalHttpTestModule);
    app = await NestFactory.create(ClinicalHttpTestModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();

    async function token(overrides = {}) {
      const now = Math.floor(Date.now() / 1000);
      return new SignJWT({ ...principal, ...overrides })
        .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'clinical-test' })
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
    const base = `/patients/${patient.id}/clinical-encounters`;
    const createBody = (overrides = {}) => ({
      patientId: patient.id,
      branchId,
      startedAt: '2026-11-11T14:00:00.000Z',
      chiefComplaint: '  Dolor en molar  ',
      examinationSummary: '',
      ...overrides,
    });

    await t.test('cada ruta exige token y su permiso exacto', async () => {
      const someId = randomUUID();
      const routes = [
        [base, 'GET', READ],
        [`${base}/reference-data`, 'GET', READ],
        [`${base}/${someId}`, 'GET', READ],
        [base, 'POST', CREATE, createBody()],
        [`${base}/${someId}/procedures`, 'POST', UPDATE, { procedures: [] }],
        [`${base}/${someId}/complete`, 'POST', UPDATE, { endedAt: '2026-11-11T15:00:00Z' }],
        [`${base}/${someId}/void`, 'POST', VOID, { reason: 'x' }],
        [`/patients/${patient.id}/health-profile`, 'GET', READ],
        [`/patients/${patient.id}/health-profile`, 'PATCH', UPDATE, {}],
      ];
      for (const [path, method, permission, body] of routes) {
        assert.equal((await request(path, method, undefined, body)).status, 401);
        const others = [READ, CREATE, UPDATE, VOID].filter((p) => p !== permission);
        const denied = await request(path, method, await token({ permissions: others }), body);
        assert.equal(denied.status, 403, `${method} ${path}`);
      }
      assert.equal(encounterRepositoryCalls, 0);
    });

    let encounterId;
    await t.test('el alta deriva profesional y autoría del token y normaliza textos', async () => {
      const result = await request(base, 'POST', await token(), {
        ...createBody(),
        organizationId: otherOrganizationId,
        practitionerMembershipId: randomUUID(),
        status: 'COMPLETED',
      });
      assert.equal(result.status, 201);
      assert.equal(result.body.status, 'IN_PROGRESS');
      assert.equal(result.body.practitionerMembershipId, principal.membershipId);
      assert.equal(result.body.chiefComplaint, 'Dolor en molar');
      assert.equal(result.body.examinationSummary, null);
      assert.deepEqual(result.body.procedures, []);
      assert.equal(result.body.rowVersion, 1);
      assert.equal(result.body.organizationId, undefined);
      const saved = encounters.get(result.body.id);
      assert.equal(saved.organizationId, principal.organizationId);
      assert.equal(saved.createdByMembershipId, principal.membershipId);
      encounterId = result.body.id;
    });

    await t.test('el alta valida paciente, sucursal, cita y tratamiento', async () => {
      const accessToken = await token();
      const cases = [
        [createBody({ patientId: foreignPatient.id }), 400, 'PATIENT_MISMATCH'],
        [createBody({ branchId: otherBranchId }), 403, 'BRANCH_FORBIDDEN'],
        [createBody({ appointmentId: randomUUID() }), 404, 'APPOINTMENT_NOT_FOUND'],
        [createBody({ treatmentId: randomUUID() }), 404, 'TREATMENT_NOT_FOUND'],
        [createBody({ startedAt: 'ayer' }), 400, undefined],
        [createBody({ branchId: 'no-uuid' }), 400, undefined],
      ];
      for (const [body, status, code] of cases) {
        const result = await request(base, 'POST', accessToken, body);
        assert.equal(result.status, status, JSON.stringify(body));
        if (code) assert.equal(result.body.code, code);
      }
      const foreign = await request(
        `/patients/${foreignPatient.id}/clinical-encounters`,
        'POST',
        accessToken,
        createBody({ patientId: foreignPatient.id }),
      );
      assert.equal(foreign.status, 404);
      assert.equal(foreign.body.code, 'PATIENT_NOT_FOUND');

      const canceled = { id: randomUUID(), organizationId: principal.organizationId, patientId: patient.id, branchId, status: 'CANCELED' };
      const scheduled = { ...canceled, id: randomUUID(), status: 'SCHEDULED' };
      appointments.set(canceled.id, canceled);
      appointments.set(scheduled.id, scheduled);
      const notEligible = await request(base, 'POST', accessToken, createBody({ appointmentId: canceled.id }));
      assert.equal(notEligible.status, 422);
      assert.equal(notEligible.body.code, 'APPOINTMENT_NOT_ELIGIBLE');
      assert.equal((await request(base, 'POST', accessToken, createBody({ appointmentId: scheduled.id }))).status, 201);
      const taken = await request(base, 'POST', accessToken, createBody({ appointmentId: scheduled.id }));
      assert.equal(taken.status, 409);
      assert.equal(taken.body.code, 'ENCOUNTER_APPOINTMENT_TAKEN');
    });

    await t.test('procedimientos: regla FDI, vínculo al plan y lote', async () => {
      const accessToken = await token();
      const path = `${base}/${encounterId}/procedures`;
      const invalid = [
        { targetType: 'TOOTH', description: 'Resina' },
        { targetType: 'TOOTH', toothNumber: '19', description: 'Resina' },
        { targetType: 'REGION', toothNumber: '11', description: 'Limpieza' },
        { targetType: 'WHOLE_MOUTH', description: '   ' },
      ];
      for (const procedure of invalid) {
        const result = await request(path, 'POST', accessToken, { procedures: [procedure] });
        assert.equal(result.status, 400, JSON.stringify(procedure));
      }
      assert.equal((await request(path, 'POST', accessToken, { procedures: [] })).status, 400);
      assert.equal(
        (await request(path, 'POST', accessToken, {
          procedures: [{ targetType: 'OTHER', description: 'x', treatmentProcedureId: randomUUID() }],
        })).body.code,
        'TREATMENT_PROCEDURE_NOT_FOUND',
      );
      const canceledPlan = { id: randomUUID(), organizationId: principal.organizationId, patientId: patient.id, treatmentId: randomUUID(), status: 'CANCELED' };
      treatmentProcedures.set(canceledPlan.id, canceledPlan);
      const mismatch = await request(path, 'POST', accessToken, {
        procedures: [{ targetType: 'OTHER', description: 'x', treatmentProcedureId: canceledPlan.id }],
      });
      assert.equal(mismatch.status, 422);
      assert.equal(encounters.get(encounterId).procedures.length, 0);

      const created = await request(path, 'POST', accessToken, {
        procedures: [
          { targetType: 'TOOTH', toothNumber: '11', description: 'Resina' },
          { targetType: 'TOOTH', toothNumber: '21', description: 'Resina' },
          { targetType: 'WHOLE_MOUTH', description: 'Profilaxis', targetDescription: '' },
        ],
      });
      assert.equal(created.status, 201);
      assert.deepEqual(created.body.map((row) => row.toothNumber), ['11', '21', null]);
      assert.ok(created.body.every((row) => row.status === 'RECORDED'));
      assert.equal(created.body[2].targetDescription, null);

      const detail = await request(`${base}/${encounterId}`, 'GET', accessToken);
      assert.equal(detail.status, 200);
      assert.equal(detail.body.procedures.length, 3);
      assert.equal(detail.body.rowVersion, 2);
    });

    await t.test('completar y anular respetan las transiciones', async () => {
      const accessToken = await token();
      const early = await request(`${base}/${encounterId}/complete`, 'POST', accessToken, { endedAt: '2026-11-11T13:00:00Z' });
      assert.equal(early.status, 400);
      assert.equal(early.body.code, 'INVALID_ENDED_AT');

      const completed = await request(`${base}/${encounterId}/complete`, 'POST', accessToken, {
        endedAt: '2026-11-11T15:00:00Z',
        completedByMembershipId: randomUUID(),
      });
      assert.equal(completed.status, 200);
      assert.equal(completed.body.status, 'COMPLETED');
      assert.equal(completed.body.completedByMembershipId, principal.membershipId);
      assert.ok(completed.body.completedAt);
      assert.equal(completed.body.procedureSummary, null);

      const again = await request(`${base}/${encounterId}/complete`, 'POST', accessToken, { endedAt: '2026-11-11T15:00:00Z' });
      assert.equal(again.status, 409);
      assert.equal(again.body.code, 'ENCOUNTER_NOT_IN_PROGRESS');
      const lateProcedure = await request(`${base}/${encounterId}/procedures`, 'POST', accessToken, {
        procedures: [{ targetType: 'OTHER', description: 'x' }],
      });
      assert.equal(lateProcedure.status, 409);

      const noReason = await request(`${base}/${encounterId}/void`, 'POST', accessToken, { reason: '   ' });
      assert.equal(noReason.status, 400);
      assert.equal(noReason.body.code, 'VOID_REASON_REQUIRED');
      const voided = await request(`${base}/${encounterId}/void`, 'POST', accessToken, { reason: ' Registro duplicado ' });
      assert.equal(voided.status, 200);
      assert.equal(voided.body.status, 'VOIDED');
      assert.equal(voided.body.voidReason, 'Registro duplicado');
      assert.equal(voided.body.voidedByMembershipId, principal.membershipId);
      assert.equal(voided.body.procedures.length, 3);
      const twice = await request(`${base}/${encounterId}/void`, 'POST', accessToken, { reason: 'otra vez' });
      assert.equal(twice.status, 409);
      assert.equal(twice.body.code, 'ENCOUNTER_ALREADY_VOIDED');
      assert.equal((await request(`${base}/${encounterId}`, 'GET', accessToken)).body.status, 'VOIDED');
    });

    await t.test('listado paginado y alcance por organización y sucursal', async () => {
      const accessToken = await token({ permissions: [READ] });
      const list = await request(`${base}?status=VOIDED&page=1&pageSize=1`, 'GET', accessToken);
      assert.equal(list.status, 200);
      assert.equal(list.body.items.length, 1);
      assert.equal(list.body.pagination.totalItems, 1);
      assert.equal((await request(`${base}?status=OPEN`, 'GET', accessToken)).status, 400);
      assert.equal((await request(`${base}?search=${'x'.repeat(101)}`, 'GET', accessToken)).status, 400);
      assert.equal(
        (await request(`/patients/${foreignPatient.id}/clinical-encounters`, 'GET', accessToken)).status,
        404,
      );
      const otherBranch = await request(`${base}/${encounterId}`, 'GET', await token({ permissions: [READ], branchIds: [otherBranchId] }));
      assert.equal(otherBranch.status, 403);
      assert.equal((await request(`${base}/${randomUUID()}`, 'GET', accessToken)).status, 404);
      assert.equal((await request(`${base}/no-uuid`, 'GET', accessToken)).status, 400);
      const reference = await request(`${base}/reference-data`, 'GET', accessToken);
      assert.equal(reference.status, 200);
      assert.deepEqual(reference.body.practitioners.map((row) => row.id), [principal.membershipId]);
    });

    await t.test('perfil de salud: vacío, alta, edición parcial y versión obsoleta', async () => {
      const path = `/patients/${patient.id}/health-profile`;
      const accessToken = await token();
      const empty = await request(path, 'GET', accessToken);
      assert.equal(empty.status, 200);
      assert.equal(empty.body.allergies, null);
      assert.equal(empty.body.rowVersion, 0);
      assert.equal(empty.body.updatedAt, null);

      const created = await request(path, 'PATCH', accessToken, { allergies: ' Penicilina ', observations: '', rowVersion: 0 });
      assert.equal(created.status, 200);
      assert.equal(created.body.allergies, 'Penicilina');
      assert.equal(created.body.observations, null);
      assert.equal(created.body.rowVersion, 1);

      const updated = await request(path, 'PATCH', accessToken, { currentMedications: 'Ibuprofeno' });
      assert.equal(updated.body.allergies, 'Penicilina');
      assert.equal(updated.body.currentMedications, 'Ibuprofeno');
      assert.equal(updated.body.rowVersion, 2);

      const stale = await request(path, 'PATCH', accessToken, { allergies: null, rowVersion: 1 });
      assert.equal(stale.status, 409);
      assert.equal(stale.body.code, 'HEALTH_PROFILE_STALE');
      assert.equal(
        (await request(`/patients/${foreignPatient.id}/health-profile`, 'GET', accessToken)).status,
        404,
      );
    });

    await t.test('pacientes: filtros de fecha de alta y campos de filiación', async () => {
      const accessToken = await token({ permissions: ['dentistry:patients:read', 'dentistry:patients:create'] });
      const ok = await request('/patients?createdFrom=2026-11-01&createdTo=2026-11-30', 'GET', accessToken);
      assert.equal(ok.status, 200);
      const filters = patientCalls.at(-1);
      assert.equal(filters.createdFrom.toISOString(), '2026-11-01T00:00:00.000Z');
      assert.equal(filters.createdTo.toISOString(), '2026-11-30T00:00:00.000Z');
      assert.equal((await request('/patients?createdFrom=01-11-2026', 'GET', accessToken)).status, 400);
      assert.equal((await request('/patients?createdFrom=2026-02-30', 'GET', accessToken)).status, 400);
      assert.equal((await request('/patients?createdFrom=2026-12-01&createdTo=2026-11-01', 'GET', accessToken)).status, 400);

      const created = await request('/patients', 'POST', accessToken, {
        firstName: 'Lucía',
        lastName: 'Rojas',
        maritalStatus: ' Soltera ',
        occupation: 'Docente',
        origin: '',
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.maritalStatus, 'Soltera');
      assert.equal(created.body.occupation, 'Docente');
      assert.equal(created.body.origin, null);
    });
  },
);
