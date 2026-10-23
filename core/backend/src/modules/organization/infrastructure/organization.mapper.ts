import type { Organization } from '../domain/entities/organization.entity.js';

export type OrganizationRow = {
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
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toOrganizationEntity(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legalName,
    taxId: row.taxId,
    email: row.email,
    phone: row.phone,
    website: row.website,
    country: row.country,
    timezone: row.timezone,
    status: row.status,
    deleted: row.deletedAt !== null,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
