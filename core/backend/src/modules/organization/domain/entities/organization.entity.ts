export type Organization = {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string;
  timezone: string;
  status: string;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}


export type CreateOrganization = {
  name: string;
  legalName?: string;
  taxId?: string;

  email?: string;
  phone?: string;
  website?: string;

  country: string;
  timezone: string;
}