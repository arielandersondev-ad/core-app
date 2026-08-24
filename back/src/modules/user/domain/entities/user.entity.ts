export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string |  null;
  status: string;
  emailVerifiedAt: Date | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUser = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

