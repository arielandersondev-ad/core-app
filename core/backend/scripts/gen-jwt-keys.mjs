import { generateKeyPairSync } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsDir = resolve(__dirname, "..", "secrets");

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

mkdirSync(secretsDir, { recursive: true });

const privatePath = resolve(secretsDir, "jwt-private.pem");
const publicPath = resolve(secretsDir, "jwt-public.pem");

writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey, { mode: 0o644 });

console.log("Claves RSA (RS256) generadas:");
console.log(`  Privada: ${privatePath}  (solo para core, NO compartir)`);
console.log(`  Pública: ${publicPath}  (esta la usas en el otro proyecto para verificar)`);
console.log("\nNo necesitas tocar .env. Las rutas se leen con JWT_PRIVATE_KEY_PATH / JWT_PUBLIC_KEY_PATH.");
