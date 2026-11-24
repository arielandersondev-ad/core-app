/** Cabecera con el secreto compartido entre el frontend de desarrollo y Core. */
export const DEV_EXCHANGE_SECRET_HEADER = 'x-dev-exchange-secret';

const MIN_SECRET_LENGTH = 24;

/**
 * Secreto del canje de tokens de desarrollo, o `null` si el canje está apagado.
 *
 * Doble condición: `NODE_ENV` debe ser exactamente `development` (no vale un
 * valor ausente) y el secreto debe estar configurado y ser largo. Sin ambas, el
 * módulo no se registra y las rutas no existen.
 */
export function devTokenExchangeSecret(
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (env.NODE_ENV !== 'development') return null;
  const secret = env.DEV_TOKEN_EXCHANGE_SECRET?.trim();
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function devTokenExchangeEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return devTokenExchangeSecret(env) !== null;
}
