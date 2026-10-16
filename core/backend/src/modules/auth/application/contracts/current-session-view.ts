export type CurrentSessionView = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  context: {
    membershipId: string;
    organizationId: string;
    branchIds: string[];
  };
  permissions: string[];
};
