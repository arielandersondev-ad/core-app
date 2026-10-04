// Carga scripts/seed-dentistry.sql contra la base de DATABASE_URL.
//
// Los comandos `npm run ...` no leen el .env del paquete (solo lo hace
// prisma.config.ts), así que el seed necesita su propio cargador para que
// `npm run db:seed` funcione sin exportar variables a mano.
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Crea packages/db/.env a partir de .env.example.");
  process.exit(1);
}

const sqlPath = join(dirname(fileURLToPath(import.meta.url)), "seed-dentistry.sql");
const isWin = process.platform === "win32";
const psql = isWin ? "psql.exe" : "psql";

const result = spawnSync(psql, ["-v", "ON_ERROR_STOP=1", url, "-f", sqlPath], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
