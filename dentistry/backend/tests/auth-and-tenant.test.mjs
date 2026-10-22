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

async function token(overrides = {}, audience = 'dentistry-api', lifetime = 1800) {
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

test('rechaza permisos de otra API y vigencia mayor de 30 minutos', async () => {
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

test('el mapper conserva valores y asociaciones con los nombres nuevos de citas', async () => {
  const { toAppointmentEntity } = await import('../dist/modules/appointment/infrastructure/appointment.mapper.js');
  const actor = randomUUID(), serviceId = randomUUID();
  const row = {
    id: randomUUID(), organizationId: randomUUID(), branchId: randomUUID(), patientId: randomUUID(),
    practitionerMembershipId: actor, serviceId, treatmentId: null,
    scheduledStartAt: new Date('2026-10-22T14:00:00Z'), scheduledEndAt: new Date('2026-10-22T14:30:00Z'),
    status: 'CANCELED', reason: 'Evaluación', notes: 'Nota original', createdByMembershipId: actor,
    canceledAt: new Date('2026-10-21T14:00:00Z'), canceledByMembershipId: actor,
    cancellationReason: 'Reprogramar', createdAt: new Date('2026-10-20T14:00:00Z'), updatedAt: new Date('2026-10-21T14:00:00Z'),
  };
  const appointment = toAppointmentEntity(row);
  assert.equal(appointment.practitionerMembershipId, actor);
  assert.equal(appointment.scheduledStartAt, row.scheduledStartAt);
  assert.equal(appointment.scheduledEndAt, row.scheduledEndAt);
  assert.equal(appointment.canceledAt, row.canceledAt);
  assert.equal(appointment.canceledByMembershipId, actor);
  assert.equal(appointment.status, 'CANCELED');
  assert.equal(appointment.notes, row.notes);
  assert.equal(appointment.serviceId, serviceId);
  assert.deepEqual(appointment.serviceIds, [serviceId]);
  assert.equal('professionalMembershipId' in appointment, false);
});

test('los nombres nuevos no eliminan el servicio obligatorio ni amplían la autoasignación', async () => {
  const { CreateAppointmentUseCase } = await import('../dist/modules/appointment/application/use-case/create-appointment.use-case.js');
  const actor = randomUUID(), branchId = randomUUID();
  let created;
  const repository = {
    referencesBelongToOrganization: async () => true,
    hasOverlap: async input => { assert.equal(input.practitionerMembershipId, actor); return false; },
    create: async value => { created = value; return value; },
  };
  const useCase = new CreateAppointmentUseCase(repository);
  const command = {
    organizationId: randomUUID(), branchId, authorizedBranchIds: [branchId], patientId: randomUUID(),
    practitionerMembershipId: actor, createdByMembershipId: actor,
    scheduledStartAt: new Date('2026-10-22T14:00:00Z'), scheduledEndAt: new Date('2026-10-22T14:30:00Z'),
  };
  await assert.rejects(useCase.execute(command), { status: 400 });
  await assert.rejects(useCase.execute({ ...command, serviceId: randomUUID(), practitionerMembershipId: randomUUID() }), { status: 403 });
  const serviceId = randomUUID();
  await useCase.execute({ ...command, serviceId });
  assert.equal(created.serviceId, serviceId);
  assert.equal(created.practitionerMembershipId, actor);
  assert.equal(created.scheduledStartAt, command.scheduledStartAt);
  assert.equal(created.status, 'SCHEDULED');
});
