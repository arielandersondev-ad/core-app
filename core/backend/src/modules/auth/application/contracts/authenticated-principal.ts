export type AuthenticatedPrincipal = {
  sub: string;
  /** Id de la AuthSession que respalda el token (claim sid). */
  sessionId: string;
  membershipId: string;
  organizationId: string;
  branchIds: string[];
  permissions: string[];
};
