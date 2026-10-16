import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { db } from "../../prisma/db.js";
import type { TransactionContext } from "./prisma-tx.js";

@Injectable()
export class PrismaService implements OnModuleDestroy {
	readonly orm = db.orm;
	readonly sql = db.sql;

	transaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
			return db.transaction(work);
	}

	async ping(signal?: AbortSignal): Promise<void> {
		const plan = db.raw.sql`SELECT 1 AS ok`
			.returnsRow({ ok: 'pg/int4@1' })
			.build();

		const rows = await db.runtime()
			.query(plan, { signal })
			.toArray();

		if (rows[0]?.ok !== 1) {
			throw new Error('Database check failed');
		}
	}
	async onModuleDestroy() {
		await db.close();
	}
}
