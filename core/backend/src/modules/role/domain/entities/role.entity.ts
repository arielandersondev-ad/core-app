export type Role = {
  id: string;

  // null => rol global
  organizationId: string | null;

  name: string;
  code: string;
  description: string | null;

  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRole = {
  organizationId: string | null;
  name: string;
  code: string;
  description: string;
}
