import { getAccessToken } from "@/infrastructure/auth/server-session";
import { decodePersonaFromToken } from "../services/dev-token.service";
import { DevPersonaSwitcher } from "./DevPersonaSwitcher";

export async function DevPersonaSwitcherServer() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const token = await getAccessToken();
  const persona = decodePersonaFromToken(token);

  return <DevPersonaSwitcher currentPersonaId={persona?.id ?? null} />;
}
