import { api } from "@/infrastructure/http/api";
import { ApiError } from "@/infrastructure/http/api-error";

export class PersonApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "PersonApiError";
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
  try {
    const { data } = await api.post<Person>("/dentistry/persons", payload);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new PersonApiError(error.message, error.status);
    }
    throw error;
  }
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
  const suffix = query.size ? `?${query.toString()}` : "";

  try {
    const { data } = await api.get<Person[]>(`/dentistry/persons${suffix}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw new PersonApiError(error.message, error.status);
    }
    throw error;
  }
}

export async function getPersonById(id: string): Promise<Person> {
  try {
    const { data } = await api.get<Person>(`/dentistry/persons/${encodeURIComponent(id)}`);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new PersonApiError(error.message, error.status);
    }
    throw error;
  }
}

export const fetchPersons = listPersons;
export const fetchPersonById = getPersonById;

export async function convertPersonToPatient(
  personId: string,
  payload: ConvertPersonToPatientInput,
): Promise<ConvertPersonToPatientResponse> {
  try {
    const { data } = await api.post<ConvertPersonToPatientResponse>(
      `/dentistry/persons/${encodeURIComponent(personId)}/convert`,
      payload,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new PersonApiError(error.message, error.status);
    }
    throw error;
  }
}
