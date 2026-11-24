import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./support/load-source.mjs";

const SECRET = "un-secreto-de-desarrollo-bastante-largo";
const USER = "01a043d1-5ed9-73f9-a9fb-bc9cfb502c43";
const TOKENS = { access_token: "access-real", token_type: "Bearer", expires_in: 1800, refresh_token: "refresh-real", refresh_expires_in: 43200 };

function setup({ nodeEnv = "development", secret = SECRET, response, failWith } = {}) {
  const calls = [];
  const axios = {
    get: async (url, config) => {
      calls.push({ method: "GET", url, config });
      if (failWith) throw failWith;
      return { data: response ?? [] };
    },
    post: async (url, body, config) => {
      calls.push({ method: "POST", url, body, config });
      if (failWith) throw failWith;
      return { data: response ?? TOKENS };
    },
  };
  const saved = [];
  const redirects = [];
  const overrides = {
    "server-only": {},
    axios: { default: axios, isAxiosError: (error) => Boolean(error?.isAxiosError) },
    "@/infrastructure/config/server-env": { serverEnv: { authApiUrl: new URL("http://core.test:3002") } },
    "@/infrastructure/auth/server-session": { setSession: async (tokens) => saved.push(tokens) },
    "next/navigation": { redirect: (path) => redirects.push(path) },
    "next/cache": { revalidatePath: () => {} },
  };
  const previous = { env: process.env.NODE_ENV, secret: process.env.DEV_TOKEN_EXCHANGE_SECRET };
  process.env.NODE_ENV = nodeEnv;
  if (secret === null) delete process.env.DEV_TOKEN_EXCHANGE_SECRET;
  else process.env.DEV_TOKEN_EXCHANGE_SECRET = secret;
  const load = createSourceLoader(overrides);
  return {
    calls,
    saved,
    redirects,
    service: load("src/features/dev-auth/services/dev-exchange.service.ts"),
    actions: load("src/features/dev-auth/actions/dev-exchange.actions.ts"),
    restore() {
      for (const [key, value] of [["NODE_ENV", previous.env], ["DEV_TOKEN_EXCHANGE_SECRET", previous.secret]]) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    },
  };
}

test("el canje solo está configurado en development y con un secreto largo", () => {
  for (const [options, expected] of [
    [{}, true],
    [{ nodeEnv: "production" }, false],
    [{ nodeEnv: "test" }, false],
    [{ secret: null }, false],
    [{ secret: "corto" }, false],
  ]) {
    const env = setup(options);
    try {
      assert.equal(env.service.devExchangeConfigured(), expected, JSON.stringify(options));
    } finally {
      env.restore();
    }
  }
});

test("el canje envía el secreto a Core y guarda la sesión real (access + refresh)", async () => {
  const env = setup();
  try {
    const tokens = await env.service.exchangeDevUser(USER);
    assert.equal(tokens.accessToken, "access-real");
    assert.equal(tokens.refreshToken, "refresh-real");
    assert.equal(env.calls[0].url, "http://core.test:3002/dev/auth/dentistry-token");
    assert.deepEqual(env.calls[0].body, { userId: USER });
    assert.equal(env.calls[0].config.headers["x-dev-exchange-secret"], SECRET);

    await env.actions.exchangeDevUserAction(USER, "/patients/abc");
    assert.equal(env.saved.length, 1);
    assert.equal(env.saved[0].refreshToken, "refresh-real", "la sesión conserva el refresh token real");
    assert.deepEqual(env.redirects, ["/patients/abc"]);
  } finally {
    env.restore();
  }
});

test("desde el login el canje lleva a pacientes y rechaza rutas externas", async () => {
  const env = setup();
  try {
    await env.actions.exchangeDevUserAction(USER, "/login");
    await env.actions.exchangeDevUserAction(USER, "https://evil.test/x");
    assert.deepEqual(env.redirects, ["/patients", "/dashboard"], "una ruta externa cae en la ruta por defecto");
  } finally {
    env.restore();
  }
});

test("fuera de development las acciones no hacen nada y no llaman a Core", async () => {
  const env = setup({ nodeEnv: "production" });
  try {
    await assert.rejects(env.actions.listDevUsersAction(), /solo está disponible/);
    await assert.rejects(env.actions.exchangeDevUserAction(USER, "/patients"), /solo está disponible/);
    assert.equal(env.calls.length, 0);
    assert.equal(env.saved.length, 0);
  } finally {
    env.restore();
  }
});

test("sin secreto configurado el selector no muestra la sección de usuarios reales", async () => {
  const env = setup({ secret: null });
  try {
    assert.deepEqual(await env.actions.listDevUsersAction(), { enabled: false });
    const result = await env.actions.exchangeDevUserAction(USER, "/patients");
    assert.match(result.error, /no está configurado/);
    assert.equal(env.calls.length, 0);
  } finally {
    env.restore();
  }
});

test("los errores de Core se traducen a mensajes claros", async () => {
  for (const [status, pattern] of [[404, /canje/], [401, /secreto/], [403, /acceso a Dentistry/]]) {
    const env = setup({ failWith: { isAxiosError: true, response: { status } } });
    try {
      const result = await env.actions.exchangeDevUserAction(USER, "/patients");
      assert.match(result.error, pattern, String(status));
      assert.equal(env.saved.length, 0, "no deja sesión si el canje falla");
    } finally {
      env.restore();
    }
  }
  const env = setup({ failWith: new Error("ECONNREFUSED") });
  try {
    assert.match((await env.actions.exchangeDevUserAction(USER, "/patients")).error, /conectar con Core/);
  } finally {
    env.restore();
  }
});

test("el listado reenvía la búsqueda y devuelve los usuarios", async () => {
  const users = [{ id: USER, email: "r@u.test", name: "Rosario", organizationName: "UnoDental", roleNames: ["owner"], branchNames: [] }];
  const env = setup({ response: users });
  try {
    const result = await env.actions.listDevUsersAction("  rosa ");
    assert.deepEqual(result, { enabled: true, users });
    assert.equal(env.calls[0].url, "http://core.test:3002/dev/auth/users");
    assert.deepEqual(env.calls[0].config.params, { search: "rosa" });
  } finally {
    env.restore();
  }
});
