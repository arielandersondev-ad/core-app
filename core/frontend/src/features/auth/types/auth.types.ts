export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthenticatedUser = {
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

export type AuthResult = {
  access_token: string;
  user: AuthenticatedUser;
};
