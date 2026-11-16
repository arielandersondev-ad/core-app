export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly messages: readonly string[] = [message],
    /** Código estable del backend (p. ej. `PLAN_LIMIT_REACHED`), si lo envía. */
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
