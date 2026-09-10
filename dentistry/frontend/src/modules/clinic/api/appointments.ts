import { env } from "@/infrastructure/config/env";

export interface AppointmentDto {
  id: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  serviceId: string;
  treatmentId?: string | null;
  startsAt: string;
  endsAt: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  cancelledAt?: string | null;
  cancelledByMembershipId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  serviceId: string;
  treatmentId?: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
  notes?: string;
  createdByMembershipId: string;
}

export interface ListAppointmentsParams {
  organizationId: string;
  branchId?: string;
  patientId?: string;
  professionalMembershipId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function fetchAppointments(
  params: ListAppointmentsParams,
): Promise<AppointmentDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });

  const res = await fetch(`${env.apiUrl}/appointments?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener citas: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAppointmentById(id: string): Promise<AppointmentDto> {
  const res = await fetch(`${env.apiUrl}/appointments/${id}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener detalle de la cita: ${res.statusText}`);
  }
  return res.json();
}

export async function createAppointment(
  payload: CreateAppointmentRequest,
): Promise<AppointmentDto> {
  const res = await fetch(`${env.apiUrl}/appointments`, {
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
      : errorData.message || `Error al crear cita: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updateAppointmentStatus(
  id: string,
  payload: {
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
    notes?: string;
  },
): Promise<AppointmentDto> {
  const res = await fetch(`${env.apiUrl}/appointments/${id}/status`, {
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
      : errorData.message || `Error al actualizar cita: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function cancelAppointment(
  id: string,
  payload: {
    cancelledByMembershipId: string;
    reason: string;
  },
): Promise<AppointmentDto> {
  const res = await fetch(`${env.apiUrl}/appointments/${id}/cancel`, {
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
      : errorData.message || `Error al cancelar cita: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}
