import { env } from "@/infrastructure/config/env";

// El estado no existe como columna en ClinicalEncounter: el backend lo deriva
// de `endedAt`. Se replica aquí para que la vista no tenga que calcularlo.
export type ClinicalEncounterStatus = "IN_PROGRESS" | "COMPLETED";

export interface ClinicalEncounterDto {
  id: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  appointmentId?: string | null;
  treatmentId?: string | null;
  professionalMembershipId: string;
  startedAt: string;
  endedAt?: string | null;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  procedurePerformed?: string | null;
  evolution?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicalEncounterRequest {
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  appointmentId?: string;
  treatmentId?: string;
  startedAt: string;
  chiefComplaint?: string;
  diagnosis?: string;
  procedurePerformed?: string;
  evolution?: string;
  recommendations?: string;
  notes?: string;
  createdByMembershipId: string;
}

export interface ListClinicalEncountersParams {
  organizationId: string;
  branchId?: string;
  patientId?: string;
  professionalMembershipId?: string;
  appointmentId?: string;
  treatmentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: ClinicalEncounterStatus;
}

export interface UpdateClinicalEncounterRequest {
  chiefComplaint?: string;
  diagnosis?: string;
  procedurePerformed?: string;
  evolution?: string;
  recommendations?: string;
  notes?: string;
  updatedByMembershipId: string;
}

async function readError(res: Response, fallback: string): Promise<Error> {
  const errorData = await res.json().catch(() => ({}));
  const message = Array.isArray(errorData.message)
    ? errorData.message.join(", ")
    : errorData.message || fallback;
  return new Error(message);
}

export async function fetchClinicalEncounters(
  params: ListClinicalEncountersParams,
): Promise<ClinicalEncounterDto[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });

  const res = await fetch(
    `${env.apiUrl}/clinical-encounters?${query.toString()}`,
    { headers: { Accept: "application/json" } },
  );

  if (!res.ok) {
    throw await readError(res, `Error al obtener consultas: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchClinicalEncounterById(
  id: string,
): Promise<ClinicalEncounterDto> {
  const res = await fetch(`${env.apiUrl}/clinical-encounters/${id}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw await readError(
      res,
      `Error al obtener detalle de la consulta: ${res.statusText}`,
    );
  }
  return res.json();
}

export async function createClinicalEncounter(
  payload: CreateClinicalEncounterRequest,
): Promise<ClinicalEncounterDto> {
  const res = await fetch(`${env.apiUrl}/clinical-encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await readError(res, `Error al crear consulta: ${res.statusText}`);
  }
  return res.json();
}

export async function updateClinicalEncounter(
  id: string,
  payload: UpdateClinicalEncounterRequest,
): Promise<ClinicalEncounterDto> {
  const res = await fetch(`${env.apiUrl}/clinical-encounters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await readError(res, `Error al actualizar consulta: ${res.statusText}`);
  }
  return res.json();
}

export async function completeClinicalEncounter(
  id: string,
  payload: { endedAt?: string; updatedByMembershipId: string },
): Promise<ClinicalEncounterDto> {
  const res = await fetch(`${env.apiUrl}/clinical-encounters/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await readError(res, `Error al completar consulta: ${res.statusText}`);
  }
  return res.json();
}

// La vista necesita distinguir abierta de cerrada para habilitar los campos.
// El backend ya devuelve `endedAt`; el status sólo evita repetir la regla.
export function isEncounterOpen(dto: ClinicalEncounterDto): boolean {
  return dto.endedAt === null || dto.endedAt === undefined;
}