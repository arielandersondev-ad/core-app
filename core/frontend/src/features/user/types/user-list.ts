export type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  memberships: {
    organizationId: string;
    organizationName: string;
    branchNames: string[];
    roleNames: string[];
  }[];
};
