export type AuthResult = {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    membershipId: string;
    organizationId: string;
    branchIds: string[];
    roleIds: string[];
    roleCodes: string[];
  };
};
