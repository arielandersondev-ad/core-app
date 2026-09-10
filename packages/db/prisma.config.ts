import "dotenv/config";

import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

/**
 * ÚNICO config canónico de la base compartida.
 * Todos los comandos del CLI (contract emit / migration plan / migrate /
 * db verify) se ejecutan desde este paquete.
 */
export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/schema.ts",

    // Artefactos generados fuera de src/prisma para no colisionar con
    // schema.ts (el CLI emite schema.json + schema.d.ts).
    output: "./src/prisma/generated",

    db: {
      connection: process.env["DATABASE_URL"]!,
    },
  }),
});
