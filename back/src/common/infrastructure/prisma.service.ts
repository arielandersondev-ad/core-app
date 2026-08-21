import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { db } from "../../prisma/db.js";

@Injectable()
export class PrismaService implements OnModuleDestroy {
    readonly orm = db.orm;
    readonly sql = db.sql;

    async onModuleDestroy() {
        await db.close();
    }
}