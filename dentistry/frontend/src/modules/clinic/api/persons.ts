const API_BASE = "/api/dentistry";

export class PersonApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export interface Person {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nombreCompleto?: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  convertedToPatientId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonInput {
  nombreCompleto: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  // Compatibilidad alternativa
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

export interface ConvertPersonToPatientInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  birthDate?: string | null;
  sex?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  notes?: string;
}

export interface ConvertPersonToPatientResponse {
  patient: {
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
  };
  reassignedAppointmentsCount: number;
}

export async function createPerson(
  payload: CreatePersonInput,
): Promise<Person> {
  const res = await fetch(`${API_BASE}/persons`, {
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
      : errorData.message || `Error al crear persona: ${res.statusText}`;
    throw new PersonApiError(message, res.status);
  }
  return res.json();
}

export async function listPersons(params?: {
  search?: string;
  onlyUnconverted?: boolean;
}): Promise<Person[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.onlyUnconverted !== undefined) {
    query.append("onlyUnconverted", String(params.onlyUnconverted));
  }

  const res = await fetch(`${API_BASE}/persons?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Error al listar personas: ${res.statusText}`;
    throw new PersonApiError(message, res.status);
  }
  return res.json();
}

export async function getPersonById(id: string): Promise<Person> {
  const res = await fetch(`${API_BASE}/persons/${id}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || `Error al obtener persona: ${res.statusText}`;
    throw new PersonApiError(message, res.status);
  }
  return res.json();
}

export const fetchPersons = listPersons;
export const fetchPersonById = getPersonById;

export async function convertPersonToPatient(
  personId: string,
  payload: ConvertPersonToPatientInput,
): Promise<ConvertPersonToPatientResponse> {
  const res = await fetch(`${API_BASE}/persons/${personId}/convert`, {
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
      : errorData.message || `Error al convertir persona a paciente: ${res.statusText}`;
    throw new PersonApiError(message, res.status);
  }
  return res.json();
}
