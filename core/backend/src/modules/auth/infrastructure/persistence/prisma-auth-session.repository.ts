import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/infrastructure/prisma.service.js';
import {
  AuthSessionRepository,
  type AuthSessionRecord,
  type NewAuthSession,
} from '../../application/ports/auth-session.repository.js';

type AuthSessionRow = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

function toRecord(row: AuthSessionRow): AuthSessionRecord {
  return {
    id: String(row.id),
    userId: String(row.userId),
    refreshTokenHash: row.refreshTokenHash,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class PrismaAuthSessionRepository extends AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: NewAuthSession): Promise<AuthSessionRecord> {
    const row = await this.prisma.orm.core.AuthSession.create({
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      expiresAt: input.expiresAt,
      lastUsedAt: null,
      revokedAt: null,
    });
    return toRecord(row);
  }

  async findById(id: string): Promise<AuthSessionRecord | null> {
    const row = await this.prisma.orm.core.AuthSession.first({ id });
    return row ? toRecord(row) : null;
  }

  async rotate(id: string, expectedHash: string, nextHash: string, usedAt: Date): Promise<boolean> {
    const updated = await this.prisma.orm.core.AuthSession.where({
      id,
      refreshTokenHash: expectedHash,
      revokedAt: null,
    }).updateAndCount({ refreshTokenHash: nextHash, lastUsedAt: usedAt });
    return updated === 1;
  }

  async revoke(id: string, revokedAt: Date): Promise<void> {
    await this.prisma.orm.core.AuthSession.where({ id, revokedAt: null }).updateAndCount({ revokedAt });
  }

  async revokeAllForUser(userId: string, revokedAt: Date): Promise<number> {
    return await this.prisma.orm.core.AuthSession.where({ userId, revokedAt: null }).updateAndCount({ revokedAt });
  }
}
