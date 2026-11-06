import { api } from "@/infrastructure/http/api";
import { ApiError } from "@/infrastructure/http/api-error";

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
  params: ListDentalServicesParams = {},
): Promise<DentalServiceDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });
  const suffix = query.size ? `?${query.toString()}` : "";

  try {
    const { data } = await api.get<any>(`/dentistry/services${suffix}`);
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Error al obtener servicios: ${error.message}`);
    }
    throw error;
  }
}

export async function fetchDentalServicesPaginated(
  params: ListDentalServicesParams = {},
): Promise<PaginatedDentalServicesResponse> {
  const page = params.page || 1;
  const limit = params.limit || 15;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.append(key, String(value));
  });
  const suffix = query.size ? `?${query.toString()}` : "";

  try {
    const { data } = await api.get<any>(`/dentistry/services${suffix}`);
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
  organizationId?: string,
): Promise<DentalServiceDto> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  try {
    const { data } = await api.get<DentalServiceDto>(
      `/dentistry/services/${encodeURIComponent(id)}${query}`,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Error al obtener detalle del servicio: ${error.message}`);
    }
    throw error;
  }
}

export async function createDentalService(
  payload: CreateDentalServiceRequest,
): Promise<DentalServiceDto> {
  try {
    const { data } = await api.post<DentalServiceDto>("/dentistry/services", payload);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function updateDentalService(
  id: string,
  payload: UpdateDentalServiceRequest,
): Promise<DentalServiceDto> {
  try {
    const { data } = await api.patch<DentalServiceDto>(
      `/dentistry/services/${encodeURIComponent(id)}`,
      payload,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function toggleDentalServiceStatus(
  id: string,
  payload: { organizationId: string; updatedByMembershipId: string },
): Promise<DentalServiceDto> {
  try {
    const { data } = await api.patch<DentalServiceDto>(
      `/dentistry/services/${encodeURIComponent(id)}/toggle-status`,
      payload,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function deleteDentalService(
  id: string,
  organizationId?: string,
): Promise<{ success: boolean; message: string }> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  try {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/dentistry/services/${encodeURIComponent(id)}${query}`,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
