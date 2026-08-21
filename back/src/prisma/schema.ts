import { defineContract } from '@prisma/orm-postgres/contract-builder';

export const contract = defineContract({}, ({ field, model, rel }) => {
  // =========================================================
  // USER
  // =========================================================
  const User = model('User', {
    fields: {
      id: field.id.uuidv7String(),

      email: field.text().unique(),
      firstName: field.text(),
      lastName: field.text(),
      phone: field.text().optional(),

      status: field.text().default('ACTIVE'),
      emailVerifiedAt: field.temporal.timestamp().optional(),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // AUTHORIZATION
  // =========================================================
  const Authorization = model('Authorization', {
    fields: {
      id: field.id.uuidv7String(),
      userId: field.uuidString().unique(),

      passwordHash: field.text(),
      passwordChangedAt: field.temporal.timestamp().optional(),

      failedAttempts: field.int().default(0),
      lockedUntil: field.temporal.timestamp().optional(),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // SESSION
  // =========================================================
  const Session = model('Session', {
    fields: {
      id: field.id.uuidv7String(),
      userId: field.uuidString(),

      refreshTokenHash: field.text(),

      ipAddress: field.text().optional(),
      userAgent: field.text().optional(),

      expiresAt: field.temporal.timestamp(),
      lastUsedAt: field.temporal.timestamp().optional(),
      revokedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // ORGANIZATION
  // =========================================================
  const Organization = model('Organization', {
    fields: {
      id: field.id.uuidv7String(),

      name: field.text(),
      legalName: field.text().optional(),
      taxId: field.text().optional(),

      email: field.text().optional(),
      phone: field.text().optional(),
      website: field.text().optional(),

      country: field.text(),
      timezone: field.text(),

      status: field.text().default('ACTIVE'),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // BRANCH
  // =========================================================
  const Branch = model('Branch', {
    fields: {
      id: field.id.uuidv7String(),
      organizationId: field.uuidString(),

      name: field.text(),
      code: field.text().optional(),

      email: field.text().optional(),
      phone: field.text().optional(),

      addressLine1: field.text().optional(),
      addressLine2: field.text().optional(),
      city: field.text().optional(),
      state: field.text().optional(),
      country: field.text(),
      postalCode: field.text().optional(),

      // Para esta primera migración usamos float.
      // Más adelante podemos pasar a PostGIS si necesitas
      // búsquedas geoespaciales reales.
      latitude: field.float().optional(),
      longitude: field.float().optional(),

      timezone: field.text(),

      status: field.text().default('ACTIVE'),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // MEMBERSHIP
  // =========================================================
  const Membership = model('Membership', {
    fields: {
      id: field.id.uuidv7String(),

      userId: field.uuidString(),
      organizationId: field.uuidString(),

      status: field.text().default('INVITED'),
      joinedAt: field.temporal.timestamp().optional(),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // MEMBERSHIP <-> BRANCH
  // =========================================================
  const MembershipBranch = model('MembershipBranch', {
    fields: {
      id: field.id.uuidv7String(),

      membershipId: field.uuidString(),
      branchId: field.uuidString(),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
    },
  });

  // =========================================================
  // ROLE
  // =========================================================
  const Role = model('Role', {
    fields: {
      id: field.id.uuidv7String(),

      // null => rol global
      organizationId: field.uuidString().optional(),

      name: field.text(),
      code: field.text(),
      description: field.text().optional(),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  // =========================================================
  // MEMBERSHIP <-> ROLE
  // =========================================================
  const MembershipRole = model('MembershipRole', {
    fields: {
      id: field.id.uuidv7String(),

      membershipId: field.uuidString(),
      roleId: field.uuidString(),

      deleted: field.boolean().default(false),
      deletedAt: field.temporal.timestamp().optional(),

      createdAt: field.temporal.createdAt(),
    },
  });

  // =========================================================
  // AUDIT LOG
  // =========================================================
  const AuditLog = model('AuditLog', {
    fields: {
      id: field.id.uuidv7String(),

      organizationId: field.uuidString().optional(),
      branchId: field.uuidString().optional(),
      userId: field.uuidString().optional(),

      action: field.text(),
      resource: field.text(),
      resourceId: field.text().optional(),

      ipAddress: field.text().optional(),
      userAgent: field.text().optional(),

      metadata: field.json().optional(),

      createdAt: field.temporal.createdAt(),
    },
  });

  // =========================================================
  // RELATIONS
  // =========================================================

  return {
    models: {
      User: User.relations({
        authorization: rel.hasOne(Authorization, {
          by: 'userId',
        }),

        sessions: rel.hasMany(Session, {
          by: 'userId',
        }),

        memberships: rel.hasMany(Membership, {
          by: 'userId',
        }),

        auditLogs: rel.hasMany(AuditLog, {
          by: 'userId',
        }),
      }),

      Authorization: Authorization.relations({
        user: rel.belongsTo(User, {
          from: 'userId',
          to: 'id',
        }),
      }),

      Session: Session.relations({
        user: rel.belongsTo(User, {
          from: 'userId',
          to: 'id',
        }),
      }),

      Organization: Organization.relations({
        branches: rel.hasMany(Branch, {
          by: 'organizationId',
        }),

        memberships: rel.hasMany(Membership, {
          by: 'organizationId',
        }),

        roles: rel.hasMany(Role, {
          by: 'organizationId',
        }),

        auditLogs: rel.hasMany(AuditLog, {
          by: 'organizationId',
        }),
      }),

      Branch: Branch.relations({
        organization: rel.belongsTo(Organization, {
          from: 'organizationId',
          to: 'id',
        }),

        membershipBranches: rel.hasMany(MembershipBranch, {
          by: 'branchId',
        }),

        auditLogs: rel.hasMany(AuditLog, {
          by: 'branchId',
        }),
      }),

      Membership: Membership.relations({
        user: rel.belongsTo(User, {
          from: 'userId',
          to: 'id',
        }),

        organization: rel.belongsTo(Organization, {
          from: 'organizationId',
          to: 'id',
        }),

        branches: rel.hasMany(MembershipBranch, {
          by: 'membershipId',
        }),

        roles: rel.hasMany(MembershipRole, {
          by: 'membershipId',
        }),
      }),

      MembershipBranch: MembershipBranch.relations({
        membership: rel.belongsTo(Membership, {
          from: 'membershipId',
          to: 'id',
        }),

        branch: rel.belongsTo(Branch, {
          from: 'branchId',
          to: 'id',
        }),
      }),

      Role: Role.relations({
        organization: rel.belongsTo(Organization, {
          from: 'organizationId',
          to: 'id',
        }),

        membershipRoles: rel.hasMany(MembershipRole, {
          by: 'roleId',
        }),
      }),

      MembershipRole: MembershipRole.relations({
        membership: rel.belongsTo(Membership, {
          from: 'membershipId',
          to: 'id',
        }),

        role: rel.belongsTo(Role, {
          from: 'roleId',
          to: 'id',
        }),
      }),

      AuditLog: AuditLog.relations({
        organization: rel.belongsTo(Organization, {
          from: 'organizationId',
          to: 'id',
        }),

        branch: rel.belongsTo(Branch, {
          from: 'branchId',
          to: 'id',
        }),

        user: rel.belongsTo(User, {
          from: 'userId',
          to: 'id',
        }),
      }),
    },
  };
});