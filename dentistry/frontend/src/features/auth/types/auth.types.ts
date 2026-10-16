export type LoginFormState = {
  errors?: { email?: string; password?: string };
  message?: string;
};

export type CurrentSession = {
  user: { id: string };
  context: { membershipId: string; organizationId: string; branchIds: string[] };
  permissions: string[];
};
