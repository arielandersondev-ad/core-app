import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { writeAuditLog } from '../../../common/infrastructure/prisma-audit.writer.js';
import {
  CreateUserWithAccess,
  MembershipSummary,
  User,
  UserAuthRecord,
  UserWithMembership,
} from '../domain/entities/user.entity.js';
import { UserRepository } from '../domain/repositories/user.repository.js';
import { PasswordHasher } from '../domain/services/password-hasher.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { isPostgresUniqueViolation } from '../../../common/infrastructure/postgres-error.js';
import { MembershipAlreadyExistsError } from '../domain/errors/membership-already-exists.error.js';

const MEMBERSHIP_ACTIVE_USER_ORG_UNIQUE_INDEX =
  'membership_active_user_org_uidx_7e329682';

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
    const row = await this.prisma.orm.core.User.where({ email }).first();

    return !!row && !row.deleted;
  }

  async findAuthRecord(email: string): Promise<UserAuthRecord | null> {
    const userRow = await this.prisma.orm.core.User.where({ email }).first();

    if (!userRow || userRow.deleted || userRow.status !== 'ACTIVE') {
      return null;
    }

    const auth = await this.prisma.orm.core.Authorization.where({
      userId: toUuid36(userRow.id),
    }).first();

    if (
      !auth ||
      auth.deleted ||
      auth.passwordHash.trim().length === 0 ||
      (auth.lockedUntil !== null && auth.lockedUntil > new Date())
    ) {
      return null;
    }

    const memberships = await this.prisma.orm.core.Membership.where({
      userId: toUuid36(userRow.id),
      deleted: false,
    }).all();

    const activeMemberships = memberships.filter(
      (membership) => membership.status === 'ACTIVE',
    );

    if (activeMemberships.length !== 1) {
      return null;
    }

    const membership = activeMemberships[0];
    const organization = await this.prisma.orm.core.Organization.first({
      id: membership.organizationId,
    });

    if (
      !organization ||
      organization.deleted ||
      organization.status !== 'ACTIVE'
    ) {
      return null;
    }

    const branchIds = new Set<string>();
    const membershipBranches =
      await this.prisma.orm.core.MembershipBranch.where({
        membershipId: membership.id,
        deleted: false,
      }).all();

    for (const membershipBranch of membershipBranches) {
      const branch = await this.prisma.orm.core.Branch.first({
        id: membershipBranch.branchId,
      });
      if (
        branch &&
        !branch.deleted &&
        branch.status === 'ACTIVE' &&
        branch.organizationId === membership.organizationId
      ) {
        branchIds.add(String(branch.id));
      }
    }

    const roleIds = new Set<string>();
    const roleCodes = new Set<string>();
    const membershipRoles = await this.prisma.orm.core.MembershipRole.where({
      membershipId: membership.id,
      deleted: false,
    }).all();

    for (const membershipRole of membershipRoles) {
      const role = await this.prisma.orm.core.Role.first({
        id: membershipRole.roleId,
      });
      if (
        role &&
        !role.deleted &&
        (role.organizationId === null ||
          role.organizationId === membership.organizationId)
      ) {
        roleIds.add(String(role.id));
        roleCodes.add(role.code.trim().toUpperCase());
      }
    }

    return {
      user: toUserEntity(userRow),
      membershipId: String(membership.id),
      organizationId: String(membership.organizationId),
      branchIds: [...branchIds],
      roleIds: [...roleIds],
      roleCodes: [...roleCodes],
      passwordHash: auth.passwordHash,
    };
  }

  async createUserWithMembership(
    input: CreateUserWithAccess,
  ): Promise<UserWithMembership> {
    // El hash se calcula ANTES de abrir la transacción para no sostener
    // una conexión de base de datos durante el hashing (lento por diseño).
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      return await this.prisma.transaction(async (tx) => {
        const organization = await tx.orm.core.Organization.first({
          id: toUuid36(input.organizationId),
        });
        if (
          !organization ||
          organization.deleted ||
          organization.status !== 'ACTIVE'
        ) {
          throw new BadRequestException(
            `La organización ${input.organizationId} no existe`,
          );
        }

        for (const branchId of input.branchIds) {
          const branch = await tx.orm.core.Branch.first({
            id: toUuid36(branchId),
          });
          if (
            !branch ||
            branch.deleted ||
            branch.status !== 'ACTIVE' ||
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

        const existingMembership = await tx.orm.core.Membership.where({
          userId: toUuid36(userRow.id),
          organizationId: toUuid36(input.organizationId),
          deleted: false,
        }).first();
        if (existingMembership) {
          throw new MembershipAlreadyExistsError();
        }

        const membershipRow = await tx.orm.core.Membership.create({
          userId: toUuid36(userRow.id),
          organizationId: toUuid36(input.organizationId),
          status: 'ACTIVE',
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
          action: 'USER_CREATED',
          resource: 'User',
          resourceId: userRow.id,
          metadata: { email: input.email },
        });

        await writeAuditLog(tx, {
          organizationId: input.organizationId,
          userId: userRow.id,
          action: 'MEMBERSHIP_CREATED',
          resource: 'Membership',
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
    } catch (error) {
      if (
        error instanceof MembershipAlreadyExistsError ||
        isPostgresUniqueViolation(error, [
          MEMBERSHIP_ACTIVE_USER_ORG_UNIQUE_INDEX,
        ])
      ) {
        throw new MembershipAlreadyExistsError();
      }
      throw error;
    }
  }
}
