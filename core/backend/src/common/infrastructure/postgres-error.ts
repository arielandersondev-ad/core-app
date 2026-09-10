type ErrorLike = {
  code?: unknown;
  sqlState?: unknown;
  constraint?: unknown;
  constraint_name?: unknown;
  cause?: unknown;
};

export function isPostgresUniqueViolation(
  error: unknown,
  constraints: readonly string[],
): boolean {
  const visited = new Set<unknown>();
  let current = error;

  while (
    typeof current === 'object' &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);
    const candidate = current as ErrorLike;
    const code = candidate.code ?? candidate.sqlState;
    const constraint = candidate.constraint ?? candidate.constraint_name;

    if (
      code === '23505' &&
      typeof constraint === 'string' &&
      constraints.includes(constraint)
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}
