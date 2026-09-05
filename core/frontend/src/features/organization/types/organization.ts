export type OrganizationStatus = "active" | "inactive";

export type OrganizationPlan =
  | "starter"
  | "professional"
  | "enterprise";

export type Organization = Readonly<{
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  city: string;
  plan: OrganizationPlan;
  branchesCount: number;
  usersCount: number;
  status: OrganizationStatus;
}>;