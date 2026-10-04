export function getNestedValue(
  obj: unknown,
  path: string
) {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc !== null &&
        acc !== undefined
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    );
}