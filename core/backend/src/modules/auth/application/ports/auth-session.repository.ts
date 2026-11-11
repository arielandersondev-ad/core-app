export type AuthSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export type NewAuthSession = {
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
};

export abstract class AuthSessionRepository {
  abstract create(input: NewAuthSession): Promise<AuthSessionRecord>;
  abstract findById(id: string): Promise<AuthSessionRecord | null>;
  /** Reemplaza el hash solo si sigue siendo el esperado y la sesión no fue revocada. */
  abstract rotate(id: string, expectedHash: string, nextHash: string, usedAt: Date): Promise<boolean>;
  abstract revoke(id: string, revokedAt: Date): Promise<void>;
  abstract revokeAllForUser(userId: string, revokedAt: Date): Promise<number>;
}
