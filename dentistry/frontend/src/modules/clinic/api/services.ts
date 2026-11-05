const API_BASE = "/api/dentistry";

export interface DentalServiceSupplyDto {
  id?: string;
  organizationId: string;
  serviceId?: string;
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
  isActive: boolean;
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
  isActive?: boolean;
  createdByMembershipId: string;
  supplies?: Array<{
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
  isActive?: boolean;
  updatedByMembershipId: string;
  supplies?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    estimatedCostMinor?: number;
    notes?: string;
  }>;
}

export interface ListDentalServicesParams {
  organizationId?: string;
  category?: string;
  isActive?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDentalServicesResponse {
  items: DentalServiceDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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
  const data = await res.json();
  if (data && Array.isArray(data.items)) {
    return data.items;
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchDentalServicesPaginated(
  params: ListDentalServicesParams,
): Promise<PaginatedDentalServicesResponse> {
  const page = params.page || 1;
  const limit = params.limit || 15;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });

  try {
    const res = await fetch(`${API_BASE}/services?${query.toString()}`, {
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && Array.isArray(data.items)) {
        return {
          items: data.items,
          total: typeof data.total === "number" ? data.total : data.items.length,
          page: typeof data.page === "number" ? data.page : page,
          limit: typeof data.limit === "number" ? data.limit : limit,
          hasMore:
            typeof data.hasMore === "boolean"
              ? data.hasMore
              : (data.page ?? page) * (data.limit ?? limit) < (data.total ?? data.items.length),
        };
      }
      if (Array.isArray(data)) {
        const start = (page - 1) * limit;
        const sliced = data.slice(start, start + limit);
        return {
          items: sliced,
          total: data.length,
          page,
          limit,
          hasMore: start + limit < data.length,
        };
      }
    }
  } catch {
    // Backend offline or error, return empty paginated shape so caller can fallback gracefully
  }

  return {
    items: [],
    total: 0,
    page,
    limit,
    hasMore: false,
  };
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
