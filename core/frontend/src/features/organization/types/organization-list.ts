export type OrganizationListItem = Readonly<{
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  country: string;
  status: string;
  createdAt: string;
}>;
