import { env } from "@/infrastructure/config/env";

export interface PatientDto {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  sex: string | null;
  documentType: string | null;
  documentNumber: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  sex?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  notes?: string;
  createdByMembershipId: string;
}

export interface UpdatePatientRequest {
  organizationId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  sex?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  notes?: string;
  updatedByMembershipId: string;
}

export interface ListPatientsParams {
  organizationId: string;
  search?: string;
  status?: string;
}

export async function fetchPatients(
  params: ListPatientsParams,
): Promise<PatientDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });

  const res = await fetch(`${env.apiUrl}/patients?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener pacientes: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPatientById(
  id: string,
  organizationId: string,
): Promise<PatientDto> {
  const res = await fetch(
    `${env.apiUrl}/patients/${id}?organizationId=${organizationId}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(`Error al obtener paciente: ${res.statusText}`);
  }
  return res.json();
}

export async function createPatient(
  payload: CreatePatientRequest,
): Promise<PatientDto> {
  const res = await fetch(`${env.apiUrl}/patients`, {
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
      : errorData.message || `Error al crear paciente: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updatePatient(
  id: string,
  payload: UpdatePatientRequest,
): Promise<PatientDto> {
  const res = await fetch(`${env.apiUrl}/patients/${id}`, {
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
      : errorData.message || `Error al actualizar paciente: ${res.statusText}`;
    throw new Error(message);
  }
  return res.json();
}
