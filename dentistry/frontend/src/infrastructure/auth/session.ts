export const DENTISTRY_ACCESS_COOKIE = "crowant_dentistry_access";

export type CurrentSession = {
  user: { id: string };
  context: { membershipId: string; organizationId: string; branchIds: string[] };
  permissions: string[];
};
