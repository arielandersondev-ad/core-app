export type OrganizationStatus = "active" | "inactive";

export type OrganizationPlan =
  | "starter"
  | "professional"
  | "enterprise";

export type Organization = CreateOrganization & {
  id: string;
  deleted: boolean
  deletedAt: string
  updatedAt: string
  createdAt: string
  status: string
};

export type CreateOrganization = {
  email?: string;
  country: string;
  name: string;
  legalName: string;
  phone: string;
  taxId: string;
  timezone: string;
  website?: string
}
