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

    async onModuleDestroy() {
        await db.close();
    }
}