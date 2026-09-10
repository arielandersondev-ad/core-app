import { Branch } from "../domain/entities/branch.entity.js";

export type BranchRow = {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  status: string;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toBranchEntity(row: BranchRow): Branch {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    code: row.code,
    email: row.email,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postalCode,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    status: row.status,
    deleted: row.deleted,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
