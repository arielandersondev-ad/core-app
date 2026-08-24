import type { db } from "../../prisma/db.js";

export type TransactionContext = Parameters<Parameters<typeof db.transaction>[0]>[0];
