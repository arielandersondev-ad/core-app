import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SignJWT } from 'jose';

const directory = mkdtempSync(join(tmpdir(), 'dentistry-auth-test-'));
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKeyPath = join(directory, 'public.pem');
writeFileSync(publicKeyPath, publicKey.export({ type: 'spki', format: 'pem' }));
process.env.JWT_PUBLIC_KEY_PATH = publicKeyPath;
process.env.JWT_ISSUER = 'core-auth';
process.env.JWT_DENTISTRY_AUDIENCE = 'dentistry-api';
after(() => rmSync(directory, { recursive: true, force: true }));

const { DentistryTokenVerifier } = await import('../dist/modules/auth/infrastructure/jwt/dentistry-token.verifier.js');
const { GetAppointmentByIdUseCase } = await import('../dist/modules/appointment/application/use-case/get-appointment-by-id.use-case.js');
const verifier = new DentistryTokenVerifier();

const principal = {
  membershipId: randomUUID(),
  organizationId: randomUUID(),
  branchIds: [randomUUID()],
  permissions: ['dentistry:appointments:read'],
};

async function token(overrides = {}, audience = 'dentistry-api', lifetime = 900) {
  return new SignJWT({ ...principal, ...overrides })
    .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'test-key' })
    .setSubject(randomUUID())
    .setJti(randomUUID())
    .setIssuer('core-auth')
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${lifetime}s`)
    .sign(privateKey);
}

test('acepta un access token Dentistry válido', async () => {
  const result = await verifier.verify(await token());
  assert.equal(result.organizationId, principal.organizationId);
  assert.deepEqual(result.permissions, principal.permissions);
});

test('rechaza una audiencia Core y una audiencia múltiple', async () => {
  await assert.rejects(verifier.verify(await token({}, 'core-api')));
  await assert.rejects(verifier.verify(await token({}, ['dentistry-api', 'core-api'])));
});

test('rechaza permisos de otra API y vigencia mayor de 15 minutos', async () => {
  await assert.rejects(verifier.verify(await token({ permissions: ['users:create'] })));
  await assert.rejects(verifier.verify(await token({}, 'dentistry-api', 3600)));
});

test('la lectura exige organización y sucursal autorizadas', async () => {
  let requestedOrganization;
  const repository = {
    findById: async (_id, organizationId) => {
      requestedOrganization = organizationId;
      return { branchId: randomUUID() };
    },
  };
  const useCase = new GetAppointmentByIdUseCase(repository);
  await assert.rejects(
    useCase.execute(randomUUID(), principal.organizationId, principal.branchIds),
    { status: 403 },
  );
  assert.equal(requestedOrganization, principal.organizationId);
});
