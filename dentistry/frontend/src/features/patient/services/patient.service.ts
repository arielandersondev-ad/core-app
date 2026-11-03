import { PATIENT_ENDPOINTS } from "@/features/patient/api/endpoints";
import type {
  CreatePatientRequest,
  ListPatientsParams,
  PatientDto,
  UpdatePatientRequest,
} from "@/features/patient/types/patient";
import { requestJson } from "@/infrastructure/http/request-json";
import type { PaginatedResult } from "@/shared/types/pagination";

export function fetchPatients(params: ListPatientsParams = {}, signal?: AbortSignal): Promise<PaginatedResult<PatientDto>> {
  const query = new URLSearchParams();
  for (const key of ["search", "status", "page", "pageSize"] as const) {
    const value = params[key];
    if (value !== undefined) query.set(key, String(value));
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson(`${PATIENT_ENDPOINTS.collection}${suffix}`, { signal });
}

export function fetchPatientById(id: string): Promise<PatientDto> {
  return requestJson(PATIENT_ENDPOINTS.byId(id));
}

export function createPatient(payload: CreatePatientRequest): Promise<PatientDto> {
  return requestJson(PATIENT_ENDPOINTS.collection, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updatePatient(id: string, payload: UpdatePatientRequest): Promise<PatientDto> {
  return requestJson(PATIENT_ENDPOINTS.byId(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deletePatient(id: string): Promise<PatientDto> {
  return requestJson(PATIENT_ENDPOINTS.byId(id), { method: "DELETE" });
}
