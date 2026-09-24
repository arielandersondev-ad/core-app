import { ENDPOINTS } from "@/infrastructure/api/endpoints";
import { env } from "@/infrastructure/config/env";
import type { CreateOrganizationPayload } from "../components/forms/types";

type ApiErrorBody = {
  message?: string | string[];
};

export async function createOrganizationSetup(
  payload: CreateOrganizationPayload,
): Promise<void> {
  const response = await fetch(`${env.apiUrl}${ENDPOINTS.ORGANIZATIONS.SETUP}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const message = Array.isArray(body?.message)
    ? body.message.join(". ")
    : body?.message;

  throw new Error(message ?? "No se pudo crear la organización");
}
