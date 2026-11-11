function boundedInteger(name: string, fallback: number, min: number, max: number): number {
  const configured = process.env[name] ?? String(fallback);
  const value = Number(configured);
  if (!/^[1-9][0-9]*$/.test(configured) || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} debe ser un entero entre ${min} y ${max}`);
  }
  return value;
}

/** Vigencia absoluta de una AuthSession; la rotación del refresh token no la extiende. */
export function authSessionLifetimeSeconds(): number {
  return boundedInteger('AUTH_SESSION_EXPIRES_IN_SECONDS', 43_200, 300, 604_800);
}

/** Tiempo máximo sin uso antes de rechazar el refresh de una sesión. */
export function authSessionIdleTimeoutSeconds(): number {
  return boundedInteger('AUTH_SESSION_IDLE_TIMEOUT_SECONDS', 7_200, 60, 604_800);
}

/**
 * Ventana en la que un refresh token recién rotado no se trata como robo,
 * para tolerar peticiones concurrentes del mismo navegador.
 */
export const REFRESH_REUSE_GRACE_MS = 10_000;

export const FAILED_LOGIN_MAX_ATTEMPTS = 5;
export const FAILED_LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;
