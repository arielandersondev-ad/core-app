export function accessTokenLifetimeSeconds(): number {
  const configured = process.env['JWT_EXPIRES_IN_SECONDS'] ?? '900';
  const seconds = Number(configured);
  if (!/^[1-9][0-9]*$/.test(configured) || !Number.isSafeInteger(seconds) || seconds > 900) {
    throw new Error('JWT_EXPIRES_IN_SECONDS debe ser un entero entre 1 y 900');
  }
  return seconds;
}
