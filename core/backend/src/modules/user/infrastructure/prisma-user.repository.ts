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
import type {
  OrganizationUserListScope,
  UserListItem,
} from '../domain/entities/user-list-item.js';
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

  async listUsers(): Promise<UserListItem[]> {
    const [users, memberships, organizations, branches, membershipBranches, roles, membershipRoles] = await Promise.all([
      this.prisma.orm.core.User.all(),
      this.prisma.orm.core.Membership.all(),
      this.prisma.orm.core.Organization.all(),
      this.prisma.orm.core.Branch.all(),
      this.prisma.orm.core.MembershipBranch.all(),
      this.prisma.orm.core.Role.all(),
      this.prisma.orm.core.MembershipRole.all(),
    ]);
    const organizationsById = new Map(organizations.filter((item) => !item.deleted).map((item) => [String(item.id), item]));
    const branchesById = new Map(branches.filter((item) => !item.deleted).map((item) => [String(item.id), item]));
    const rolesById = new Map(roles.filter((item) => !item.deleted).map((item) => [String(item.id), item]));
    return users.filter((user) => !user.deleted).map((user) => ({
      id: String(user.id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
      memberships: memberships
        .filter((membership) => !membership.deleted && String(membership.userId) === String(user.id))
        .map((membership) => ({
          organizationId: String(membership.organizationId),
          organizationName: organizationsById.get(String(membership.organizationId))?.name ?? 'Organización no disponible',
          branchNames: membershipBranches
            .filter((link) => !link.deleted && String(link.membershipId) === String(membership.id))
            .map((link) => branchesById.get(String(link.branchId))?.name)
            .filter((name): name is string => Boolean(name)),
          roleNames: membershipRoles
            .filter((link) => !link.deleted && String(link.membershipId) === String(membership.id))
            .map((link) => rolesById.get(String(link.roleId))?.name)
            .filter((name): name is string => Boolean(name)),
        })),
    }));
  }

  async listUsersByOrganizationScope(
    scope: OrganizationUserListScope,
  ): Promise<UserListItem[]> {
    const organization = await this.prisma.orm.core.Organization.first({
      id: toUuid36(scope.organizationId),
    });
    if (!organization || organization.deleted || organization.status !== 'ACTIVE') {
      return [];
    }

    const memberships = await this.prisma.orm.core.Membership.where({
      organizationId: toUuid36(scope.organizationId),
      deleted: false,
      status: 'ACTIVE',
    }).all();
    const allowedBranchIds = scope.branchIds === null
      ? null
      : new Set(scope.branchIds);

    const items = await Promise.all(memberships.map(async (membership) => {
      const membershipBranches = await this.prisma.orm.core.MembershipBranch.where({
        membershipId: membership.id,
        deleted: false,
      }).all();
      const branches = (await Promise.all(membershipBranches.map(async (link) => {
        const branch = await this.prisma.orm.core.Branch.first({ id: link.branchId });
        if (
          !branch ||
          branch.deleted ||
          branch.status !== 'ACTIVE' ||
          String(branch.organizationId) !== scope.organizationId
        ) {
          return null;
        }
        return branch;
      }))).filter((branch): branch is NonNullable<typeof branch> => Boolean(branch));

      const visibleBranches = allowedBranchIds === null
        ? branches
        : branches.filter((branch) => allowedBranchIds.has(String(branch.id)));
      if (allowedBranchIds !== null && visibleBranches.length === 0) return null;

      const user = await this.prisma.orm.core.User.first({ id: membership.userId });
      if (!user || user.deleted) return null;

      const membershipRoles = await this.prisma.orm.core.MembershipRole.where({
        membershipId: membership.id,
        deleted: false,
      }).all();
      const roleNames = (await Promise.all(membershipRoles.map(async (link) => {
        const role = await this.prisma.orm.core.Role.first({ id: link.roleId });
        if (
          !role ||
          role.deleted ||
          (role.organizationId !== null &&
            String(role.organizationId) !== scope.organizationId)
        ) {
          return null;
        }
        return role.name;
      }))).filter((name): name is string => Boolean(name));

      return {
        id: String(user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        createdAt: user.createdAt,
        memberships: [{
          organizationId: scope.organizationId,
          organizationName: organization.name,
          branchNames: visibleBranches.map((branch) => branch.name),
          roleNames,
        }],
      } satisfies UserListItem;
    }));

    return items.filter((item): item is UserListItem => item !== null);
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
