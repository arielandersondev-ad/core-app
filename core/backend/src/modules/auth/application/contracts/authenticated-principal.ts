export type AuthenticatedPrincipal = {
  sub: string;
  membershipId: string;
  organizationId: string;
  branchIds: string[];
  permissions: string[];
};
