export type OrganizationFormData = {
  name: string;
  legalName: string;
  taxId: string;
  city: string;
  email: string;
  phone: string;
  timezone: string;
  website: string;
};

export type RoleFormData = {
  name: string;
  code: string;
  description: string;
};

export type BranchFormData = {
  name: string;
  code: string;
  country: string;
  email: string;
  phone: string;
  latitude: string;
  longitude: string;
  timezone: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
};

export type CreateOrganizationPayload = {
  organization: OrganizationFormData;
  roles: RoleFormData[];
  branches: BranchFormData[];
};

export const initialFormData: CreateOrganizationPayload = {
  organization: {
    name: "",
    legalName: "",
    taxId: "",
    city: "",
    email: "",
    phone: "",
    timezone: "America/La_Paz",
    website: "",
  },
  roles: [],
  branches: [],
};
