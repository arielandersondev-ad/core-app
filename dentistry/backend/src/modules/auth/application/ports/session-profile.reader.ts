/** Nombres visibles de la sesión; se leen de Core por id. */
export type SessionProfile = {
  user: { firstName: string; lastName: string } | null;
  organizationName: string | null;
};

export abstract class SessionProfileReader {
  abstract read(userId: string, organizationId: string): Promise<SessionProfile>;
}
