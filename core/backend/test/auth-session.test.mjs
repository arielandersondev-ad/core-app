import test from 'node:test';
import assert from 'node:assert/strict';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../dist/modules/auth/application/use-case/login.use-case.js';
import { RefreshSessionUseCase } from '../dist/modules/auth/application/use-case/refresh-session.use-case.js';
import { LogoutUseCase } from '../dist/modules/auth/application/use-case/logout.use-case.js';
import { AuthSessionIssuer } from '../dist/modules/auth/application/services/auth-session-issuer.js';
import { JwtAuthGuard } from '../dist/modules/auth/presentation/http/guards/jwt-auth.guard.js';
import { TOKEN_AUDIENCES } from '../dist/modules/auth/application/contracts/token-audience.js';
import {
  formatRefreshToken,
  generateRefreshSecret,
  hashRefreshSecret,
  parseRefreshToken,
} from '../dist/modules/auth/application/services/refresh-token.js';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const ORG_ID = '00000000-0000-0000-0000-000000000003';
let sessionSeq = 0;

function authRecord(overrides = {}) {
  return {
    user: { id: USER_ID, email: 'ana@example.com', firstName: 'Ana', lastName: 'Pérez' },
    membershipId: '00000000-0000-0000-0000-000000000002',
    organizationId: ORG_ID,
    branchIds: [],
    permissions: ['users:read', 'dentistry:patients:read'],
    passwordHash: 'hash:secreto',
    passwordChangedAt: null,
    ...overrides,
  };
}

class FakeSessions {
  rows = new Map();
  async create(input) {
    sessionSeq += 1;
    const id = `00000000-0000-4000-8000-${String(sessionSeq).padStart(12, '0')}`;
    const row = { id, ...input, lastUsedAt: null, revokedAt: null, createdAt: new Date() };
    this.rows.set(id, row);
    return { ...row };
  }
  async findById(id) {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }
  async rotate(id, expectedHash, nextHash, usedAt) {
    const row = this.rows.get(id);
    if (!row || row.revokedAt || row.refreshTokenHash !== expectedHash) return false;
    row.refreshTokenHash = nextHash;
    row.lastUsedAt = usedAt;
    return true;
  }
  async revoke(id, revokedAt) {
    const row = this.rows.get(id);
    if (row && !row.revokedAt) row.revokedAt = revokedAt;
  }
  async revokeAllForUser(userId, revokedAt) {
    let count = 0;
    for (const row of this.rows.values()) {
      if (row.userId === userId && !row.revokedAt) {
        row.revokedAt = revokedAt;
        count += 1;
      }
    }
    return count;
  }
}

class FakeUsers {
  record = authRecord();
  failed = [];
  cleared = 0;
  async findAuthRecord(email) {
    return this.record && email === this.record.user.email ? this.record : null;
  }
  async findAuthRecordByUserId(userId) {
    return this.record && userId === this.record.user.id ? this.record : null;
  }
  async registerFailedLogin(userId, policy) {
    this.failed.push({ userId, policy });
  }
  async clearFailedLogins() {
    this.cleared += 1;
  }
}

const hasher = {
  verified: [],
  async hash(value) { return `hash:${value}`; },
  async verify(plain, hashed) {
    this.verified.push(hashed);
    return hashed === `hash:${plain}`;
  },
};

const tokenIssuer = {
  signed: [],
  async sign(principal, audience) {
    this.signed.push({ principal, audience });
    return `access-token-${this.signed.length}`;
  },
};

function setup({ dentistryAllowed = true } = {}) {
  const sessions = new FakeSessions();
  const users = new FakeUsers();
  const policy = { canAccessDentistry: async () => dentistryAllowed };
  const issuer = new AuthSessionIssuer(tokenIssuer);
  return {
    sessions,
    users,
    login: new LoginUseCase(users, hasher, policy, sessions, issuer),
    refresh: new RefreshSessionUseCase(sessions, users, policy, issuer),
    logout: new LogoutUseCase(sessions),
  };
}

const credentials = { email: 'ana@example.com', password: 'secreto' };
const client = { ipAddress: '10.0.0.1', userAgent: 'test-agent' };

test('el refresh token tiene formato <sessionId>.<secreto> y se guarda solo su hash', async () => {
  const { login, sessions } = setup();
  const result = await login.execute(credentials, TOKEN_AUDIENCES.core, client);

  const parsed = parseRefreshToken(result.refresh_token);
  assert.ok(parsed);
  const row = sessions.rows.get(parsed.sessionId);
  assert.equal(row.refreshTokenHash, hashRefreshSecret(parsed.secret));
  assert.notEqual(row.refreshTokenHash, parsed.secret);
  assert.equal(row.ipAddress, '10.0.0.1');
  assert.equal(row.userAgent, 'test-agent');
  assert.equal(tokenIssuer.signed.at(-1).principal.sessionId, parsed.sessionId);
  assert.ok(result.refresh_expires_in > 0);
});

test('parseRefreshToken rechaza formatos inválidos', () => {
  const secret = generateRefreshSecret();
  assert.equal(parseRefreshToken(`no-uuid.${secret}`), null);
  assert.equal(parseRefreshToken(`${USER_ID}.corto`), null);
  assert.equal(parseRefreshToken(`${USER_ID}`), null);
  assert.equal(parseRefreshToken(42), null);
  assert.ok(parseRefreshToken(formatRefreshToken(USER_ID, secret)));
});

test('login fallido registra el intento y login correcto lo limpia', async () => {
  const { login, users } = setup();
  await assert.rejects(
    login.execute({ ...credentials, password: 'mala' }, TOKEN_AUDIENCES.core, client),
    UnauthorizedException,
  );
  assert.equal(users.failed.length, 1);
  assert.equal(users.failed[0].userId, USER_ID);
  assert.equal(users.failed[0].policy.maxAttempts, 5);
  await login.execute(credentials, TOKEN_AUDIENCES.core, client);
  assert.equal(users.cleared, 1);
});

test('usuario inexistente compara contra un hash ficticio y responde lo mismo', async () => {
  const { login, users } = setup();
  const before = hasher.verified.length;
  await assert.rejects(
    login.execute({ email: 'nadie@example.com', password: 'x' }, TOKEN_AUDIENCES.core, client),
    /Credenciales inválidas/,
  );
  assert.equal(hasher.verified.length, before + 1);
  assert.equal(users.failed.length, 0);
});

test('el refresh rota el token y el anterior deja de servir', async () => {
  const { login, refresh, sessions } = setup();
  const first = await login.execute(credentials, TOKEN_AUDIENCES.core, client);
  const t0 = new Date();
  const second = await refresh.execute(first.refresh_token, TOKEN_AUDIENCES.core, t0);

  assert.notEqual(second.refresh_token, first.refresh_token);
  assert.equal(parseRefreshToken(second.refresh_token).sessionId, parseRefreshToken(first.refresh_token).sessionId);
  assert.deepEqual(tokenIssuer.signed.at(-1).principal.permissions, ['users:read']);

  // Dentro de la ventana de gracia: carrera legítima, 409 sin revocar.
  await assert.rejects(
    refresh.execute(first.refresh_token, TOKEN_AUDIENCES.core, new Date(t0.getTime() + 1_000)),
    ConflictException,
  );
  const sessionId = parseRefreshToken(first.refresh_token).sessionId;
  assert.equal(sessions.rows.get(sessionId).revokedAt, null);

  // Fuera de la ventana: reutilización, se revoca la sesión completa.
  await assert.rejects(
    refresh.execute(first.refresh_token, TOKEN_AUDIENCES.core, new Date(t0.getTime() + 60_000)),
    UnauthorizedException,
  );
  assert.ok(sessions.rows.get(sessionId).revokedAt);
  await assert.rejects(
    refresh.execute(second.refresh_token, TOKEN_AUDIENCES.core, new Date(t0.getTime() + 61_000)),
    UnauthorizedException,
  );
});

test('el refresh no extiende la vigencia absoluta y respeta la inactividad', async () => {
  const { login, refresh, sessions } = setup();
  const result = await login.execute(credentials, TOKEN_AUDIENCES.core, client);
  const sessionId = parseRefreshToken(result.refresh_token).sessionId;
  const expiresAt = sessions.rows.get(sessionId).expiresAt;

  const renewed = await refresh.execute(result.refresh_token, TOKEN_AUDIENCES.core, new Date());
  assert.equal(sessions.rows.get(sessionId).expiresAt.getTime(), expiresAt.getTime());

  const idle = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await assert.rejects(refresh.execute(renewed.refresh_token, TOKEN_AUDIENCES.core, idle), UnauthorizedException);
  assert.ok(sessions.rows.get(sessionId).revokedAt);
});

test('una sesión vencida no se renueva', async () => {
  const { login, refresh, sessions } = setup();
  const result = await login.execute(credentials, TOKEN_AUDIENCES.core, client);
  const row = sessions.rows.get(parseRefreshToken(result.refresh_token).sessionId);
  row.expiresAt = new Date(Date.now() - 1_000);
  await assert.rejects(refresh.execute(result.refresh_token, TOKEN_AUDIENCES.core), UnauthorizedException);
});

test('usuario deshabilitado o con contraseña cambiada no puede renovar', async () => {
  const disabled = setup();
  const a = await disabled.login.execute(credentials, TOKEN_AUDIENCES.core, client);
  disabled.users.record = null;
  await assert.rejects(disabled.refresh.execute(a.refresh_token, TOKEN_AUDIENCES.core), UnauthorizedException);

  const changed = setup();
  const b = await changed.login.execute(credentials, TOKEN_AUDIENCES.core, client);
  changed.users.record = authRecord({ passwordChangedAt: new Date(Date.now() + 1_000) });
  await assert.rejects(
    changed.refresh.execute(b.refresh_token, TOKEN_AUDIENCES.core, new Date(Date.now() + 2_000)),
    UnauthorizedException,
  );
});

test('el refresh de Dentistry vuelve a evaluar el acceso de la organización', async () => {
  const { login, sessions, users } = setup();
  const result = await login.execute(credentials, TOKEN_AUDIENCES.dentistry, client);
  const issuer = new AuthSessionIssuer(tokenIssuer);
  const denied = new RefreshSessionUseCase(sessions, users, { canAccessDentistry: async () => false }, issuer);
  await assert.rejects(denied.execute(result.refresh_token, TOKEN_AUDIENCES.dentistry), ForbiddenException);

  const allowed = new RefreshSessionUseCase(sessions, users, { canAccessDentistry: async () => true }, issuer);
  await allowed.execute(result.refresh_token, TOKEN_AUDIENCES.dentistry);
  assert.deepEqual(tokenIssuer.signed.at(-1).principal.permissions, ['dentistry:patients:read']);
});

test('logout revoca la sesión, es idempotente e ignora tokens ajenos', async () => {
  const { login, refresh, logout, sessions } = setup();
  const result = await login.execute(credentials, TOKEN_AUDIENCES.core, client);
  const sessionId = parseRefreshToken(result.refresh_token).sessionId;

  await logout.execute(formatRefreshToken(sessionId, generateRefreshSecret()));
  assert.equal(sessions.rows.get(sessionId).revokedAt, null);

  await logout.execute(result.refresh_token);
  assert.ok(sessions.rows.get(sessionId).revokedAt);
  await logout.execute(result.refresh_token);
  await logout.execute('basura');
  await assert.rejects(refresh.execute(result.refresh_token, TOKEN_AUDIENCES.core), UnauthorizedException);
});

test('logout-all revoca todas las sesiones del usuario', async () => {
  const { login, logout, sessions } = setup();
  await login.execute(credentials, TOKEN_AUDIENCES.core, client);
  await login.execute(credentials, TOKEN_AUDIENCES.dentistry, client);
  await logout.executeForUser(USER_ID);
  for (const row of sessions.rows.values()) assert.ok(row.revokedAt);
});

test('JwtAuthGuard rechaza access tokens de sesiones revocadas', async () => {
  const sessions = new FakeSessions();
  const session = await sessions.create({
    userId: USER_ID,
    refreshTokenHash: 'x',
    ipAddress: null,
    userAgent: null,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const principal = { sub: USER_ID, sessionId: session.id, membershipId: 'm', organizationId: ORG_ID, branchIds: [], permissions: [] };
  const verifier = { verify: async () => principal };
  const guard = new JwtAuthGuard(verifier, sessions);
  const request = { headers: { authorization: 'Bearer abc' } };
  const context = { switchToHttp: () => ({ getRequest: () => request }) };

  assert.equal(await guard.canActivate(context), true);
  assert.equal(request.user, principal);

  await sessions.revoke(session.id, new Date());
  await assert.rejects(guard.canActivate(context), UnauthorizedException);

  sessions.rows.get(session.id).revokedAt = null;
  const other = new JwtAuthGuard({ verify: async () => ({ ...principal, sub: '00000000-0000-0000-0000-000000000009' }) }, sessions);
  await assert.rejects(other.canActivate(context), UnauthorizedException);
});
