export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly messages: readonly string[] = [message],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
