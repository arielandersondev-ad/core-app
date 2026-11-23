import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SignJWT } from 'jose';

const READ = 'dentistry:files:read';
const CREATE = 'dentistry:files:create';
const DELETE = 'dentistry:files:delete';
const PDF = new TextEncoder().encode('%PDF-1.4\n% prueba\n');
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

test(
  'archivos clínicos aplican JWT, permisos, plan, alcance y verificación de la subida',
  { timeout: 60_000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'clinical-file-http-'));
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
    // Nunca usar una conexión desplegada ni un bucket real al importar providers.
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('STORAGE_')) delete process.env[key];
    }
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://isolated:isolated@127.0.0.1:1/never_connect',
      FRONTEND_URL: 'http://127.0.0.1:3000',
      JWT_PUBLIC_KEY_PATH: keyPath,
      JWT_ISSUER: 'clinical-file-http-tests',
      JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
    });
    const { ClinicalFileModule } = await import('../dist/modules/clinical-file/clinical-file.module.js');
    const { ClinicalFileRepository } = await import(
      '../dist/modules/clinical-file/domain/repositories/clinical-file.repository.js'
    );
    const { FileStorage } = await import('../dist/modules/clinical-file/application/ports/file-storage.js');
    const { PatientModule } = await import('../dist/modules/patient/patient.module.js');
    const { PatientRepository } = await import('../dist/modules/patient/domain/repositories/patient.repository.js');
    const { DentistryAuthModule } = await import('../dist/modules/auth/dentistry-auth.module.js');
    const { createPaginatedResult } = await import('../dist/common/pagination/pagination.js');
    const { PlanEntitlementsReader } = await import(
      '../dist/modules/auth/application/ports/plan-entitlements.reader.js'
    );
    const { parsePlanEntitlements } = await import(
      '../dist/modules/auth/application/contracts/plan-entitlements.js'
    );
    const { StoredObjectTooLargeError } = await import(
      '../dist/modules/clinical-file/domain/errors/file-storage.errors.js'
    );
    ({ db } = await import('../dist/prisma/db.js'));

    const FILE_LIMITS = { fileStorageBytes: 50 * 1024 * 1024, filesPerPatient: 20 };
    const planWith = (features, limits = FILE_LIMITS) =>
      parsePlanEntitlements({
        schemaVersion: 1,
        limits: { patients: 300, members: 2, branches: 1, ...limits },
        features,
      });
    const WITH_FILES = { clinicalHistory: true, files: true };
    let currentPlan = planWith(WITH_FILES);

    const branchId = randomUUID();
    const principal = {
      sub: randomUUID(),
      organizationId: randomUUID(),
      membershipId: randomUUID(),
      branchIds: [branchId],
      permissions: [READ, CREATE, DELETE],
    };

    // ---- Pacientes y atenciones en memoria --------------------------------
    const patients = new Map();
    const seedPatient = (organizationId) => {
      const patient = { id: randomUUID(), organizationId, deletedAt: null };
      patients.set(patient.id, patient);
      return patient;
    };
    const patient = seedPatient(principal.organizationId);
    const foreignPatient = seedPatient(randomUUID());
    const patientRepository = {
      async findById(id, organizationId) {
        const row = patients.get(id);
        return row?.organizationId === organizationId ? row : null;
      },
    };
    const encounters = new Map();
    const seedEncounter = (overrides = {}) => {
      const encounter = { id: randomUUID(), patientId: patient.id, branchId, status: 'IN_PROGRESS', ...overrides };
      encounters.set(encounter.id, encounter);
      return encounter;
    };

    // ---- Archivos en memoria ----------------------------------------------
    const files = new Map();
    const audit = [];
    const inScope = (scope, row) =>
      row && row.organizationId === scope.organizationId && row.patientId === scope.patientId;
    const fileRepository = {
      reservations: [],
      async reserve(data, quota) {
        this.reservations.push(quota);
        const now = new Date();
        const row = {
          id: randomUUID(), treatmentId: null, appointmentId: null, checksumSha256: null,
          uploadedAt: null, deletedAt: null, deletedByMembershipId: null,
          createdAt: now, updatedAt: now, ...data, uploadStatus: 'PENDING',
        };
        files.set(row.id, row);
        return { ...row };
      },
      async findById(scope, id) {
        const row = files.get(id);
        return inScope(scope, row) && row.deletedAt === null ? { ...row } : null;
      },
      async findPage(filters) {
        const items = [...files.values()].filter((row) =>
          inScope(filters, row) && row.deletedAt === null && row.uploadStatus === 'READY');
        return createPaginatedResult(items, { page: 1, pageSize: 20 }, items.length);
      },
      async markReady(scope, id, change) {
        const row = files.get(id);
        if (!inScope(scope, row) || row.uploadStatus !== 'PENDING') return null;
        Object.assign(row, { uploadStatus: 'READY', uploadedAt: change.uploadedAt, uploadExpiresAt: null,
          checksumSha256: change.checksumSha256 });
        audit.push({ action: 'CLINICAL_FILE_UPLOADED', id });
        return { ...row };
      },
      async markFailed(scope, id) {
        const row = files.get(id);
        if (inScope(scope, row) && row.uploadStatus === 'PENDING') {
          Object.assign(row, { uploadStatus: 'FAILED', uploadExpiresAt: null });
        }
      },
      async softDelete(scope, id, actor, now) {
        const row = files.get(id);
        if (!inScope(scope, row) || row.deletedAt) return null;
        Object.assign(row, { deletedAt: now, deletedByMembershipId: actor });
        audit.push({ action: 'CLINICAL_FILE_DELETED', id });
        return { ...row };
      },
      async usage() {
        return { usedBytes: [...files.values()].filter((row) => row.uploadStatus === 'READY')
          .reduce((sum, row) => sum + row.sizeBytes, 0) };
      },
      async findEncounter(scope, encounterId) {
        const row = encounters.get(encounterId);
        return row && row.patientId === scope.patientId ? { branchId: row.branchId, status: row.status } : null;
      },
    };

    // ---- Almacenamiento simulado ------------------------------------------
    const objects = new Map();
    const deleted = [];
    const storage = Object.assign(Object.create(FileStorage.prototype), {
      provider: 'BACKBLAZE_B2',
      bucket: 'test-bucket',
      available: true,
      async createUploadRequest(input) {
        return { url: `https://storage.test/${input.objectKey}?sig=up`, method: 'PUT',
          headers: { 'Content-Type': input.contentType }, expiresAt: new Date(Date.now() + 300_000) };
      },
      async createDownloadRequest(input) {
        return { url: `https://storage.test/${input.objectKey}?sig=down&d=${input.disposition}`, method: 'GET',
          headers: {}, expiresAt: new Date(Date.now() + 120_000) };
      },
      async getObjectInfo(key) {
        const bytes = objects.get(key);
        return bytes ? { sizeBytes: bytes.byteLength, contentType: null } : null;
      },
      async readObject(key, maxBytes) {
        const bytes = objects.get(key);
        if (bytes.byteLength > maxBytes) throw new StoredObjectTooLargeError(maxBytes);
        return bytes;
      },
      async deleteObject(key) {
        deleted.push(key);
        objects.delete(key);
      },
    });

    const replacements = new Map([
      [ClinicalFileRepository, fileRepository],
      [PatientRepository, patientRepository],
      [FileStorage, storage],
    ]);
    const withFakes = (providers) =>
      providers.map((provider) =>
        replacements.has(provider.provide)
          ? { provide: provider.provide, useValue: replacements.get(provider.provide) }
          : provider,
      );
    class ClinicalFileHttpTestModule {}
    Module({
      imports: [DentistryAuthModule],
      controllers: Reflect.getMetadata('controllers', ClinicalFileModule),
      providers: [
        ...withFakes([
          ...Reflect.getMetadata('providers', ClinicalFileModule),
          ...Reflect.getMetadata('providers', PatientModule),
        ]),
        { provide: PlanEntitlementsReader, useValue: { read: async () => currentPlan } },
      ],
    })(ClinicalFileHttpTestModule);
    app = await NestFactory.create(ClinicalFileHttpTestModule, { logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();

    async function token(overrides = {}) {
      const now = Math.floor(Date.now() / 1000);
      return new SignJWT({ ...principal, ...overrides })
        .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'clinical-file-test' })
        .setIssuer(process.env.JWT_ISSUER)
        .setAudience('dentistry-api')
        .setIssuedAt(now - 120)
        .setExpirationTime(now + 300)
        .setJti(randomUUID())
        .sign(privateKey);
    }
    const full = await token();
    async function request(path, method = 'GET', body, accessToken = full) {
      const response = await fetch(baseUrl + path, {
        method,
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const text = await response.text();
      return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
    }
    const base = `/patients/${patient.id}/clinical-files`;
    const uploadBody = (overrides = {}) => ({
      category: 'DOCUMENT',
      originalFilename: 'Consentimiento\r\n"firmado".pdf',
      mimeType: 'application/pdf',
      sizeBytes: PDF.byteLength,
      ...overrides,
    });
    /** Reserva, "sube" los bytes al almacenamiento simulado y devuelve el ticket. */
    async function reserveAndPut(bytes = PDF, overrides = {}) {
      const res = await request(`${base}/uploads`, 'POST', uploadBody({ sizeBytes: bytes.byteLength, ...overrides }));
      assert.equal(res.status, 201, JSON.stringify(res.body));
      const key = new URL(res.body.upload.url).pathname.slice(1);
      objects.set(key, bytes);
      return { ...res.body, key };
    }

    await t.test('cada ruta exige token y su permiso exacto', async () => {
      assert.equal((await request(base, 'GET', undefined, null)).status, 401);
      const readOnly = await token({ permissions: [READ] });
      assert.equal((await request(base, 'GET', undefined, readOnly)).status, 200);
      assert.equal((await request(`${base}/uploads`, 'POST', uploadBody(), readOnly)).status, 403);
      assert.equal((await request(`${base}/${randomUUID()}`, 'DELETE', undefined, readOnly)).status, 403);
      const noRead = await token({ permissions: [CREATE] });
      assert.equal((await request(base, 'GET', undefined, noRead)).status, 403);
      assert.equal((await request('/clinical-files/quota', 'GET', undefined, noRead)).status, 403);
    });

    await t.test('subir exige la función files; leer no', async () => {
      currentPlan = planWith({ clinicalHistory: true, files: false });
      try {
        const upload = await request(`${base}/uploads`, 'POST', uploadBody());
        assert.equal(upload.status, 403);
        assert.equal(upload.body.code, 'MODULE_NOT_IN_PLAN');
        assert.equal((await request(base)).status, 200);
      } finally {
        currentPlan = planWith(WITH_FILES);
      }
    });

    await t.test('un plan con files pero sin cupos definidos no permite subir', async () => {
      currentPlan = planWith(WITH_FILES, {});
      try {
        const res = await request(`${base}/uploads`, 'POST', uploadBody());
        assert.equal(res.status, 403);
        assert.equal(res.body.code, 'CLINICAL_FILE_QUOTA_UNDEFINED');
      } finally {
        currentPlan = planWith(WITH_FILES);
      }
    });

    await t.test('valida tipo, tamaño y paciente antes de reservar', async () => {
      const svg = await request(`${base}/uploads`, 'POST', uploadBody({ mimeType: 'image/svg+xml' }));
      assert.equal(svg.status, 422);
      assert.equal(svg.body.code, 'CLINICAL_FILE_TYPE_NOT_ALLOWED');
      assert.equal((await request(`${base}/uploads`, 'POST', uploadBody({ sizeBytes: 10 * 1024 * 1024 + 1 }))).status, 400);
      assert.equal((await request(`${base}/uploads`, 'POST', uploadBody({ sizeBytes: 0 }))).status, 400);
      assert.equal((await request(`${base}/uploads`, 'POST', uploadBody({ category: 'XRAY' }))).status, 400);
      assert.equal((await request(`${base}/uploads`, 'POST', uploadBody({ capturedAt: '2026-11-20T10:00' }))).status, 400);
      const foreign = await request(`/patients/${foreignPatient.id}/clinical-files/uploads`, 'POST', uploadBody());
      assert.equal(foreign.status, 404);
      assert.equal(foreign.body.code, 'PATIENT_NOT_FOUND');
    });

    await t.test('la atención vinculada debe ser del paciente, accesible y no anulada', async () => {
      const other = await request(`${base}/uploads`, 'POST', uploadBody({ clinicalEncounterId: randomUUID() }));
      assert.equal(other.status, 404);
      const foreignBranch = seedEncounter({ branchId: randomUUID() });
      assert.equal((await request(`${base}/uploads`, 'POST', uploadBody({ clinicalEncounterId: foreignBranch.id }))).status, 403);
      const voided = seedEncounter({ status: 'VOIDED' });
      const res = await request(`${base}/uploads`, 'POST', uploadBody({ clinicalEncounterId: voided.id }));
      assert.equal(res.status, 409);
      assert.equal(res.body.code, 'ENCOUNTER_VOIDED');
    });

    await t.test('reserva PENDING con clave opaca y sin exponer la ubicación', async () => {
      const encounter = seedEncounter();
      const res = await request(`${base}/uploads`, 'POST', uploadBody({
        clinicalEncounterId: encounter.id, capturedAt: '2026-11-20T10:00:00-04:00', description: '  Consentimiento  ',
      }));
      assert.equal(res.status, 201);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      const { file, upload } = res.body;
      assert.equal(file.uploadStatus, 'PENDING');
      assert.equal(file.originalFilename, 'Consentimiento_firmado_.pdf');
      assert.equal(file.description, 'Consentimiento');
      assert.equal(file.capturedAt, '2026-11-20T14:00:00.000Z');
      assert.equal(file.clinicalEncounterId, encounter.id);
      for (const hidden of ['objectKey', 'bucket', 'storageProvider', 'checksumSha256']) {
        assert.equal(hidden in file, false, hidden);
      }
      assert.equal(upload.method, 'PUT');
      assert.deepEqual(upload.headers, { 'Content-Type': 'application/pdf' });
      const stored = files.get(file.id);
      assert.match(stored.objectKey, new RegExp(`^dentistry/${principal.organizationId}/${patient.id}/[0-9a-f-]{36}\\.pdf$`));
      assert.equal(stored.storageProvider, 'BACKBLAZE_B2');
      assert.equal(stored.bucket, 'test-bucket');
      assert.ok(stored.uploadExpiresAt > new Date());
      assert.deepEqual(fileRepository.reservations.at(-1), FILE_LIMITS);
      // Un PENDING no aparece en la galería ni da enlace de lectura.
      assert.equal((await request(base)).body.items.some((item) => item.id === file.id), false);
      assert.equal((await request(`${base}/${file.id}/access-url`)).status, 409);
    });

    await t.test('confirmar verifica el objeto y lo publica con SHA-256', async () => {
      const res = await request(`${base}/uploads`, 'POST', uploadBody());
      const missing = await request(`${base}/${res.body.file.id}/complete`, 'POST');
      assert.equal(missing.status, 409);
      assert.equal(missing.body.code, 'CLINICAL_FILE_UPLOAD_MISSING');
      assert.equal(files.get(res.body.file.id).uploadStatus, 'PENDING');

      objects.set(new URL(res.body.upload.url).pathname.slice(1), PDF);
      const done = await request(`${base}/${res.body.file.id}/complete`, 'POST');
      assert.equal(done.status, 200);
      assert.equal(done.body.uploadStatus, 'READY');
      assert.ok(done.body.uploadedAt);
      assert.equal(files.get(res.body.file.id).checksumSha256, createHash('sha256').update(PDF).digest('hex'));
      assert.ok(audit.some((entry) => entry.action === 'CLINICAL_FILE_UPLOADED' && entry.id === res.body.file.id));
      // Idempotente: repetir la confirmación devuelve el archivo listo.
      assert.equal((await request(`${base}/${res.body.file.id}/complete`, 'POST')).status, 200);
      const list = await request(base);
      assert.ok(list.body.items.some((item) => item.id === res.body.file.id));
    });

    await t.test('rechaza y elimina un objeto con tipo falsificado o tamaño distinto', async () => {
      const disguised = await reserveAndPut(PNG, { mimeType: 'application/pdf' });
      const fake = await request(`${base}/${disguised.file.id}/complete`, 'POST');
      assert.equal(fake.status, 422);
      assert.equal(fake.body.code, 'CLINICAL_FILE_UPLOAD_REJECTED');
      assert.equal(files.get(disguised.file.id).uploadStatus, 'FAILED');
      assert.ok(deleted.includes(disguised.key));
      assert.equal((await request(`${base}/${disguised.file.id}/complete`, 'POST')).status, 409);

      const resized = await reserveAndPut(PDF);
      objects.set(resized.key, new Uint8Array([...PDF, 0x20]));
      assert.equal((await request(`${base}/${resized.file.id}/complete`, 'POST')).status, 422);
      assert.ok(deleted.includes(resized.key));
    });

    await t.test('una reserva vencida no se puede confirmar', async () => {
      const ticket = await reserveAndPut(PNG, { mimeType: 'image/png', category: 'PHOTO' });
      files.get(ticket.file.id).uploadExpiresAt = new Date(Date.now() - 1000);
      const res = await request(`${base}/${ticket.file.id}/complete`, 'POST');
      assert.equal(res.status, 409);
      assert.equal(res.body.code, 'CLINICAL_FILE_UPLOAD_EXPIRED');
      assert.equal(files.get(ticket.file.id).uploadStatus, 'FAILED');
    });

    await t.test('el enlace de lectura es firmado, corto y no se cachea', async () => {
      const ticket = await reserveAndPut(PNG, { mimeType: 'image/png', category: 'PHOTO' });
      await request(`${base}/${ticket.file.id}/complete`, 'POST');
      const inline = await request(`${base}/${ticket.file.id}/access-url`);
      assert.equal(inline.status, 200);
      assert.equal(inline.headers.get('cache-control'), 'no-store');
      assert.match(inline.body.url, /d=inline$/);
      const download = await request(`${base}/${ticket.file.id}/access-url?disposition=attachment`);
      assert.match(download.body.url, /d=attachment$/);
      assert.equal((await request(`${base}/${ticket.file.id}/access-url?disposition=raw`)).status, 400);
      const foreign = await request(`/patients/${foreignPatient.id}/clinical-files/${ticket.file.id}/access-url`);
      assert.equal(foreign.status, 404);
    });

    await t.test('eliminar es lógico, auditado y oculta el archivo', async () => {
      const ticket = await reserveAndPut();
      await request(`${base}/${ticket.file.id}/complete`, 'POST');
      assert.equal((await request(`${base}/${ticket.file.id}`, 'DELETE')).status, 204);
      assert.ok(files.get(ticket.file.id).deletedAt);
      assert.equal(files.get(ticket.file.id).deletedByMembershipId, principal.membershipId);
      assert.ok(objects.has(ticket.key), 'el objeto se conserva hasta definir retención');
      assert.ok(audit.some((entry) => entry.action === 'CLINICAL_FILE_DELETED'));
      assert.equal((await request(`${base}/${ticket.file.id}`, 'DELETE')).status, 404);
      assert.equal((await request(`${base}/${ticket.file.id}/access-url`)).status, 404);
    });

    await t.test('el cupo informa uso, límites y tipos admitidos', async () => {
      const res = await request('/clinical-files/quota');
      assert.equal(res.status, 200);
      assert.equal(res.body.limitBytes, FILE_LIMITS.fileStorageBytes);
      assert.equal(res.body.filesPerPatient, FILE_LIMITS.filesPerPatient);
      assert.equal(res.body.maxFileBytes, 10 * 1024 * 1024);
      assert.deepEqual(res.body.allowedMimeTypes, ['image/jpeg', 'image/png', 'application/pdf']);
      assert.equal(res.body.storageAvailable, true);
      assert.ok(res.body.usedBytes > 0);
    });

    await t.test('sin almacenamiento configurado responde 503 sin tocar la base', async () => {
      storage.available = false;
      try {
        const before = files.size;
        const res = await request(`${base}/uploads`, 'POST', uploadBody());
        assert.equal(res.status, 503);
        assert.equal(res.body.code, 'CLINICAL_FILE_STORAGE_UNAVAILABLE');
        assert.equal(files.size, before);
        assert.equal((await request(base)).status, 200);
      } finally {
        storage.available = true;
      }
    });
  },
);
