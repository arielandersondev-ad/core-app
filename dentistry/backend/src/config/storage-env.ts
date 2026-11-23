/**
 * Configuración del almacenamiento de objetos para archivos clínicos.
 *
 * Es opcional: sin ninguna variable STORAGE_* el backend arranca y las
 * operaciones de archivos responden como no disponibles. Una configuración
 * parcial es un error de arranque para no ocultar un despliegue incompleto.
 */

/** Valores de `ClinicalFile.storageProvider`: proveedor real, no protocolo. */
export const STORAGE_PROVIDERS = [
  'BACKBLAZE_B2',
  'AWS_S3',
  'CLOUDFLARE_R2',
  'MINIO',
] as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export type StorageConfig = {
  provider: StorageProvider;
  /** Endpoint S3 compatible; null usa el endpoint regional de AWS. */
  endpoint: string | null;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

type Source = Readonly<Record<string, string | undefined>>;

const KEYS = [
  'STORAGE_PROVIDER',
  'STORAGE_ENDPOINT',
  'STORAGE_REGION',
  'STORAGE_BUCKET',
  'STORAGE_ACCESS_KEY_ID',
  'STORAGE_SECRET_ACCESS_KEY',
  'STORAGE_FORCE_PATH_STYLE',
] as const;

const BUCKET = /^[A-Za-z0-9][A-Za-z0-9.-]{1,61}[A-Za-z0-9]$/;
const REGION = /^[a-z0-9-]{2,40}$/;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function fail(message: string): never {
  throw new Error(`Configuración: ${message}`);
}

function value(source: Source, name: string): string | undefined {
  const raw = source[name]?.trim();
  return raw ? raw : undefined;
}

function required(source: Source, name: string): string {
  return value(source, name) ?? fail(`almacenamiento incompleto, falta ${name}`);
}

function parseEndpoint(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail('STORAGE_ENDPOINT debe ser una URL válida');
  }
  const local = LOCAL_HOSTS.has(url.hostname);
  if (
    !(url.protocol === 'https:' || (url.protocol === 'http:' && local)) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    fail('STORAGE_ENDPOINT debe ser un origen https (http solo en localhost)');
  }
  return url.origin;
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fail('STORAGE_FORCE_PATH_STYLE debe ser true o false');
}

/** Devuelve null si no hay ninguna variable STORAGE_* definida. */
export function parseStorageConfig(source: Source): StorageConfig | null {
  if (!KEYS.some((name) => value(source, name) !== undefined)) return null;

  const provider = required(source, 'STORAGE_PROVIDER');
  if (!(STORAGE_PROVIDERS as readonly string[]).includes(provider)) {
    fail(`STORAGE_PROVIDER debe ser uno de ${STORAGE_PROVIDERS.join(', ')}`);
  }
  const typedProvider = provider as StorageProvider;

  const rawEndpoint =
    typedProvider === 'AWS_S3'
      ? value(source, 'STORAGE_ENDPOINT')
      : required(source, 'STORAGE_ENDPOINT');

  const region = required(source, 'STORAGE_REGION');
  if (!REGION.test(region)) fail('STORAGE_REGION inválida');

  const bucket = required(source, 'STORAGE_BUCKET');
  if (!BUCKET.test(bucket)) fail('STORAGE_BUCKET inválido');

  return {
    provider: typedProvider,
    endpoint: rawEndpoint ? parseEndpoint(rawEndpoint) : null,
    region,
    bucket,
    accessKeyId: required(source, 'STORAGE_ACCESS_KEY_ID'),
    secretAccessKey: required(source, 'STORAGE_SECRET_ACCESS_KEY'),
    forcePathStyle: parseBoolean(
      value(source, 'STORAGE_FORCE_PATH_STYLE'),
      typedProvider === 'MINIO',
    ),
  };
}
