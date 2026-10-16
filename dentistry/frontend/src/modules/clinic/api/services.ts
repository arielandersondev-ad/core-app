const API_BASE = "/api/dentistry";

export interface DentalServiceSupplyDto {
  id?: string;
  organizationId: string;
  serviceId?: string;
  inventoryItemId?: string | null;
  name: string;
  quantity?: number;
  unit?: string;
  estimatedCostMinor?: number | null;
  notes?: string | null;
}

export interface DentalServiceDto {
  id: string;
  organizationId: string;
  code?: string | null;
  name: string;
  category?: string | null;
  description?: string | null;
  durationMinutes: number;
  basePriceMinor: number;
  labCostMinor: number;
  currency: string;
  active: boolean;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  createdAt: string;
  updatedAt: string;
  supplies?: DentalServiceSupplyDto[];
}

export interface CreateDentalServiceRequest {
  organizationId: string;
  code?: string;
  name: string;
  category?: string;
  description?: string;
  durationMinutes?: number;
  basePriceMinor?: number;
  labCostMinor?: number;
  currency?: string;
  active?: boolean;
  createdByMembershipId: string;
  supplies?: Array<{
    inventoryItemId?: string;
    name: string;
    quantity?: number;
    unit?: string;
    estimatedCostMinor?: number;
    notes?: string;
  }>;
}

export interface UpdateDentalServiceRequest {
  organizationId: string;
  code?: string;
  name?: string;
  category?: string;
  description?: string;
  durationMinutes?: number;
  basePriceMinor?: number;
  labCostMinor?: number;
  currency?: string;
  active?: boolean;
  updatedByMembershipId: string;
  supplies?: Array<{
    inventoryItemId?: string;
    name: string;
    quantity?: number;
    unit?: string;
    estimatedCostMinor?: number;
    notes?: string;
  }>;
}

export interface ListDentalServicesParams {
  organizationId: string;
  category?: string;
  active?: boolean | string;
  search?: string;
}

export async function fetchDentalServices(
  params: ListDentalServicesParams,
): Promise<DentalServiceDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });

  const res = await fetch(`${API_BASE}/services?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener servicios: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDentalServiceById(
  id: string,
  organizationId: string,
): Promise<DentalServiceDto> {
  const res = await fetch(
    `${API_BASE}/services/${id}?organizationId=${organizationId}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(`Error al obtener detalle del servicio: ${res.statusText}`);
  }
  return res.json();
}

export async function createDentalService(
  payload: CreateDentalServiceRequest,
): Promise<DentalServiceDto> {
  const res = await fetch(`${API_BASE}/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Error al crear servicio: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updateDentalService(
  id: string,
  payload: UpdateDentalServiceRequest,
): Promise<DentalServiceDto> {
  const res = await fetch(`${API_BASE}/services/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Error al actualizar servicio: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function toggleDentalServiceStatus(
  id: string,
  payload: { organizationId: string; updatedByMembershipId: string },
): Promise<DentalServiceDto> {
  const res = await fetch(`${API_BASE}/services/${id}/toggle-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message ||
        `Error al cambiar estado del servicio: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function deleteDentalService(
  id: string,
  organizationId: string,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(
    `${API_BASE}/services/${id}?organizationId=${organizationId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Error al eliminar servicio: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}
