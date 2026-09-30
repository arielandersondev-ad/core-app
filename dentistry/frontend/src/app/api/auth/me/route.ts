import { getAccessToken } from "@/infrastructure/auth/server-session";
import { getCurrentSession } from "@/infrastructure/auth/current-session";

export async function GET() {
  const token = await getAccessToken();
  if (!token) return Response.json({ message: "Sesión requerida." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const session = await getCurrentSession(token);
    if (!session) return Response.json({ message: "Sesión vencida." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return Response.json(session, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "No se pudo verificar la sesión." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
