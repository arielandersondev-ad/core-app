import "server-only";

import fs from "node:fs";
import path from "node:path";
import { createSign, randomUUID } from "node:crypto";
import { DEV_PERSONAS, type DevPersona } from "../types/personas";

function findPrivateKey(): string {
  const possiblePaths = [
    process.env.JWT_PRIVATE_KEY_PATH && path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../../", process.env.JWT_PRIVATE_KEY_PATH),
    path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../../core/backend/secrets/jwt-private.pem"),
    path.resolve(/*turbopackIgnore: true*/ process.cwd(), "../core/backend/secrets/jwt-private.pem"),
    path.resolve(/*turbopackIgnore: true*/ process.cwd(), "secrets/jwt-private.pem"),
    "D:/core-app/core/backend/secrets/jwt-private.pem",
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(/*turbopackIgnore: true*/ p)) {
      return fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
    }
  }
  throw new Error(
    "No se encontró el archivo de clave privada 'jwt-private.pem' para firmar tokens de desarrollo.",
  );
}

function base64url(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf.toString("base64url");
}

export function createDevJwt(persona: DevPersona, lifetimeSeconds = 1800): string {
  const privateKeyPem = findPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "at+jwt",
    kid: process.env.JWT_KEY_ID || "core-auth-2026-01",
  };

  const payload = {
    sub: persona.sub,
    membershipId: persona.membershipId,
    organizationId: persona.organizationId,
    branchIds: persona.branchIds,
    permissions: persona.permissions,
    jti: randomUUID(),
    iss: process.env.JWT_ISSUER || "core-auth",
    aud: process.env.JWT_DENTISTRY_AUDIENCE || "dentistry-api",
    iat: now,
    exp: now + lifetimeSeconds,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signatureB64 = signer.sign(privateKeyPem, "base64url");

  return `${unsignedToken}.${signatureB64}`;
}

export function decodePersonaFromToken(token: string | null): DevPersona | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    const membershipId = payload.membershipId;
    for (const persona of Object.values(DEV_PERSONAS)) {
      if (persona.membershipId === membershipId) {
        return persona;
      }
    }
  } catch {
    return null;
  }
  return null;
}
