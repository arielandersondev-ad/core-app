import { z } from "zod";
import {
  branchSchema,
  organizationSchema,
  organizationSetupSchema,
  roleSchema,
} from "../schemas/organization-setup.schema";

export type OrganizationFormValues = z.output<typeof organizationSchema>;
export type RoleFormValues = z.output<typeof roleSchema>;
export type BranchFormValues = z.output<typeof branchSchema>;
export type OrganizationSetupPayload = z.output<typeof organizationSetupSchema>;

export const initialOrganizationValues: OrganizationFormValues = {
  name: "",
  legalName: "",
  taxId: "",
  country: "BO",
  email: "",
  phone: "",
  timezone: "America/La_Paz",
  website: undefined,
};

export const initialRoleValues = {
  name: "",
  code: "",
  description: "",
};

export const initialBranchValues = {
  name: "",
  code: "",
  city: "",
  country: "BO",
  email: "",
  phone: "",
  latitude: undefined,
  longitude: undefined,
  timezone: "America/La_Paz",
  postalCode: "",
  addressLine1: "",
  addressLine2: "",
};

export const initialOrganizationSetup: OrganizationSetupPayload = {
  organization: initialOrganizationValues,
  roles: [],
  branches: [],
};
