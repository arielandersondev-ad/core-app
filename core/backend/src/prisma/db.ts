import 'dotenv/config';

import postgres from '@prisma/orm-postgres/runtime';

import type { Contract } from '@app/db/src/prisma/generated/contract.js';
import contractJson from '@app/db/src/prisma/generated/contract.json' with { type: 'json' };

/**
 * El contrato canónico vive en packages/db (@app/db).
 * Este backend solo lo consume: nunca planifica ni aplica migraciones.
 */
export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
