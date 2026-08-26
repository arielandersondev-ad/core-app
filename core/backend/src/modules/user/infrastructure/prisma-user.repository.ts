import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { writeAuditLog } from "../../../common/infrastructure/prisma-audit.writer.js";
import {
  CreateUserWithAccess,
  MembershipSummary,
  User,
  UserWithMembership,
} from "../domain/entities/user.entity.js";
import { UserRepository } from "../domain/repositories/user.repository.js";
import { PasswordHasher } from "../domain/services/password-hasher.js";
import { toUuid36 } from "../../../common/infrastructure/prisma-uuid.js";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toUserEntity(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    status: row.status,
    emailVerifiedAt: row.emailVerifiedAt,
    deleted: row.deleted,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(
    private prisma: PrismaService,
    private passwordHasher: PasswordHasher,
  ) {
    super();
  }

  async emailExists(email: string): Promise<boolean> {
    const row = await this.prisma.orm.core.User
      .where({ email })
      .first();

    return !!row && !row.deleted;
  }

  async createUserWithMembership(
    input: CreateUserWithAccess,
  ): Promise<UserWithMembership> {
    // El hash se calcula ANTES de abrir la transacción para no sostener
    // una conexión de base de datos durante el hashing (lento por diseño).
    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.prisma.transaction(async (tx) => {
      const organization = await tx.orm.core.Organization.first({
        id: toUuid36(input.organizationId),
      });
      if (!organization || organization.deleted) {
        throw new BadRequestException(
          `La organización ${input.organizationId} no existe`,
        );
      }

      for (const branchId of input.branchIds) {
        const branch = await tx.orm.core.Branch.first({ id: toUuid36(branchId) });
        if (
          !branch ||
          branch.deleted ||
          branch.organizationId !== toUuid36(input.organizationId)
        ) {
          throw new BadRequestException(
            `La sucursal ${branchId} no pertenece a la organización indicada`,
          );
        }
      }

      for (const roleId of input.roleIds) {
        const role = await tx.orm.core.Role.first({ id: toUuid36(roleId) });
        if (
          !role ||
          role.deleted ||
          (role.organizationId !== null &&
            role.organizationId !== toUuid36(input.organizationId))
        ) {
          throw new BadRequestException(
            `El rol ${roleId} no es válido para la organización indicada`,
          );
        }
      }

      const userRow = await tx.orm.core.User.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      });

      await tx.orm.core.Authorization.create({
        userId: toUuid36(userRow.id),
        passwordHash,
      });

      const membershipRow = await tx.orm.core.Membership.create({
        userId: toUuid36(userRow.id),
        organizationId: toUuid36(input.organizationId),
        status: "ACTIVE",
        joinedAt: new Date(),
      });

      const membershipBranchRows: { id: string; branchId: string }[] = [];
      for (const branchId of input.branchIds) {
        membershipBranchRows.push(
          await tx.orm.core.MembershipBranch.create({
            membershipId: membershipRow.id,
            branchId: toUuid36(branchId),
          }),
        );
      }

      const membershipRoleRows: { id: string; roleId: string }[] = [];
      for (const roleId of input.roleIds) {
        membershipRoleRows.push(
          await tx.orm.core.MembershipRole.create({
            membershipId: membershipRow.id,
            roleId: toUuid36(roleId),
          }),
        );
      }

      await writeAuditLog(tx, {
        organizationId: toUuid36(input.organizationId),
        userId: userRow.id,
        action: "USER_CREATED",
        resource: "User",
        resourceId: userRow.id,
        metadata: { email: input.email },
      });

      await writeAuditLog(tx, {
        organizationId: input.organizationId,
        userId: userRow.id,
        action: "MEMBERSHIP_CREATED",
        resource: "Membership",
        resourceId: membershipRow.id,
        metadata: {
          branchesLinked: membershipBranchRows.length,
          rolesLinked: membershipRoleRows.map((row) => row.roleId),
        },
      });

      const membership: MembershipSummary = {
        id: membershipRow.id,
        userId: membershipRow.userId,
        organizationId: membershipRow.organizationId,
        status: membershipRow.status,
        joinedAt: membershipRow.joinedAt,
        branchIds: input.branchIds,
        roleIds: input.roleIds,
      };

      return {
        user: toUserEntity(userRow),
        membership,
      };
    });
  }
}
