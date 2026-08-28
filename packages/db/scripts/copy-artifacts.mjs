import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// tsc no copia los .d.ts de entrada al outDir: los artefactos generados
// por el CLI deben copiarse a mano para que dist/index.d.ts resuelva.
const distGenerated = fileURLToPath(
  new URL('../dist/prisma/generated/', import.meta.url),
);
mkdirSync(distGenerated, { recursive: true });

copyFileSync(
  fileURLToPath(new URL('../src/prisma/generated/contract.d.ts', import.meta.url)),
  `${distGenerated}contract.d.ts`,
);

console.log('[copy-artifacts] generated/contract.d.ts -> dist/prisma/generated/');
