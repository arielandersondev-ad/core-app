import { getAccessToken } from "@/infrastructure/auth/server-session";
import { decodePersonaFromToken } from "../services/dev-token.service";
import { DevPersonaSwitcher } from "./DevPersonaSwitcher";

/** Solo para resaltar la sesión activa en el selector; no valida nada. */
function tokenSubject(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf-8"));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function DevPersonaSwitcherServer() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const token = await getAccessToken();
  const persona = decodePersonaFromToken(token);

  return (
    <DevPersonaSwitcher
      currentPersonaId={persona?.id ?? null}
      currentUserId={tokenSubject(token)}
      realSession={token !== null && persona === null}
    />
  );
}
