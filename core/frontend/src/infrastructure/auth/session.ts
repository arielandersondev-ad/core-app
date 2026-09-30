export const SESSION_COOKIE = "crowant_session";
export const SESSION_MAX_AGE_SECONDS = 15 * 60;

export function getSessionMaxAge(expiresIn: unknown): number {
  if (typeof expiresIn !== 'number' || !Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
    return SESSION_MAX_AGE_SECONDS;
  }

  return Math.min(expiresIn, SESSION_MAX_AGE_SECONDS);
}
