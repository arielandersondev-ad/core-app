import { api } from "@/infrastructure/http/api";
import { ApiError } from "@/infrastructure/http/api-error";

export class AppointmentApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AppointmentApiError";
  }
}

export interface AppointmentServiceDto {
  id?: string;
  serviceId: string;
  serviceName?: string;
  priceMinor?: number | null;
  currency?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface AppointmentDto {
  id: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  practitionerMembershipId?: string | null;
  serviceId?: string;
  serviceIds?: string[];
  treatmentId?: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status:
    | "SCHEDULED"
    | "CONFIRMED"
    | "WAITING_ROOM"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "NO_SHOW"
    | "CANCELED";
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  rowVersion?: number;
  canceledAt?: string | null;
  canceledByMembershipId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  services?: AppointmentServiceDto[];
  patientName?: string;
  personName?: string;
  patientPhone?: string;
  personPhone?: string;
  serviceName?: string;
}

export interface CreateAppointmentRequest {
  organizationId?: string;
  branchId: string;
  patientId: string;
  practitionerMembershipId?: string;
  serviceId?: string;
  serviceIds?: string[];
  treatmentId?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  reason?: string;
  notes?: string;
  createdByMembershipId?: string;
}

export interface ListAppointmentsParams {
  organizationId?: string;
  branchId?: string;
  patientId?: string;
  practitionerMembershipId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function fetchAppointments(
  params: ListAppointmentsParams = {},
): Promise<AppointmentDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  const suffix = query.size ? `?${query.toString()}` : "";

  try {
    const { data } = await api.get<AppointmentDto[]>(`/dentistry/appointments${suffix}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`Error al obtener citas: ${error.message}`);
    }
    throw error;
  }
}

export async function fetchAppointmentById(id: string): Promise<AppointmentDto> {
  try {
    const { data } = await api.get<AppointmentDto>(`/dentistry/appointments/${encodeURIComponent(id)}`);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new AppointmentApiError(
        error.status === 404 ? "La cita no existe o no está disponible." : "No se pudo cargar el detalle de la cita.",
        error.status,
      );
    }
    throw error;
  }
}

export async function createAppointment(
  payload: CreateAppointmentRequest,
): Promise<AppointmentDto> {
  try {
    const { data } = await api.post<AppointmentDto>("/dentistry/appointments", payload);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function updateAppointmentStatus(
  id: string,
  payload: {
    status:
      | "SCHEDULED"
      | "CONFIRMED"
      | "WAITING_ROOM"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "NO_SHOW";
    notes?: string;
  },
): Promise<AppointmentDto> {
  try {
    const { data } = await api.patch<AppointmentDto>(
      `/dentistry/appointments/${encodeURIComponent(id)}/status`,
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

export async function cancelAppointment(
  id: string,
  payload: {
    canceledByMembershipId?: string;
    reason: string;
  },
): Promise<AppointmentDto> {
  try {
    const { data } = await api.post<AppointmentDto>(
      `/dentistry/appointments/${encodeURIComponent(id)}/cancel`,
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
