// Prueba de humo contra el bucket configurado en .env (STORAGE_*).
// Requiere `npm run build`. Crea un objeto bajo dentistry/_smoke/ y lo elimina.
//   npm run storage:smoke
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { parseStorageConfig } from '../dist/config/storage-env.js';
import { S3CompatibleFileStorage } from '../dist/modules/clinical-file/infrastructure/storage/s3-compatible-file-storage.js';

const config = parseStorageConfig(process.env);
if (!config) {
  console.error('Faltan las variables STORAGE_* en .env');
  process.exit(1);
}

const storage = new S3CompatibleFileStorage(config);
const objectKey = `dentistry/_smoke/${randomUUID()}.pdf`;
const body = new TextEncoder().encode('%PDF-1.4\n% prueba de humo\n');
const origin = process.env.STORAGE_SMOKE_ORIGIN; // p. ej. http://localhost:3000 para probar CORS
const step = (label) => console.log(`✔ ${label}`);

async function expectStatus(response, expected, label) {
  if (response.status !== expected) {
    const text = await response.text();
    throw new Error(`${label}: HTTP ${response.status} (esperado ${expected})\n${text.slice(0, 500)}`);
  }
}

try {
  console.log(`Proveedor ${config.provider}, bucket ${config.bucket}`);

  const upload = await storage.createUploadRequest({
    objectKey, contentType: 'application/pdf', sizeBytes: body.byteLength, expiresInSeconds: 120,
  });

  const wrongSize = await fetch(upload.url, {
    method: 'PUT', headers: upload.headers, body: new Uint8Array([...body, 0x20]),
  });
  if (wrongSize.ok) throw new Error('El proveedor aceptó un cuerpo con tamaño distinto al firmado');
  step(`tamaño distinto rechazado (HTTP ${wrongSize.status})`);

  const wrongType = await fetch(upload.url, {
    method: 'PUT', headers: { 'Content-Type': 'text/html' }, body,
  });
  if (wrongType.ok) throw new Error('El proveedor aceptó un Content-Type distinto al firmado');
  step(`tipo distinto rechazado (HTTP ${wrongType.status})`);

  const put = await fetch(upload.url, {
    method: 'PUT',
    headers: { ...upload.headers, ...(origin ? { Origin: origin } : {}) },
    body,
  });
  await expectStatus(put, 200, 'Subida firmada');
  step('subida firmada');
  if (origin) {
    const allowed = put.headers.get('access-control-allow-origin');
    if (allowed !== origin && allowed !== '*') {
      throw new Error(`CORS: el bucket no permite el origen ${origin} (recibido ${allowed})`);
    }
    step(`CORS permite ${origin}`);
  }

  const info = await storage.getObjectInfo(objectKey);
  if (info?.sizeBytes !== body.byteLength) throw new Error(`HEAD inesperado: ${JSON.stringify(info)}`);
  step(`metadatos (${info.sizeBytes} bytes, ${info.contentType})`);

  const read = await storage.readObject(objectKey, 1024);
  if (Buffer.compare(Buffer.from(read), Buffer.from(body)) !== 0) throw new Error('Contenido leído distinto');
  step('lectura desde el backend');

  const download = await storage.createDownloadRequest({
    objectKey, contentType: 'application/pdf', filename: 'Prueba de humo ñ.pdf',
    disposition: 'attachment', expiresInSeconds: 60,
  });
  const get = await fetch(download.url);
  await expectStatus(get, 200, 'Descarga firmada');
  step(`descarga firmada (Content-Disposition: ${get.headers.get('content-disposition')})`);

  const anonymous = await fetch(download.url.split('?')[0]);
  if (anonymous.ok) throw new Error('El bucket es público: un GET sin firma devolvió 200');
  step(`acceso sin firma rechazado (HTTP ${anonymous.status})`);
} finally {
  await storage.deleteObject(objectKey).catch((error) => {
    console.error(`No se pudo eliminar ${objectKey}:`, error.message);
  });
}

if ((await storage.getObjectInfo(objectKey)) !== null) throw new Error('El objeto sigue existiendo');
step('objeto eliminado');
console.log('Prueba de humo superada');
