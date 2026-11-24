import test from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  DEV_EXCHANGE_SECRET_HEADER,
  devTokenExchangeEnabled,
  devTokenExchangeSecret,
} from '../dist/modules/dev-auth/dev-token-exchange.config.js';
import { DevTokenExchangeGuard } from '../dist/modules/dev-auth/dev-token-exchange.guard.js';
import { DevTokenExchangeUseCase } from '../dist/modules/dev-auth/dev-token-exchange.use-case.js';
import { AuthSessionIssuer } from '../dist/modules/auth/application/services/auth-session-issuer.js';
import { RefreshSessionUseCase } from '../dist/modules/auth/application/use-case/refresh-session.use-case.js';
import { TOKEN_AUDIENCES } from '../dist/modules/auth/application/contracts/token-audience.js';
import {
  hashRefreshSecret,
  parseRefreshToken,
} from '../dist/modules/auth/application/services/refresh-token.js';

const SECRET = 'un-secreto-de-desarrollo-bastante-largo';
const USER_ID = '00000000-0000-4000-8000-000000000001';
const ORG_ID = '00000000-0000-4000-8000-000000000003';

test('el canje solo se habilita en development y con un secreto largo', () => {
  assert.equal(devTokenExchangeSecret({ NODE_ENV: 'development', DEV_TOKEN_EXCHANGE_SECRET: SECRET }), SECRET);
  assert.equal(devTokenExchangeSecret({ NODE_ENV: 'development', DEV_TOKEN_EXCHANGE_SECRET: `  ${SECRET} ` }), SECRET);
  for (const env of [
    { NODE_ENV: 'production', DEV_TOKEN_EXCHANGE_SECRET: SECRET },
    { NODE_ENV: 'test', DEV_TOKEN_EXCHANGE_SECRET: SECRET },
    { DEV_TOKEN_EXCHANGE_SECRET: SECRET },
    { NODE_ENV: 'development' },
    { NODE_ENV: 'development', DEV_TOKEN_EXCHANGE_SECRET: '' },
    { NODE_ENV: 'development', DEV_TOKEN_EXCHANGE_SECRET: 'corto' },
  ]) {
    assert.equal(devTokenExchangeSecret(env), null, JSON.stringify(env));
    assert.equal(devTokenExchangeEnabled(env), false);
  }
  assert.equal(devTokenExchangeEnabled({ NODE_ENV: 'development', DEV_TOKEN_EXCHANGE_SECRET: SECRET }), true);
});

function contextWith(headers) {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) };
}

test('el guard exige el secreto y desaparece si el canje se apaga', () => {
  const guard = new DevTokenExchangeGuard();
  const previous = { NODE_ENV: process.env.NODE_ENV, secret: process.env.DEV_TOKEN_EXCHANGE_SECRET };
  try {
    process.env.NODE_ENV = 'development';
    process.env.DEV_TOKEN_EXCHANGE_SECRET = SECRET;
    assert.equal(guard.canActivate(contextWith({ [DEV_EXCHANGE_SECRET_HEADER]: SECRET })), true);
    for (const headers of [{}, { [DEV_EXCHANGE_SECRET_HEADER]: 'otro' }, { [DEV_EXCHANGE_SECRET_HEADER]: `${SECRET}x` }]) {
      assert.throws(() => guard.canActivate(contextWith(headers)), UnauthorizedException);
    }

    // Aunque el módulo estuviera cargado, fuera de development responde 404.
    process.env.NODE_ENV = 'production';
    assert.throws(
      () => guard.canActivate(contextWith({ [DEV_EXCHANGE_SECRET_HEADER]: SECRET })),
      NotFoundException,
    );
    process.env.NODE_ENV = 'development';
    delete process.env.DEV_TOKEN_EXCHANGE_SECRET;
    assert.throws(
      () => guard.canActivate(contextWith({ [DEV_EXCHANGE_SECRET_HEADER]: SECRET })),
      NotFoundException,
    );
  } finally {
    for (const [key, value] of [['NODE_ENV', previous.NODE_ENV], ['DEV_TOKEN_EXCHANGE_SECRET', previous.secret]]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

function setup({ record, dentistryAllowed = true, items = [] } = {}) {
  const sessions = {
    rows: new Map(),
    async create(input) {
      const id = `00000000-0000-4000-8000-${String(this.rows.size + 100).padStart(12, '0')}`;
      const row = { id, ...input, lastUsedAt: null, revokedAt: null, createdAt: new Date() };
      this.rows.set(id, row);
      return { ...row };
    },
    async findById(id) {
      const row = this.rows.get(id);
      return row ? { ...row } : null;
    },
    async rotate(id, expected, next, usedAt) {
      const row = this.rows.get(id);
      if (!row || row.revokedAt || row.refreshTokenHash !== expected) return false;
      Object.assign(row, { refreshTokenHash: next, lastUsedAt: usedAt });
      return true;
    },
    async revoke() {},
    async revokeAllForUser() { return 0; },
  };
  const listed = [];
  const users = {
    async listUsers(query) {
      listed.push(query);
      return { items, pagination: {} };
    },
    async findAuthRecordByUserId(id) {
      return record && record.user.id === id ? record : null;
    },
    async findAuthRecord() { return record ?? null; },
    async findCurrentSession() { return record ?? null; },
  };
  const signed = [];
  const tokenIssuer = {
    async sign(principal, audience) {
      signed.push({ principal, audience });
      return `access-${signed.length}`;
    },
  };
  const policy = { canAccessDentistry: async () => dentistryAllowed };
  const issuer = new AuthSessionIssuer(tokenIssuer);
  return {
    sessions,
    signed,
    listed,
    users,
    policy,
    issuer,
    useCase: new DevTokenExchangeUseCase(users, policy, sessions, issuer),
  };
}

const rosario = () => ({
  user: { id: USER_ID, email: 'rosario@unodental.test', firstName: 'Rosario', lastName: 'Q' },
  membershipId: '00000000-0000-4000-8000-000000000002',
  organizationId: ORG_ID,
  branchIds: ['00000000-0000-4000-8000-0000000000b1'],
  permissions: ['dentistry:payments:read', 'dentistry:payments:create', 'users:read'],
  passwordHash: 'hash:nunca-se-usa',
  passwordChangedAt: null,
});

test('el canje emite la sesión real de Dentistry con los permisos y sucursales de Core', async () => {
  const { useCase, signed, sessions } = setup({ record: rosario() });
  const result = await useCase.exchange(USER_ID);

  assert.equal(result.token_type, 'Bearer');
  assert.equal(signed[0].audience, TOKEN_AUDIENCES.dentistry);
  assert.equal(signed[0].principal.sub, USER_ID);
  assert.equal(signed[0].principal.organizationId, ORG_ID);
  assert.deepEqual(signed[0].principal.branchIds, ['00000000-0000-4000-8000-0000000000b1']);
  // Mismo filtro por audiencia que el login: los permisos de Core no pasan a Dentistry.
  assert.deepEqual(signed[0].principal.permissions, ['dentistry:payments:create', 'dentistry:payments:read']);

  const parsed = parseRefreshToken(result.refresh_token);
  assert.ok(parsed);
  const row = sessions.rows.get(parsed.sessionId);
  assert.equal(row.refreshTokenHash, hashRefreshSecret(parsed.secret));
  assert.equal(row.userAgent, 'dev-token-exchange');
  assert.equal(row.ipAddress, null);
  assert.equal(JSON.stringify(result).includes('nunca-se-usa'), false, 'no filtra el hash de contraseña');
});

test('la sesión canjeada se renueva como una sesión de login normal', async () => {
  const { useCase, users, policy, issuer, sessions } = setup({ record: rosario() });
  const first = await useCase.exchange(USER_ID);
  const refresh = new RefreshSessionUseCase(sessions, users, policy, issuer);
  const renewed = await refresh.execute(first.refresh_token, TOKEN_AUDIENCES.dentistry);
  assert.equal(renewed.token_type, 'Bearer');
  assert.notEqual(renewed.refresh_token, first.refresh_token);
});

test('no se canjea para usuarios inexistentes ni organizaciones sin acceso a Dentistry', async () => {
  const none = setup({ record: null });
  await assert.rejects(none.useCase.exchange(USER_ID), NotFoundException);
  assert.equal(none.sessions.rows.size, 0);

  const blocked = setup({ record: rosario(), dentistryAllowed: false });
  await assert.rejects(blocked.useCase.exchange(USER_ID), ForbiddenException);
  assert.equal(blocked.sessions.rows.size, 0, 'sin acceso no se crea sesión');
});

test('el listado muestra solo lo necesario para elegir un usuario', async () => {
  const items = [
    {
      id: USER_ID,
      email: 'rosario@unodental.test',
      firstName: 'Rosario',
      lastName: 'Q',
      status: 'ACTIVE',
      createdAt: new Date(),
      memberships: [
        { organizationId: ORG_ID, organizationName: 'UnoDental', branchNames: ['Central'], roleNames: ['owner'] },
      ],
    },
    { id: 'sin-membresia', email: 'x@y.test', firstName: 'X', lastName: 'Y', status: 'ACTIVE', createdAt: new Date(), memberships: [] },
  ];
  const { useCase, listed } = setup({ items });
  const options = await useCase.listUsers('  rosa ');
  assert.deepEqual(options[0], {
    id: USER_ID,
    email: 'rosario@unodental.test',
    name: 'Rosario Q',
    organizationName: 'UnoDental',
    roleNames: ['owner'],
    branchNames: ['Central'],
  });
  assert.equal(options[1].organizationName, null);
  assert.deepEqual(listed[0], { search: 'rosa', status: 'ACTIVE', page: 1, pageSize: 50 });
});
