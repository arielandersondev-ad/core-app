const API_BASE = "/api/dentistry";

export interface ProfessionalDto {
  id: string; // membershipId
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  color: string;
}

export async function fetchProfessionals(
  organizationId: string,
): Promise<ProfessionalDto[]> {
  const res = await fetch(
    `${API_BASE}/clinic/professionals?organizationId=${organizationId}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(`Error al obtener profesionales: ${res.statusText}`);
  }
  return res.json();
}
