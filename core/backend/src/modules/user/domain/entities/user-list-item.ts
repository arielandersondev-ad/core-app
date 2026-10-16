export type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: Date;
  memberships: {
    organizationId: string;
    organizationName: string;
    branchNames: string[];
    roleNames: string[];
  }[];
};

export type OrganizationUserListScope = {
  organizationId: string;
  branchIds: string[] | null;
};
