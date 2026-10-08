import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { permissionsForAudience } from '../dist/modules/auth/application/services/audience-permission-filter.js';
import { TOKEN_AUDIENCES } from '../dist/modules/auth/application/contracts/token-audience.js';
import { JoseAccessTokenIssuer } from '../dist/modules/auth/infrastructure/security/jwt/jose-access-token-issuer.js';
import { JoseAccessTokenVerifier } from '../dist/modules/auth/infrastructure/security/jwt/jose-access-token-verifier.js';
import { PrismaVerticalAccessPolicy } from '../dist/modules/auth/infrastructure/security/prisma-vertical-access-policy.js';
import { accessTokenLifetimeSeconds } from '../dist/modules/auth/application/contracts/access-token-lifetime.js';
import { CorePermissionService } from '../dist/modules/auth/infrastructure/security/core-permission.service.js';
import { SignJWT } from 'jose';

test('el TTL configurado no puede superar 900 segundos', () => {
  const previous = process.env.JWT_EXPIRES_IN_SECONDS;
  try {
    process.env.JWT_EXPIRES_IN_SECONDS = '900';
    assert.equal(accessTokenLifetimeSeconds(), 900);
    for (const invalid of ['901', '0', '15m', '900.5']) {
      process.env.JWT_EXPIRES_IN_SECONDS = invalid;
      assert.throws(accessTokenLifetimeSeconds, /entero entre 1 y 900/);
    }
  } finally {
    if (previous === undefined) delete process.env.JWT_EXPIRES_IN_SECONDS;
    else process.env.JWT_EXPIRES_IN_SECONDS = previous;
  }
});

test('Core no autoriza permisos cuando la organización está inactiva', async () => {
  const organization = { deleted: false, status: 'SUSPENDED' };
  const principal = {
    sub: '00000000-0000-0000-0000-000000000001',
    membershipId: '00000000-0000-0000-0000-000000000002',
    organizationId: '00000000-0000-0000-0000-000000000003',
    branchIds: [],
    permissions: ['users:read'],
  };
  const prisma = { orm: { core: {
    Membership: { first: async () => ({
      id: principal.membershipId,
      userId: principal.sub,
      organizationId: principal.organizationId,
      deleted: false,
      status: 'ACTIVE',
    }) },
    User: { first: async () => ({ deleted: false, status: 'ACTIVE' }) },
    Organization: { first: async () => organization },
  } } };
  const service = new CorePermissionService(prisma);
  assert.equal(await service.hasPermission(principal, 'users:read'), false);
  organization.status = 'ACTIVE';
  organization.deleted = true;
  assert.equal(await service.hasPermission(principal, 'users:read'), false);
});

test('filtra y deduplica permisos por audiencia', () => {
  const granted = ['users:read', 'dentistry:patients:read', 'users:read'];
  assert.deepEqual(permissionsForAudience(granted, TOKEN_AUDIENCES.core), ['users:read']);
  assert.deepEqual(permissionsForAudience(granted, TOKEN_AUDIENCES.dentistry), ['dentistry:patients:read']);
});

test('Dentistry requiere asignación vigente y plan activo', async () => {
  const now = new Date('2026-09-29T12:00:00Z');
  const assignment = {
    planId: '00000000-0000-0000-0000-000000000005',
    status: 'ACTIVE',
    startsAt: new Date('2026-09-01T00:00:00Z'),
    endsAt: new Date('2026-10-01T00:00:00Z'),
  };
  const plan = { vertical: 'DENTISTRY', active: true, deleted: false };
  const prisma = {
    orm: { core: {
      OrganizationPlan: { where: () => ({ first: async () => assignment }) },
      Plan: { first: async () => plan },
    } },
  };
  const policy = new PrismaVerticalAccessPolicy(prisma);
  const org = '00000000-0000-0000-0000-000000000003';
  assert.equal(await policy.canAccessDentistry(org, now), true);
  assignment.status = 'SUSPENDED';
  assert.equal(await policy.canAccessDentistry(org, now), false);
  assignment.status = 'ACTIVE';
  assignment.endsAt = new Date('2026-09-29T12:00:00Z');
  assert.equal(await policy.canAccessDentistry(org, now), false);
  assignment.endsAt = new Date('2026-10-01T00:00:00Z');
  plan.active = false;
  assert.equal(await policy.canAccessDentistry(org, now), false);
});

test('Core acepta su token y rechaza Dentistry con la misma clave pública', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'crowant-jwt-test-'));
  const previousPrivate = process.env.JWT_PRIVATE_KEY_PATH;
  const previousPublic = process.env.JWT_PUBLIC_KEY_PATH;
  const previousIssuer = process.env.JWT_ISSUER;
  const previousAudience = process.env.JWT_CORE_AUDIENCE;
  const previousTtl = process.env.JWT_EXPIRES_IN_SECONDS;
  try {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privatePath = join(folder, 'private.pem');
    const publicPath = join(folder, 'public.pem');
    writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }));
    process.env.JWT_PRIVATE_KEY_PATH = privatePath;
    process.env.JWT_PUBLIC_KEY_PATH = publicPath;
    process.env.JWT_ISSUER = 'auth-test';
    process.env.JWT_CORE_AUDIENCE = 'core-api';
    process.env.JWT_EXPIRES_IN_SECONDS = '900';

    const issuer = new JoseAccessTokenIssuer();
    const verifier = new JoseAccessTokenVerifier();
    const base = {
      sub: '00000000-0000-0000-0000-000000000001',
      membershipId: '00000000-0000-0000-0000-000000000002',
      organizationId: '00000000-0000-0000-0000-000000000003',
      branchIds: ['00000000-0000-0000-0000-000000000004'],
    };
    const core = await issuer.sign({ ...base, permissions: ['users:read'] }, TOKEN_AUDIENCES.core);
    const dentistry = await issuer.sign({ ...base, permissions: ['dentistry:patients:read'] }, TOKEN_AUDIENCES.dentistry);

    assert.deepEqual((await verifier.verify(core)).permissions, ['users:read']);
    await assert.rejects(verifier.verify(dentistry));
    const signSpecial = (audience, ttl) => new SignJWT({
      membershipId: base.membershipId,
      organizationId: base.organizationId,
      branchIds: base.branchIds,
      permissions: ['users:read'],
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt' })
      .setSubject(base.sub)
      .setJti('00000000-0000-0000-0000-000000000005')
      .setIssuer('auth-test')
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(privateKey);
    const multiAudience = await signSpecial(['core-api', 'dentistry-api'], '900s');
    await assert.rejects(verifier.verify(multiAudience));
    const overlong = await signSpecial('core-api', '901s');
    await assert.rejects(verifier.verify(overlong));
    const [header, payload, signature] = core.split('.');
    const tampered = `${header}.${payload}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
    await assert.rejects(verifier.verify(tampered));
  } finally {
    if (previousPrivate === undefined) delete process.env.JWT_PRIVATE_KEY_PATH;
    else process.env.JWT_PRIVATE_KEY_PATH = previousPrivate;
    if (previousPublic === undefined) delete process.env.JWT_PUBLIC_KEY_PATH;
    else process.env.JWT_PUBLIC_KEY_PATH = previousPublic;
    if (previousIssuer === undefined) delete process.env.JWT_ISSUER;
    else process.env.JWT_ISSUER = previousIssuer;
    if (previousAudience === undefined) delete process.env.JWT_CORE_AUDIENCE;
    else process.env.JWT_CORE_AUDIENCE = previousAudience;
    if (previousTtl === undefined) delete process.env.JWT_EXPIRES_IN_SECONDS;
    else process.env.JWT_EXPIRES_IN_SECONDS = previousTtl;
    rmSync(folder, { recursive: true, force: true });
  }
});
