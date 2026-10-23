import type { Role } from '../domain/entities/role.entity.js';

export type RoleRow = {
  id: string;
  organizationId: string | null;
  name: string;
  code: string;
  description: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toRoleEntity(row: RoleRow): Role {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    code: row.code,
    description: row.description,
    deleted: row.deletedAt !== null,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
