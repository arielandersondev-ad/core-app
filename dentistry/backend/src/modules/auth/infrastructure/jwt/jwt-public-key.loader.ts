import { createPublicKey, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadJwtPublicKey(): KeyObject {
  const path = process.env['JWT_PUBLIC_KEY_PATH'];
  if (!path) throw new Error('JWT_PUBLIC_KEY_PATH es obligatorio');
  const pem = readFileSync(resolve(path), 'utf8');
  if (!/^-----BEGIN (?:RSA )?PUBLIC KEY-----/m.test(pem)) {
    throw new Error('JWT_PUBLIC_KEY_PATH debe apuntar a una clave pública PEM');
  }
  const key = createPublicKey(pem);
  if (key.asymmetricKeyType !== 'rsa') {
    throw new Error('La clave pública JWT debe ser RSA');
  }
  return key;
}
