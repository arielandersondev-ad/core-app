import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPrivateKey, createPublicKey } from 'node:crypto';

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Configuración: falta ${name}`);
  }

  return value;
}

function integer(name: string, fallback: number, max: number): number {
  const raw = process.env[name] ?? String(fallback);
  const value = Number(raw);

  if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(value) || value > max) {
    throw new Error(`Configuración: ${name} debe ser un entero entre 1 y ${max}`);
  }

  return value;
}

function validateEnvironment(service: 'core' | 'dentistry') {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('Configuración: NODE_ENV inválido');
  }

  const databaseUrl = required('DATABASE_URL');

  try {
    const url = new URL(databaseUrl);

    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length <= 1
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('Configuración: DATABASE_URL debe ser una URL PostgreSQL válida');
  }

  const frontendOrigins = required('FRONTEND_URL')
    .split(',')
    .map((value) => value.trim());

  for (const origin of frontendOrigins) {
    try {
      const url = new URL(origin);

      // Solo admite orígenes: protocolo, dominio y puerto opcional.
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      ) {
        throw new Error();
      }
    } catch {
      throw new Error('Configuración: FRONTEND_URL contiene un origen inválido');
    }
  }

  required('JWT_ISSUER');

  const publicKey = (() => {
    try {
      const pem = readFileSync(required('JWT_PUBLIC_KEY_PATH'), 'utf8');

      if (!/^-----BEGIN (?:RSA )?PUBLIC KEY-----/m.test(pem)) {
        throw new Error();
      }

      const key = createPublicKey(pem);

      if (key.asymmetricKeyType !== 'rsa') throw new Error();

      return key;
    } catch {
      throw new Error('Configuración: JWT_PUBLIC_KEY_PATH debe apuntar a una clave pública RSA PEM legible');
    }
  })();

  if (service === 'core') {
    required('JWT_KEY_ID');
    integer('JWT_EXPIRES_IN_SECONDS', 1800, 1800);

    if (required('JWT_CORE_AUDIENCE') !== 'core-api') {
      throw new Error('Configuración: JWT_CORE_AUDIENCE debe ser core-api');
    }

    const organizationId = required('CORE_ADMIN_ORGANIZATION_ID');
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid.test(organizationId)) {
      throw new Error('Configuración: CORE_ADMIN_ORGANIZATION_ID debe ser un UUID válido');
    }

    try {
      const privateKey = createPrivateKey(
        readFileSync(required('JWT_PRIVATE_KEY_PATH'), 'utf8'),
      );

      if (privateKey.asymmetricKeyType !== 'rsa') throw new Error();

      const derived = createPublicKey(privateKey).export({
        type: 'spki',
        format: 'der',
      });
      const expected = publicKey.export({ type: 'spki', format: 'der' });

      if (!derived.equals(expected)) throw new Error();
    } catch {
      throw new Error('Configuración: la clave privada RSA es inválida o no corresponde a la pública');
    }
  } else if (required('JWT_DENTISTRY_AUDIENCE') !== 'dentistry-api') {
    throw new Error('Configuración: JWT_DENTISTRY_AUDIENCE debe ser dentistry-api');
  }

  return {
    nodeEnv,
    databaseUrl,
    port: integer('PORT', service === 'core' ? 3002 : 3004, 65535),
    frontendOrigins: [...new Set(
      frontendOrigins.map((origin) => new URL(origin).origin),
    )],
  };
}
export const env = validateEnvironment('dentistry');
