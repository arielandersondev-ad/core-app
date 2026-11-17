import type { CurrentSession } from "@/infrastructure/auth/session";

export class SessionContextChangedError extends Error {
  constructor() {
    super("La sesión pertenece a otra cuenta u organización. Inicia sesión con la cuenta original para guardar este formulario.");
    this.name = "SessionContextChangedError";
  }
}

export function assertSameSessionContext(expected: CurrentSession, current: CurrentSession): void {
  if (
    current?.user?.id !== expected.user.id ||
    current?.context?.organizationId !== expected.context.organizationId ||
    current?.context?.membershipId !== expected.context.membershipId
  ) throw new SessionContextChangedError();
}
