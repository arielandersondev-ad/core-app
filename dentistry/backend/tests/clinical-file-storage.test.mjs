import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStorageConfig } from '../dist/config/storage-env.js';
import { buildClinicalFileObjectKey } from '../dist/modules/clinical-file/domain/value-objects/clinical-file-object-key.js';
import {
  FileStorageError,
  FileStorageUnavailableError,
  StoredObjectNotFoundError,
  StoredObjectTooLargeError,
} from '../dist/modules/clinical-file/domain/errors/file-storage.errors.js';
import { buildContentDisposition } from '../dist/modules/clinical-file/infrastructure/storage/content-disposition.js';
import { sanitizeFilename } from '../dist/modules/clinical-file/domain/value-objects/filename.js';
import { S3CompatibleFileStorage } from '../dist/modules/clinical-file/infrastructure/storage/s3-compatible-file-storage.js';
import { UnavailableFileStorage } from '../dist/modules/clinical-file/infrastructure/storage/unavailable-file-storage.js';

const B2_ENV = {
  STORAGE_PROVIDER: 'BACKBLAZE_B2',
  STORAGE_ENDPOINT: 'https://s3.us-west-004.backblazeb2.com',
  STORAGE_REGION: 'us-west-004',
  STORAGE_BUCKET: 'dentistry-demo-files',
  STORAGE_ACCESS_KEY_ID: 'test-key-id',
  STORAGE_SECRET_ACCESS_KEY: 'test-secret',
};

const ORG = '0190f3a2-0000-7000-8000-000000000001';
const PATIENT = '0190f3a2-0000-7000-8000-000000000002';
const FILE = '0190f3a2-0000-7000-8000-000000000003';

function storage(client) {
  return new S3CompatibleFileStorage(parseStorageConfig(B2_ENV), client);
}

/** Cliente S3 simulado: responde según el nombre del comando. */
function fakeClient(handlers) {
  const calls = [];
  return {
    calls,
    send: async (command) => {
      calls.push(command);
      const handler = handlers[command.constructor.name];
      if (!handler) throw new Error(`Comando inesperado ${command.constructor.name}`);
      return handler(command.input);
    },
  };
}

const notFound = () => {
  throw Object.assign(new Error('Not Found'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
};

test('sin variables STORAGE_* el almacenamiento queda deshabilitado', () => {
  assert.equal(parseStorageConfig({}), null);
  assert.equal(parseStorageConfig({ STORAGE_BUCKET: '  ' }), null);
});

test('lee una configuración completa de Backblaze B2', () => {
  assert.deepEqual(parseStorageConfig(B2_ENV), {
    provider: 'BACKBLAZE_B2',
    endpoint: 'https://s3.us-west-004.backblazeb2.com',
    region: 'us-west-004',
    bucket: 'dentistry-demo-files',
    accessKeyId: 'test-key-id',
    secretAccessKey: 'test-secret',
    forcePathStyle: false,
  });
});

test('una configuración parcial o inválida impide arrancar', () => {
  assert.throws(
    () => parseStorageConfig({ ...B2_ENV, STORAGE_SECRET_ACCESS_KEY: '' }),
    /falta STORAGE_SECRET_ACCESS_KEY/,
  );
  assert.throws(() => parseStorageConfig({ ...B2_ENV, STORAGE_PROVIDER: 'DROPBOX' }), /STORAGE_PROVIDER/);
  assert.throws(
    () => parseStorageConfig({ ...B2_ENV, STORAGE_ENDPOINT: 'http://s3.us-west-004.backblazeb2.com' }),
    /https/,
  );
  assert.throws(
    () => parseStorageConfig({ ...B2_ENV, STORAGE_ENDPOINT: 'https://user:pw@s3.example.com' }),
    /https/,
  );
  assert.throws(() => parseStorageConfig({ ...B2_ENV, STORAGE_BUCKET: 'a/b' }), /STORAGE_BUCKET/);
  assert.throws(() => parseStorageConfig({ ...B2_ENV, STORAGE_FORCE_PATH_STYLE: 'yes' }), /PATH_STYLE/);
});

test('MinIO local admite http en localhost y usa path-style', () => {
  const config = parseStorageConfig({
    ...B2_ENV,
    STORAGE_PROVIDER: 'MINIO',
    STORAGE_ENDPOINT: 'http://localhost:9000',
  });
  assert.equal(config.endpoint, 'http://localhost:9000');
  assert.equal(config.forcePathStyle, true);
});

test('AWS S3 no requiere endpoint', () => {
  const config = parseStorageConfig({ ...B2_ENV, STORAGE_PROVIDER: 'AWS_S3', STORAGE_ENDPOINT: '' });
  assert.equal(config.endpoint, null);
});

test('la clave del objeto solo contiene identificadores opacos', () => {
  assert.equal(
    buildClinicalFileObjectKey({ organizationId: ORG, patientId: PATIENT, objectId: FILE, extension: 'pdf' }),
    `dentistry/${ORG}/${PATIENT}/${FILE}.pdf`,
  );
  assert.throws(
    () => buildClinicalFileObjectKey({ organizationId: 'juan-perez', patientId: PATIENT, objectId: FILE, extension: 'pdf' }),
    RangeError,
  );
  assert.throws(
    () => buildClinicalFileObjectKey({ organizationId: ORG, patientId: PATIENT, objectId: FILE, extension: '../x' }),
    RangeError,
  );
});

test('el nombre aportado se sanea antes de usarse en cabeceras', () => {
  assert.equal(sanitizeFilename('../../etc/passwd'), '.._.._etc_passwd');
  assert.equal(sanitizeFilename('a\r\nb"c\\d.pdf'), 'ab_c_d.pdf');
  assert.equal(sanitizeFilename('   '), 'archivo');
  assert.equal(Array.from(sanitizeFilename('x'.repeat(500))).length, 200);
  assert.equal(
    buildContentDisposition('attachment', "Radiografía (1)'s.pdf"),
    "attachment; filename=\"Radiograf_a (1)'s.pdf\"; filename*=UTF-8''Radiograf%C3%ADa%20%281%29%27s.pdf",
  );
});

test('la subida firmada fija tipo y tamaño exactos sin sumas flexibles', async () => {
  const request = await storage().createUploadRequest({
    objectKey: `dentistry/${ORG}/${PATIENT}/${FILE}.pdf`,
    contentType: 'application/pdf',
    sizeBytes: 2048,
    expiresInSeconds: 300,
  });
  const url = new URL(request.url);
  assert.equal(request.method, 'PUT');
  assert.equal(url.hostname, 'dentistry-demo-files.s3.us-west-004.backblazeb2.com');
  assert.equal(url.pathname, `/dentistry/${ORG}/${PATIENT}/${FILE}.pdf`);
  assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'content-length;content-type;host');
  assert.equal(url.searchParams.get('X-Amz-Expires'), '300');
  assert.ok(![...url.searchParams.keys()].some((key) => /checksum/i.test(key)));
  assert.deepEqual(request.headers, { 'Content-Type': 'application/pdf' });
  assert.ok(Math.abs(request.expiresAt.getTime() - (Date.now() + 300_000)) < 5_000);
});

test('la descarga firmada fuerza tipo, disposición y no-store', async () => {
  const request = await storage().createDownloadRequest({
    objectKey: 'dentistry/x.png',
    contentType: 'image/png',
    filename: 'foto intraoral.png',
    disposition: 'inline',
    expiresInSeconds: 60,
  });
  const url = new URL(request.url);
  assert.equal(request.method, 'GET');
  assert.equal(url.searchParams.get('response-content-type'), 'image/png');
  assert.equal(url.searchParams.get('response-cache-control'), 'private, no-store');
  assert.match(url.searchParams.get('response-content-disposition'), /^inline; filename="foto intraoral.png"/);
});

test('rechaza vigencias y tamaños fuera de rango', async () => {
  const s = storage();
  const base = { objectKey: 'k', contentType: 'image/png', sizeBytes: 1, expiresInSeconds: 60 };
  await assert.rejects(s.createUploadRequest({ ...base, expiresInSeconds: 0 }), RangeError);
  await assert.rejects(s.createUploadRequest({ ...base, expiresInSeconds: 3601 }), RangeError);
  await assert.rejects(s.createUploadRequest({ ...base, sizeBytes: 0 }), RangeError);
  await assert.rejects(s.createUploadRequest({ ...base, sizeBytes: 1.5 }), RangeError);
});

test('consulta metadatos y trata 404 como objeto inexistente', async () => {
  const found = storage(fakeClient({
    HeadObjectCommand: () => ({ ContentLength: 2048, ContentType: 'application/pdf' }),
  }));
  assert.deepEqual(await found.getObjectInfo('k'), { sizeBytes: 2048, contentType: 'application/pdf' });

  const missing = storage(fakeClient({ HeadObjectCommand: notFound }));
  assert.equal(await missing.getObjectInfo('k'), null);

  const failing = storage(fakeClient({
    HeadObjectCommand: () => { throw Object.assign(new Error('secret bucket detail'), { $metadata: { httpStatusCode: 500 } }); },
  }));
  await assert.rejects(failing.getObjectInfo('k'), (error) =>
    error instanceof FileStorageError && !error.message.includes('secret'));
});

test('la lectura se limita al tamaño máximo', async () => {
  const body = (bytes) => ({ Body: { transformToByteArray: async () => new Uint8Array(bytes) } });
  const client = fakeClient({ GetObjectCommand: () => body(4) });
  assert.equal((await storage(client).readObject('k', 4)).byteLength, 4);
  assert.equal(client.calls[0].input.Range, 'bytes=0-4');

  const tooLarge = storage(fakeClient({ GetObjectCommand: () => body(5) }));
  await assert.rejects(tooLarge.readObject('k', 4), StoredObjectTooLargeError);

  const missing = storage(fakeClient({ GetObjectCommand: notFound }));
  await assert.rejects(missing.readObject('k', 4), StoredObjectNotFoundError);
});

test('eliminar es idempotente', async () => {
  const client = fakeClient({ DeleteObjectCommand: notFound });
  await storage(client).deleteObject('k');
  assert.equal(client.calls[0].input.Bucket, 'dentistry-demo-files');
  assert.equal(client.calls[0].input.Key, 'k');
});

test('sin configuración todas las operaciones fallan como no disponibles', async () => {
  const s = new UnavailableFileStorage();
  assert.equal(s.available, false);
  await assert.rejects(s.createUploadRequest(), FileStorageUnavailableError);
  await assert.rejects(s.getObjectInfo(), FileStorageUnavailableError);
  await assert.rejects(s.deleteObject(), FileStorageUnavailableError);
});
