export type AuthenticatedPrincipal = {
  sub: string;
  email: string;
  membershipId: string;
  organizationId: string;
  branchIds: string[];
  roleCodes: string[];
};
