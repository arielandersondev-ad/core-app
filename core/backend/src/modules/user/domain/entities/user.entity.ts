export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUser = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type MembershipSummary = {
  id: string;
  userId: string;
  organizationId: string;
  status: string;
  joinedAt: Date | null;
  branchIds: string[];
  roleIds: string[];
};

export type CreateUserWithAccess = CreateUser & {
  password: string;
  organizationId: string;
  branchIds: string[];
  roleIds: string[];
};

export type UserWithMembership = {
  user: User;
  membership: MembershipSummary;
};

// Read model para login: usuario + sus accesos (membresía, sucursales, roles)
// y el hash de contraseña para verificación.
export type UserAuthRecord = {
  user: User;
  membershipId: string;
  organizationId: string;
  branchIds: string[];
  roleIds: string[];
  roleCodes: string[];
  passwordHash: string;
};
