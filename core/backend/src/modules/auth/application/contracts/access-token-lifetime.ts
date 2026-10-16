export function accessTokenLifetimeSeconds(): number {
  const configured = process.env['JWT_EXPIRES_IN_SECONDS'] ?? '1800';
  const seconds = Number(configured);
  if (!/^[1-9][0-9]*$/.test(configured) || !Number.isSafeInteger(seconds) || seconds > 1800) {
    throw new Error('JWT_EXPIRES_IN_SECONDS debe ser un entero entre 1 y 1800');
  }
  return seconds;
}
