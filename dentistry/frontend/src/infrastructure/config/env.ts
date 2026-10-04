export const env = {
  // El backend de dentistry escucha en 3002 (dentistry/backend/src/main.ts).
  // 3000 es el propio frontend: usarlo por defecto rompía todas las llamadas.
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002",

  // TODO: sustituir por el contexto de organización de la sesión una vez exista
  // auth. Por ahora apunta a la org CrowAnt que ya existe en la base.
  organizationId:
    process.env.NEXT_PUBLIC_ORGANIZATION_ID ??
    "01a02b78-b1a4-72ac-87e0-3699e5182d3d",
  branchId:
    process.env.NEXT_PUBLIC_BRANCH_ID ?? "01a043d0-05e1-77ce-b3fe-aeccb845bbf0",
  // Membresía que actúa como autor de las operaciones mientras no haya auth.
  membershipId:
    process.env.NEXT_PUBLIC_MEMBERSHIP_ID ??
    "01a043d1-607b-75cd-a9e1-b3be724a0b38",
} as const;
