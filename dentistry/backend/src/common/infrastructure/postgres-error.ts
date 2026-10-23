export function hasPostgresCode(error: unknown, code: string): boolean {
  const visited = new Set<unknown>();
  let current = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const candidate = current as {
      code?: unknown;
      sqlState?: unknown;
      cause?: unknown;
    };
    if ((candidate.sqlState ?? candidate.code) === code) return true;
    current = candidate.cause;
  }
  return false;
}
