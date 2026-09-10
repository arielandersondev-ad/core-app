export type Branch = {
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
}

export type CreateBranch = {
  // Opcional: en create-organization se asigna dentro de la tx; en
  // create-branch se valida y convierte con toUuid36.
  organizationId?: string;

  name: string;
  code?: string;

  email?: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;

  latitude?: number;
  longitude?: number;

  timezone: string;
}
