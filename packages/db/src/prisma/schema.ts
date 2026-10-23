import { check, defineContract } from "@prisma/orm-postgres/contract-builder";

/**
 * Full target schema from docs/target-schema-dictionary.md.
 * Breaking contract: adapt both backends and reconcile existing data before migration.
 * Core and Dentistry reference each other by id, without cross-schema foreign keys.
 * Pending role/access decisions remain application rules; this schema does not grant access.
 */
const CORE_NAMESPACE = "core" as const;
const DENTISTRY_NAMESPACE = "dentistry" as const;
type ContractBuilderContext = Parameters<
  Parameters<typeof defineContract>[1]
>[0];

function buildCoreModels({ field, model, rel }: ContractBuilderContext) {
  const User = model("User", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      email: field.text().unique(),
      firstName: field.text(),
      lastName: field.text(),
      phone: field.text().optional(),
      status: field.text().default("ACTIVE"),
      emailVerifiedAt: field.temporal.timestamptz().optional(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const UserCredential = model("UserCredential", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      userId: field.uuidNative().unique(),
      passwordHash: field.text(),
      passwordChangedAt: field.temporal.timestamptz().optional(),
      failedAttempts: field.int().default(0),
      lockedUntil: field.temporal.timestamptz().optional(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const AuthSession = model("AuthSession", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      userId: field.uuidNative(),
      refreshTokenHash: field.text(),
      ipAddress: field.text().optional(),
      userAgent: field.text().optional(),
      expiresAt: field.temporal.timestamptz(),
      lastUsedAt: field.temporal.timestamptz().optional(),
      revokedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const Organization = model("Organization", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      name: field.text(),
      legalName: field.text().optional(),
      taxId: field.text().optional(),
      email: field.text().optional(),
      phone: field.text().optional(),
      website: field.text().optional(),
      country: field.text(),
      timezone: field.text(),
      status: field.text().default("ACTIVE"),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const Branch = model("Branch", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
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
      latitude: field.float().optional(),
      longitude: field.float().optional(),
      timezone: field.text(),
      status: field.text().default("ACTIVE"),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const OrganizationMembership = model("OrganizationMembership", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      userId: field.uuidNative(),
      organizationId: field.uuidNative(),
      status: field.text().default("INVITED"),
      joinedAt: field.temporal.timestamptz().optional(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const OrganizationMembershipBranch = model("OrganizationMembershipBranch", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      membershipId: field.uuidNative(),
      branchId: field.uuidNative(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
    },
  });

  const Role = model("Role", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative().optional(),
      name: field.text(),
      code: field.text(),
      description: field.text().optional(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const Permission = model("Permission", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      code: field.text().unique(),
      name: field.text(),
      description: field.text().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const RolePermission = model("RolePermission", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      roleId: field.uuidNative(),
      permissionId: field.uuidNative(),
      createdAt: field.temporal.createdAt(),
    },
  });

  const OrganizationMembershipRole = model("OrganizationMembershipRole", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      membershipId: field.uuidNative(),
      roleId: field.uuidNative(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
    },
  });

  const Plan = model("Plan", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      code: field.text().unique(),
      name: field.text(),
      description: field.text().optional(),
      type: field.text().default("PUBLIC"),
      vertical: field.text(),
      durationDays: field.int(),
      entitlements: field.json(),
      priceMinor: field.int().optional(),
      currency: field.text().optional(),
      isActive: field.boolean().default(true),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const OrganizationPlanAssignment = model("OrganizationPlanAssignment", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      planId: field.uuidNative(),
      vertical: field.text(),
      status: field.text().default("ACTIVE"),
      startsAt: field.temporal.timestamptz(),
      endsAt: field.temporal.timestamptz(),
      renewalPreference: field.text().default("UNDECIDED"),
      renewalCount: field.int().default(0),
      lastRenewedAt: field.temporal.timestamptz().optional(),
      suspendedAt: field.temporal.timestamptz().optional(),
      suspensionReason: field.text().optional(),
      canceledAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      entitlementsSnapshot: field.json(),
    },
  });

  const OrganizationFeatureTrial = model("OrganizationFeatureTrial", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      trialCode: field.text(),
      vertical: field.text(),
      sourcePlanId: field.uuidNative(),
      featureSnapshot: field.json(),
      startsAt: field.temporal.timestamptz(),
      endsAt: field.temporal.timestamptz(),
      activatedByUserId: field.uuidNative(),
      revokedAt: field.temporal.timestamptz().optional(),
      revocationReason: field.text().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const AuditLog = model("AuditLog", {
    namespace: CORE_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative().optional(),
      branchId: field.uuidNative().optional(),
      userId: field.uuidNative().optional(),
      action: field.text(),
      resource: field.text(),
      resourceId: field.text().optional(),
      ipAddress: field.text().optional(),
      userAgent: field.text().optional(),
      metadata: field.json().optional(),
      createdAt: field.temporal.createdAt(),
      actorMembershipId: field.uuidNative().optional(),
    },
  });

  return {
    models: {
      User: User.relations({
        credential: rel.hasOne(UserCredential, { by: "userId" }),
        authSessions: rel.hasMany(AuthSession, { by: "userId" }),
        memberships: rel.hasMany(OrganizationMembership, { by: "userId" }),
        auditLogs: rel.hasMany(AuditLog, { by: "userId" }),
        activatedFeatureTrials: rel.hasMany(OrganizationFeatureTrial, {
          by: "activatedByUserId",
        }),
      }).sql(({ cols, constraints }) => ({
        table: "User",
        checks: [
          check({
            name: "User_name",
            expression:
              'length(btrim("firstName")) > 0 AND length(btrim("lastName")) > 0 AND length(btrim("email")) > 0',
          }),
        ],
      })),
      UserCredential: UserCredential.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
      }).sql(({ cols, constraints }) => ({
        table: "UserCredential",
        foreignKeys: [constraints.foreignKey(cols.userId, User.refs.id)],
        checks: [
          check({
            name: "credential_attempts",
            expression: '"failedAttempts" >= 0',
          }),
        ],
      })),
      AuthSession: AuthSession.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
      }).sql(({ cols, constraints }) => ({
        table: "AuthSession",
        foreignKeys: [constraints.foreignKey(cols.userId, User.refs.id)],
        checks: [
          check({
            name: "session_expiry",
            expression: '"expiresAt" > "createdAt"',
          }),
        ],
      })),
      Organization: Organization.relations({
        branches: rel.hasMany(Branch, { by: "organizationId" }),
        memberships: rel.hasMany(OrganizationMembership, {
          by: "organizationId",
        }),
        roles: rel.hasMany(Role, { by: "organizationId" }),
        planAssignments: rel.hasMany(OrganizationPlanAssignment, {
          by: "organizationId",
        }),
        featureTrials: rel.hasMany(OrganizationFeatureTrial, {
          by: "organizationId",
        }),
        auditLogs: rel.hasMany(AuditLog, { by: "organizationId" }),
      }).sql(({ cols, constraints }) => ({
        table: "Organization",
        checks: [
          check({
            name: "Organization_name",
            expression: 'length(btrim("name")) > 0',
          }),
        ],
      })),
      Branch: Branch.relations({
        organization: rel.belongsTo(Organization, {
          from: "organizationId",
          to: "id",
        }),
        membershipBranches: rel.hasMany(OrganizationMembershipBranch, {
          by: "branchId",
        }),
        auditLogs: rel.hasMany(AuditLog, { by: "branchId" }),
      }).sql(({ cols, constraints }) => ({
        table: "Branch",
        foreignKeys: [
          constraints.foreignKey(cols.organizationId, Organization.refs.id),
        ],
        indexes: [
          constraints.index([cols.organizationId, cols.code], {
            name: "branch_org_code_uidx",
            unique: true,
            where: '"deletedAt" IS NULL AND "code" IS NOT NULL',
          }),
        ],
        checks: [
          check({
            name: "Branch_name",
            expression: 'length(btrim("name")) > 0',
          }),
          check({
            name: "branch_coordinates",
            expression:
              '("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90) AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180)',
          }),
        ],
      })),
      OrganizationMembership: OrganizationMembership.relations({
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
        organization: rel.belongsTo(Organization, {
          from: "organizationId",
          to: "id",
        }),
        branchAssignments: rel.hasMany(OrganizationMembershipBranch, {
          by: "membershipId",
        }),
        roleAssignments: rel.hasMany(OrganizationMembershipRole, {
          by: "membershipId",
        }),
        auditLogs: rel.hasMany(AuditLog, { by: "actorMembershipId" }),
      }).sql(({ cols, constraints }) => ({
        table: "OrganizationMembership",
        foreignKeys: [
          constraints.foreignKey(cols.userId, User.refs.id),
          constraints.foreignKey(cols.organizationId, Organization.refs.id),
        ],
        indexes: [
          constraints.index([cols.organizationId, cols.userId], {
            name: "membership_org_user_uidx",
            unique: true,
            where: '"deletedAt" IS NULL',
          }),
        ],
      })),
      OrganizationMembershipBranch: OrganizationMembershipBranch.relations({
        membership: rel.belongsTo(OrganizationMembership, {
          from: "membershipId",
          to: "id",
        }),
        branch: rel.belongsTo(Branch, { from: "branchId", to: "id" }),
      }).sql(({ cols, constraints }) => ({
        table: "OrganizationMembershipBranch",
        foreignKeys: [
          constraints.foreignKey(
            cols.membershipId,
            OrganizationMembership.refs.id,
          ),
          constraints.foreignKey(cols.branchId, Branch.refs.id),
        ],
        indexes: [
          constraints.index([cols.membershipId, cols.branchId], {
            name: "membership_branch_uidx",
            unique: true,
            where: '"deletedAt" IS NULL',
          }),
        ],
      })),
      Role: Role.relations({
        organization: rel.belongsTo(Organization, {
          from: "organizationId",
          to: "id",
        }),
        membershipRoles: rel.hasMany(OrganizationMembershipRole, {
          by: "roleId",
        }),
        rolePermissions: rel.hasMany(RolePermission, { by: "roleId" }),
      }).sql(({ cols, constraints }) => ({
        table: "Role",
        foreignKeys: [
          constraints.foreignKey(cols.organizationId, Organization.refs.id),
        ],
        indexes: [
          constraints.index([cols.organizationId, cols.code], {
            name: "role_org_code_uidx",
            unique: true,
            where: '"organizationId" IS NOT NULL AND "deletedAt" IS NULL',
          }),
          constraints.index([cols.code], {
            name: "role_global_code_uidx",
            unique: true,
            where: '"organizationId" IS NULL AND "deletedAt" IS NULL',
          }),
        ],
        checks: [
          check({ name: "Role_name", expression: 'length(btrim("name")) > 0' }),
        ],
      })),
      Permission: Permission.relations({
        rolePermissions: rel.hasMany(RolePermission, { by: "permissionId" }),
      }).sql(({ cols, constraints }) => ({
        table: "Permission",
      })),
      RolePermission: RolePermission.relations({
        role: rel.belongsTo(Role, { from: "roleId", to: "id" }),
        permission: rel.belongsTo(Permission, {
          from: "permissionId",
          to: "id",
        }),
      }).sql(({ cols, constraints }) => ({
        table: "RolePermission",
        foreignKeys: [
          constraints.foreignKey(cols.roleId, Role.refs.id),
          constraints.foreignKey(cols.permissionId, Permission.refs.id),
        ],
        indexes: [
          constraints.index([cols.roleId, cols.permissionId], {
            name: "role_permission_pair_uidx",
            unique: true,
          }),
        ],
      })),
      OrganizationMembershipRole: OrganizationMembershipRole.relations({
        membership: rel.belongsTo(OrganizationMembership, {
          from: "membershipId",
          to: "id",
        }),
        role: rel.belongsTo(Role, { from: "roleId", to: "id" }),
      }).sql(({ cols, constraints }) => ({
        table: "OrganizationMembershipRole",
        foreignKeys: [
          constraints.foreignKey(
            cols.membershipId,
            OrganizationMembership.refs.id,
          ),
          constraints.foreignKey(cols.roleId, Role.refs.id),
        ],
        indexes: [
          constraints.index([cols.membershipId, cols.roleId], {
            name: "membership_role_uidx",
            unique: true,
            where: '"deletedAt" IS NULL',
          }),
        ],
      })),
      Plan: Plan.relations({
        organizationAssignments: rel.hasMany(OrganizationPlanAssignment, {
          by: "planId",
        }),
        featureTrials: rel.hasMany(OrganizationFeatureTrial, {
          by: "sourcePlanId",
        }),
      }).sql(({ cols, constraints }) => ({
        table: "Plan",
        checks: [
          check({ name: "Plan_name", expression: 'length(btrim("name")) > 0' }),
          check({
            name: "plan_type",
            expression: "\"type\" IN ('PUBLIC', 'CUSTOM')",
          }),
          check({ name: "plan_duration", expression: '"durationDays" > 0' }),
          check({
            name: "Plan_priceMinor_nonnegative",
            expression: '"priceMinor" IS NULL OR "priceMinor" >= 0',
          }),
          check({
            name: "Plan_currency",
            expression:
              '("priceMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
          }),
          check({
            name: "plan_entitlements_version",
            expression:
              "jsonb_typeof(\"entitlements\") = 'object' AND \"entitlements\" ? 'schemaVersion' AND jsonb_typeof(\"entitlements\"->'schemaVersion') = 'number'",
          }),
        ],
      })),
      OrganizationPlanAssignment: OrganizationPlanAssignment.relations({
        organization: rel.belongsTo(Organization, {
          from: "organizationId",
          to: "id",
        }),
        plan: rel.belongsTo(Plan, { from: "planId", to: "id" }),
      }).sql(({ cols, constraints }) => ({
        table: "OrganizationPlanAssignment",
        foreignKeys: [
          constraints.foreignKey(cols.organizationId, Organization.refs.id),
          constraints.foreignKey(cols.planId, Plan.refs.id),
        ],
        indexes: [
          constraints.index([cols.organizationId, cols.vertical], {
            name: "organization_plan_vertical_uidx",
            unique: true,
          }),
          constraints.index([cols.endsAt, cols.status], {
            name: "organization_plan_expiration_idx",
          }),
        ],
        checks: [
          check({
            name: "plan_assignment_period",
            expression: '"endsAt" > "startsAt"',
          }),
          check({
            name: "plan_assignment_status",
            expression:
              "\"status\" IN ('TRIALING', 'ACTIVE', 'SUSPENDED', 'CANCELED')",
          }),
          check({
            name: "plan_assignment_renewal",
            expression:
              "\"renewalPreference\" IN ('UNDECIDED', 'WANTS_RENEWAL', 'DOES_NOT_WANT_RENEWAL') AND \"renewalCount\" >= 0",
          }),
          check({
            name: "plan_assignment_snapshot",
            expression:
              "jsonb_typeof(\"entitlementsSnapshot\") = 'object' AND \"entitlementsSnapshot\" ? 'schemaVersion' AND jsonb_typeof(\"entitlementsSnapshot\"->'schemaVersion') = 'number'",
          }),
          check({
            name: "plan_assignment_suspension",
            expression:
              '"status" <> \'SUSPENDED\' OR ("suspendedAt" IS NOT NULL AND "suspensionReason" IS NOT NULL AND length(btrim("suspensionReason")) > 0)',
          }),
        ],
      })),
      OrganizationFeatureTrial: OrganizationFeatureTrial.relations({
        organization: rel.belongsTo(Organization, {
          from: "organizationId",
          to: "id",
        }),
        sourcePlan: rel.belongsTo(Plan, { from: "sourcePlanId", to: "id" }),
        activatedByUser: rel.belongsTo(User, {
          from: "activatedByUserId",
          to: "id",
        }),
      }).sql(({ cols, constraints }) => ({
        table: "OrganizationFeatureTrial",
        foreignKeys: [
          constraints.foreignKey(cols.organizationId, Organization.refs.id),
          constraints.foreignKey(cols.sourcePlanId, Plan.refs.id),
          constraints.foreignKey(cols.activatedByUserId, User.refs.id),
        ],
        indexes: [
          constraints.index(
            [cols.organizationId, cols.vertical, cols.trialCode],
            { name: "feature_trial_offer_uidx", unique: true },
          ),
        ],
        checks: [
          check({
            name: "trial_period",
            expression: '"endsAt" = "startsAt" + interval \'336 hours\'',
          }),
          check({
            name: "trial_snapshot",
            expression:
              "jsonb_typeof(\"featureSnapshot\") = 'object' AND \"featureSnapshot\" ? 'schemaVersion' AND jsonb_typeof(\"featureSnapshot\"->'schemaVersion') = 'number'",
          }),
          check({
            name: "trial_revocation",
            expression:
              '"revokedAt" IS NULL OR ("revokedAt" >= "startsAt" AND "revocationReason" IS NOT NULL AND length(btrim("revocationReason")) > 0)',
          }),
        ],
      })),
      AuditLog: AuditLog.relations({
        organization: rel.belongsTo(Organization, {
          from: "organizationId",
          to: "id",
        }),
        branch: rel.belongsTo(Branch, { from: "branchId", to: "id" }),
        user: rel.belongsTo(User, { from: "userId", to: "id" }),
        actorMembership: rel.belongsTo(OrganizationMembership, {
          from: "actorMembershipId",
          to: "id",
        }),
      }).sql(({ cols, constraints }) => ({
        table: "AuditLog",
        foreignKeys: [
          constraints.foreignKey(cols.organizationId, Organization.refs.id),
          constraints.foreignKey(cols.branchId, Branch.refs.id),
          constraints.foreignKey(cols.userId, User.refs.id),
          constraints.foreignKey(
            cols.actorMembershipId,
            OrganizationMembership.refs.id,
          ),
        ],
      })),
    },
  };
}

function buildDentistryModels({ field, model, rel }: ContractBuilderContext) {
  const Patient = model("Patient", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      firstName: field.text(),
      lastName: field.text(),
      phone: field.text().optional(),
      email: field.text().optional(),
      birthDate: field
        .column({ codecId: "pg/date@1", nativeType: "date" })
        .optional(),
      sex: field.text().optional(),
      documentType: field.text().optional(),
      documentNumber: field.text().optional(),
      address: field.text().optional(),
      notes: field.text().optional(),
      status: field.text().default("ACTIVE"),
      createdByMembershipId: field.uuidNative(),
      updatedByMembershipId: field.uuidNative().optional(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const PatientHealthProfile = model("PatientHealthProfile", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      patientId: field.uuidNative().unique(),
      medicalHistory: field.text().optional(),
      allergies: field.text().optional(),
      currentMedications: field.text().optional(),
      dentalHistory: field.text().optional(),
      relevantConditions: field.text().optional(),
      observations: field.text().optional(),
      createdByMembershipId: field.uuidNative(),
      updatedByMembershipId: field.uuidNative().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      rowVersion: field.int().default(1),
    },
  });

  const PatientPractitionerAssignment = model("PatientPractitionerAssignment", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      patientId: field.uuidNative(),
      practitionerMembershipId: field.uuidNative(),
      assignedAt: field.temporal.timestamptz(),
      assignedByMembershipId: field.uuidNative(),
      revokedAt: field.temporal.timestamptz().optional(),
      revokedByMembershipId: field.uuidNative().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const PatientBranchAssignment = model("PatientBranchAssignment", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      patientId: field.uuidNative(),
      branchId: field.uuidNative(),
      createdByMembershipId: field.uuidNative(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const BranchSchedulingPolicy = model("BranchSchedulingPolicy", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      branchId: field.uuidNative().unique(),
      maxConcurrentAppointments: field.int().default(1),
      updatedByMembershipId: field.uuidNative(),
      rowVersion: field.int().default(1),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const Appointment = model("Appointment", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      branchId: field.uuidNative(),
      patientId: field.uuidNative(),
      practitionerMembershipId: field.uuidNative(),
      treatmentId: field.uuidNative().optional(),
      scheduledStartAt: field.temporal.timestamptz(),
      scheduledEndAt: field.temporal.timestamptz(),
      status: field.text().default("SCHEDULED"),
      reason: field.text().optional(),
      notes: field.text().optional(),
      createdByMembershipId: field.uuidNative(),
      canceledAt: field.temporal.timestamptz().optional(),
      canceledByMembershipId: field.uuidNative().optional(),
      cancellationReason: field.text().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      updatedByMembershipId: field.uuidNative().optional(),
      rowVersion: field.int().default(1),
    },
  });

  const ClinicalEncounter = model("ClinicalEncounter", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      branchId: field.uuidNative(),
      patientId: field.uuidNative(),
      appointmentId: field.uuidNative().optional().unique(),
      treatmentId: field.uuidNative().optional(),
      practitionerMembershipId: field.uuidNative(),
      startedAt: field.temporal.timestamptz(),
      endedAt: field.temporal.timestamptz().optional(),
      chiefComplaint: field.text().optional(),
      diagnosisSummary: field.text().optional(),
      procedureSummary: field.text().optional(),
      progressNotes: field.text().optional(),
      patientInstructions: field.text().optional(),
      notes: field.text().optional(),
      createdByMembershipId: field.uuidNative(),
      updatedByMembershipId: field.uuidNative().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      examinationSummary: field.text().optional(),
      status: field.text(),
      completedAt: field.temporal.timestamptz().optional(),
      completedByMembershipId: field.uuidNative().optional(),
      historySnapshot: field.json().optional(),
      rowVersion: field.int().default(1),
      voidedAt: field.temporal.timestamptz().optional(),
      voidedByMembershipId: field.uuidNative().optional(),
      voidReason: field.text().optional(),
    },
  });

  const DentalService = model("DentalService", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      code: field.text().optional(),
      name: field.text(),
      category: field.text().optional(),
      description: field.text().optional(),
      durationMinutes: field.int().optional(),
      basePriceMinor: field.int().optional(),
      labCostMinor: field.int().optional(),
      currency: field.text().optional(),
      isActive: field.boolean().default(true),
      createdByMembershipId: field.uuidNative(),
      updatedByMembershipId: field.uuidNative().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const DentalServiceSupply = model("DentalServiceSupply", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      serviceId: field.uuidNative(),
      name: field.text(),
      quantity: field.int().default(1),
      unit: field.text().default("unidades"),
      estimatedCostMinor: field.int().optional(),
      notes: field.text().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const AppointmentService = model("AppointmentService", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      appointmentId: field.uuidNative(),
      serviceId: field.uuidNative(),
      priceMinor: field.int().optional(),
      durationMinutes: field.int().optional(),
      notes: field.text().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      currency: field.text().optional(),
    },
  });

  const Treatment = model("Treatment", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      patientId: field.uuidNative(),
      serviceId: field.uuidNative(),
      practitionerMembershipId: field.uuidNative().optional(),
      status: field.text().default("PROPOSED"),
      startedAt: field.temporal.timestamptz().optional(),
      endedAt: field.temporal.timestamptz().optional(),
      estimatedSessions: field.int().optional(),
      agreedPriceMinor: field.int().optional(),
      currency: field.text().optional(),
      diagnosisSummary: field.text().optional(),
      notes: field.text().optional(),
      createdByMembershipId: field.uuidNative(),
      updatedByMembershipId: field.uuidNative().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  const Payment = model("Payment", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      branchId: field.uuidNative(),
      patientId: field.uuidNative(),
      treatmentId: field.uuidNative().optional(),
      appointmentId: field.uuidNative().optional(),
      clinicalEncounterId: field.uuidNative().optional(),
      amountMinor: field.int(),
      currency: field.text(),
      paymentMethod: field.text(),
      status: field.text().default("COMPLETED"),
      reference: field.text().optional(),
      notes: field.text().optional(),
      paidAt: field.temporal.timestamptz(),
      receivedByMembershipId: field.uuidNative(),
      voidedAt: field.temporal.timestamptz().optional(),
      voidedByMembershipId: field.uuidNative().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      voidReason: field.text().optional(),
    },
  });

  const ClinicalFile = model("ClinicalFile", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      patientId: field.uuidNative(),
      clinicalEncounterId: field.uuidNative().optional(),
      treatmentId: field.uuidNative().optional(),
      appointmentId: field.uuidNative().optional(),
      category: field.text(),
      storageProvider: field.text(),
      bucket: field.text(),
      objectKey: field.text(),
      originalFilename: field.text(),
      mimeType: field.text(),
      sizeBytes: field.int(),
      checksumSha256: field.text().optional(),
      capturedAt: field.temporal.timestamptz().optional(),
      description: field.text().optional(),
      uploadedByMembershipId: field.uuidNative(),
      deletedAt: field.temporal.timestamptz().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
      uploadStatus: field.text(),
      uploadExpiresAt: field.temporal.timestamptz().optional(),
      uploadedAt: field.temporal.timestamptz().optional(),
      deletedByMembershipId: field.uuidNative().optional(),
    },
  });

  const Radiograph = model("Radiograph", {
    namespace: DENTISTRY_NAMESPACE,
    fields: {
      id: field.id.uuidv7Native(),
      organizationId: field.uuidNative(),
      clinicalFileId: field.uuidNative().unique(),
      radiographType: field.text(),
      toothNumber: field.text().optional(),
      region: field.text().optional(),
      laterality: field.text().optional(),
      notes: field.text().optional(),
      createdAt: field.temporal.createdAt(),
      updatedAt: field.temporal.updatedAt(),
    },
  });

  return {
    models: {
      Patient: Patient.attributes(({ fields, constraints }) => ({
        uniques: [constraints.unique([fields.organizationId, fields.id])],
      }))
        .relations({
          branchAssignments: rel.hasMany(PatientBranchAssignment, {
            by: "patientId",
          }),
          practitionerAssignments: rel.hasMany(PatientPractitionerAssignment, {
            by: "patientId",
          }),
          appointments: rel.hasMany(Appointment, { by: "patientId" }),
          clinicalEncounters: rel.hasMany(ClinicalEncounter, {
            by: "patientId",
          }),
          treatments: rel.hasMany(Treatment, { by: "patientId" }),
          payments: rel.hasMany(Payment, { by: "patientId" }),
          clinicalFiles: rel.hasMany(ClinicalFile, { by: "patientId" }),
          healthProfile: rel.hasOne(PatientHealthProfile, { by: "patientId" }),
        })
        .sql(({ cols, constraints }) => ({
          table: "Patient",
          indexes: [
            constraints.index(
              [cols.organizationId, cols.lastName, cols.firstName],
              { name: "patient_org_name_idx" },
            ),
            constraints.index([cols.organizationId, cols.phone], {
              name: "patient_org_phone_idx",
            }),
            constraints.index(
              [cols.organizationId, cols.documentType, cols.documentNumber],
              {
                name: "patient_org_document_uidx",
                unique: true,
                where:
                  '"deletedAt" IS NULL AND "documentType" IS NOT NULL AND "documentNumber" IS NOT NULL',
              },
            ),
          ],
          checks: [
            check({
              name: "patient_name",
              expression:
                'length(btrim("firstName")) > 0 AND length(btrim("lastName")) > 0',
            }),
            check({
              name: "patient_status",
              expression: "\"status\" IN ('ACTIVE', 'INACTIVE')",
            }),
            check({
              name: "patient_document",
              expression:
                '("documentType" IS NULL AND "documentNumber" IS NULL) OR ("documentType" IS NOT NULL AND "documentNumber" IS NOT NULL AND length(btrim("documentType")) > 0 AND length(btrim("documentNumber")) > 0)',
            }),
            check({
              name: "patient_sex",
              expression:
                "\"sex\" IS NULL OR \"sex\" IN ('MALE', 'FEMALE', 'OTHER')",
            }),
          ],
        })),
      PatientHealthProfile: PatientHealthProfile.attributes(
        ({ fields, constraints }) => ({
          uniques: [constraints.unique([fields.organizationId, fields.id])],
        }),
      )
        .relations({
          patient: rel.belongsTo(Patient, {
            from: ["organizationId", "patientId"],
            to: ["organizationId", "id"],
          }),
        })
        .sql(({ cols, constraints }) => ({
          table: "PatientHealthProfile",
          foreignKeys: [
            constraints.foreignKey(
              [cols.organizationId, cols.patientId],
              [Patient.refs.organizationId, Patient.refs.id],
              { onDelete: "restrict" },
            ),
          ],
          checks: [
            check({
              name: "PatientHealthProfile_version",
              expression: '"rowVersion" > 0',
            }),
          ],
        })),
      PatientPractitionerAssignment: PatientPractitionerAssignment.relations({
        patient: rel.belongsTo(Patient, {
          from: ["organizationId", "patientId"],
          to: ["organizationId", "id"],
        }),
      }).sql(({ cols, constraints }) => ({
        table: "PatientPractitionerAssignment",
        foreignKeys: [
          constraints.foreignKey(
            [cols.organizationId, cols.patientId],
            [Patient.refs.organizationId, Patient.refs.id],
            { onDelete: "restrict" },
          ),
        ],
        indexes: [
          constraints.index(
            [
              cols.organizationId,
              cols.patientId,
              cols.practitionerMembershipId,
            ],
            {
              name: "patient_practitioner_active_uidx",
              unique: true,
              where: '"revokedAt" IS NULL',
            },
          ),
          constraints.index(
            [
              cols.organizationId,
              cols.practitionerMembershipId,
              cols.revokedAt,
              cols.patientId,
            ],
            { name: "practitioner_patients_idx" },
          ),
        ],
        checks: [
          check({
            name: "patient_assignment_revocation",
            expression:
              '("revokedAt" IS NULL AND "revokedByMembershipId" IS NULL) OR ("revokedAt" IS NOT NULL AND "revokedAt" >= "assignedAt" AND "revokedByMembershipId" IS NOT NULL)',
          }),
        ],
      })),
      PatientBranchAssignment: PatientBranchAssignment.relations({
        patient: rel.belongsTo(Patient, {
          from: ["organizationId", "patientId"],
          to: ["organizationId", "id"],
        }),
      }).sql(({ cols, constraints }) => ({
        table: "PatientBranchAssignment",
        foreignKeys: [
          constraints.foreignKey(
            [cols.organizationId, cols.patientId],
            [Patient.refs.organizationId, Patient.refs.id],
            { onDelete: "restrict" },
          ),
        ],
        indexes: [
          constraints.index(
            [cols.organizationId, cols.patientId, cols.branchId],
            { name: "patient_branch_uidx", unique: true },
          ),
          constraints.index(
            [cols.organizationId, cols.branchId, cols.patientId],
            { name: "patient_branch_lookup_idx" },
          ),
        ],
      })),
      BranchSchedulingPolicy: BranchSchedulingPolicy.relations({}).sql(
        ({ cols, constraints }) => ({
          table: "BranchSchedulingPolicy",
          indexes: [
            constraints.index([cols.organizationId, cols.branchId], {
              name: "scheduling_org_branch_idx",
            }),
          ],
          checks: [
            check({
              name: "scheduling_capacity",
              expression: '"maxConcurrentAppointments" >= 1',
            }),
            check({
              name: "BranchSchedulingPolicy_version",
              expression: '"rowVersion" > 0',
            }),
          ],
        }),
      ),
      Appointment: Appointment.attributes(({ fields, constraints }) => ({
        uniques: [
          constraints.unique([fields.organizationId, fields.id]),
          constraints.unique([
            fields.organizationId,
            fields.patientId,
            fields.id,
          ]),
        ],
      }))
        .relations({
          patient: rel.belongsTo(Patient, {
            from: ["organizationId", "patientId"],
            to: ["organizationId", "id"],
          }),
          treatment: rel.belongsTo(Treatment, {
            from: ["organizationId", "patientId", "treatmentId"],
            to: ["organizationId", "patientId", "id"],
          }),
          clinicalEncounter: rel.hasOne(ClinicalEncounter, {
            by: "appointmentId",
          }),
          appointmentServices: rel.hasMany(AppointmentService, {
            by: "appointmentId",
          }),
          payments: rel.hasMany(Payment, { by: "appointmentId" }),
          clinicalFiles: rel.hasMany(ClinicalFile, { by: "appointmentId" }),
        })
        .sql(({ cols, constraints }) => ({
          table: "Appointment",
          foreignKeys: [
            constraints.foreignKey(
              [cols.organizationId, cols.patientId],
              [Patient.refs.organizationId, Patient.refs.id],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.patientId, cols.treatmentId],
              [
                Treatment.refs.organizationId,
                Treatment.refs.patientId,
                Treatment.refs.id,
              ],
              { onDelete: "restrict" },
            ),
          ],
          indexes: [
            constraints.index(
              [cols.organizationId, cols.branchId, cols.scheduledStartAt],
              { name: "appointment_branch_start_idx" },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.practitionerMembershipId,
                cols.scheduledStartAt,
              ],
              { name: "appointment_practitioner_start_idx" },
            ),
            constraints.index(
              [cols.organizationId, cols.patientId, cols.scheduledStartAt],
              { name: "appointment_patient_start_idx" },
            ),
          ],
          checks: [
            check({
              name: "Appointment_version",
              expression: '"rowVersion" > 0',
            }),
            check({
              name: "appointment_period",
              expression: '"scheduledEndAt" > "scheduledStartAt"',
            }),
            check({
              name: "appointment_status",
              expression:
                "\"status\" IN ('SCHEDULED', 'CONFIRMED', 'WAITING_ROOM', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELED')",
            }),
            check({
              name: "appointment_cancellation",
              expression:
                '"status" <> \'CANCELED\' OR ("canceledAt" IS NOT NULL AND "canceledByMembershipId" IS NOT NULL AND "cancellationReason" IS NOT NULL AND length(btrim("cancellationReason")) > 0)',
            }),
          ],
        })),
      ClinicalEncounter: ClinicalEncounter.attributes(
        ({ fields, constraints }) => ({
          uniques: [
            constraints.unique([fields.organizationId, fields.id]),
            constraints.unique([
              fields.organizationId,
              fields.patientId,
              fields.id,
            ]),
          ],
        }),
      )
        .relations({
          patient: rel.belongsTo(Patient, {
            from: ["organizationId", "patientId"],
            to: ["organizationId", "id"],
          }),
          treatment: rel.belongsTo(Treatment, {
            from: ["organizationId", "patientId", "treatmentId"],
            to: ["organizationId", "patientId", "id"],
          }),
          appointment: rel.belongsTo(Appointment, {
            from: ["organizationId", "patientId", "appointmentId"],
            to: ["organizationId", "patientId", "id"],
          }),
          payments: rel.hasMany(Payment, { by: "clinicalEncounterId" }),
          clinicalFiles: rel.hasMany(ClinicalFile, {
            by: "clinicalEncounterId",
          }),
        })
        .sql(({ cols, constraints }) => ({
          table: "ClinicalEncounter",
          foreignKeys: [
            constraints.foreignKey(
              [cols.organizationId, cols.patientId],
              [Patient.refs.organizationId, Patient.refs.id],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.patientId, cols.treatmentId],
              [
                Treatment.refs.organizationId,
                Treatment.refs.patientId,
                Treatment.refs.id,
              ],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.patientId, cols.appointmentId],
              [
                Appointment.refs.organizationId,
                Appointment.refs.patientId,
                Appointment.refs.id,
              ],
              { onDelete: "restrict" },
            ),
          ],
          indexes: [
            constraints.index(
              [cols.organizationId, cols.patientId, cols.startedAt],
              { name: "encounter_patient_start_idx" },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.practitionerMembershipId,
                cols.startedAt,
              ],
              { name: "encounter_practitioner_start_idx" },
            ),
          ],
          checks: [
            check({
              name: "ClinicalEncounter_version",
              expression: '"rowVersion" > 0',
            }),
            check({
              name: "encounter_status",
              expression:
                "\"status\" IN ('IN_PROGRESS', 'COMPLETED', 'VOIDED')",
            }),
            check({
              name: "encounter_period",
              expression: '"endedAt" IS NULL OR "endedAt" >= "startedAt"',
            }),
            check({
              name: "encounter_completion",
              expression:
                '"status" <> \'COMPLETED\' OR ("endedAt" IS NOT NULL AND "completedAt" IS NOT NULL AND "completedByMembershipId" IS NOT NULL AND "procedureSummary" IS NOT NULL AND length(btrim("procedureSummary")) > 0)',
            }),
            check({
              name: "encounter_revocation",
              expression:
                '("status" <> \'VOIDED\' AND "voidedAt" IS NULL AND "voidedByMembershipId" IS NULL AND "voidReason" IS NULL) OR ("status" = \'VOIDED\' AND "voidedAt" IS NOT NULL AND "voidedByMembershipId" IS NOT NULL AND "voidReason" IS NOT NULL AND length(btrim("voidReason")) > 0)',
            }),
            check({
              name: "encounter_snapshot",
              expression:
                "\"historySnapshot\" IS NULL OR (jsonb_typeof(\"historySnapshot\") = 'object' AND \"historySnapshot\" ? 'schemaVersion' AND jsonb_typeof(\"historySnapshot\"->'schemaVersion') = 'number')",
            }),
          ],
        })),
      DentalService: DentalService.attributes(({ fields, constraints }) => ({
        uniques: [constraints.unique([fields.organizationId, fields.id])],
      }))
        .relations({
          supplies: rel.hasMany(DentalServiceSupply, { by: "serviceId" }),
          treatments: rel.hasMany(Treatment, { by: "serviceId" }),
          appointmentServices: rel.hasMany(AppointmentService, {
            by: "serviceId",
          }),
        })
        .sql(({ cols, constraints }) => ({
          table: "DentalService",
          indexes: [
            constraints.index([cols.organizationId, cols.isActive], {
              name: "service_org_active_idx",
            }),
            constraints.index([cols.organizationId, cols.category], {
              name: "service_org_category_idx",
            }),
            constraints.index([cols.organizationId, cols.code], {
              name: "service_org_code_uidx",
              unique: true,
            }),
          ],
          checks: [
            check({
              name: "DentalService_durationMinutes_positive",
              expression: '"durationMinutes" IS NULL OR "durationMinutes" > 0',
            }),
            check({
              name: "DentalService_basePriceMinor_nonnegative",
              expression: '"basePriceMinor" IS NULL OR "basePriceMinor" >= 0',
            }),
            check({
              name: "DentalService_labCostMinor_nonnegative",
              expression: '"labCostMinor" IS NULL OR "labCostMinor" >= 0',
            }),
            check({
              name: "DentalService_currency",
              expression:
                '("basePriceMinor" IS NULL AND "labCostMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
            }),
            check({
              name: "service_name",
              expression: 'length(btrim("name")) > 0',
            }),
          ],
        })),
      DentalServiceSupply: DentalServiceSupply.relations({
        service: rel.belongsTo(DentalService, {
          from: ["organizationId", "serviceId"],
          to: ["organizationId", "id"],
        }),
      }).sql(({ cols, constraints }) => ({
        table: "DentalServiceSupply",
        foreignKeys: [
          constraints.foreignKey(
            [cols.organizationId, cols.serviceId],
            [DentalService.refs.organizationId, DentalService.refs.id],
            { onDelete: "restrict" },
          ),
        ],
        indexes: [
          constraints.index([cols.organizationId, cols.serviceId], {
            name: "supply_org_service_idx",
          }),
        ],
        checks: [
          check({ name: "supply_quantity", expression: '"quantity" > 0' }),
          check({
            name: "DentalServiceSupply_estimatedCostMinor_nonnegative",
            expression:
              '"estimatedCostMinor" IS NULL OR "estimatedCostMinor" >= 0',
          }),
        ],
      })),
      AppointmentService: AppointmentService.relations({
        service: rel.belongsTo(DentalService, {
          from: ["organizationId", "serviceId"],
          to: ["organizationId", "id"],
        }),
        appointment: rel.belongsTo(Appointment, {
          from: ["organizationId", "appointmentId"],
          to: ["organizationId", "id"],
        }),
      }).sql(({ cols, constraints }) => ({
        table: "AppointmentService",
        foreignKeys: [
          constraints.foreignKey(
            [cols.organizationId, cols.serviceId],
            [DentalService.refs.organizationId, DentalService.refs.id],
            { onDelete: "restrict" },
          ),
          constraints.foreignKey(
            [cols.organizationId, cols.appointmentId],
            [Appointment.refs.organizationId, Appointment.refs.id],
            { onDelete: "restrict" },
          ),
        ],
        indexes: [
          constraints.index([cols.appointmentId, cols.serviceId], {
            name: "appointment_service_uidx",
            unique: true,
          }),
        ],
        checks: [
          check({
            name: "AppointmentService_priceMinor_nonnegative",
            expression: '"priceMinor" IS NULL OR "priceMinor" >= 0',
          }),
          check({
            name: "AppointmentService_durationMinutes_positive",
            expression: '"durationMinutes" IS NULL OR "durationMinutes" > 0',
          }),
          check({
            name: "AppointmentService_currency",
            expression:
              '("priceMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
          }),
        ],
      })),
      Treatment: Treatment.attributes(({ fields, constraints }) => ({
        uniques: [
          constraints.unique([fields.organizationId, fields.id]),
          constraints.unique([
            fields.organizationId,
            fields.patientId,
            fields.id,
          ]),
        ],
      }))
        .relations({
          patient: rel.belongsTo(Patient, {
            from: ["organizationId", "patientId"],
            to: ["organizationId", "id"],
          }),
          service: rel.belongsTo(DentalService, {
            from: ["organizationId", "serviceId"],
            to: ["organizationId", "id"],
          }),
          appointments: rel.hasMany(Appointment, { by: "treatmentId" }),
          clinicalEncounters: rel.hasMany(ClinicalEncounter, {
            by: "treatmentId",
          }),
          payments: rel.hasMany(Payment, { by: "treatmentId" }),
          clinicalFiles: rel.hasMany(ClinicalFile, { by: "treatmentId" }),
        })
        .sql(({ cols, constraints }) => ({
          table: "Treatment",
          foreignKeys: [
            constraints.foreignKey(
              [cols.organizationId, cols.patientId],
              [Patient.refs.organizationId, Patient.refs.id],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.serviceId],
              [DentalService.refs.organizationId, DentalService.refs.id],
              { onDelete: "restrict" },
            ),
          ],
          indexes: [
            constraints.index([cols.organizationId, cols.patientId], {
              name: "treatment_patient_idx",
            }),
            constraints.index([cols.organizationId, cols.status], {
              name: "treatment_status_idx",
            }),
          ],
          checks: [
            check({
              name: "treatment_status",
              expression:
                "\"status\" IN ('PROPOSED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'DECLINED', 'CANCELED')",
            }),
            check({
              name: "treatment_period",
              expression:
                '"endedAt" IS NULL OR ("startedAt" IS NOT NULL AND "endedAt" >= "startedAt")',
            }),
            check({
              name: "Treatment_estimatedSessions_positive",
              expression:
                '"estimatedSessions" IS NULL OR "estimatedSessions" > 0',
            }),
            check({
              name: "Treatment_agreedPriceMinor_nonnegative",
              expression:
                '"agreedPriceMinor" IS NULL OR "agreedPriceMinor" >= 0',
            }),
            check({
              name: "Treatment_currency",
              expression:
                '("agreedPriceMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
            }),
          ],
        })),
      Payment: Payment.relations({
        patient: rel.belongsTo(Patient, {
          from: ["organizationId", "patientId"],
          to: ["organizationId", "id"],
        }),
        treatment: rel.belongsTo(Treatment, {
          from: ["organizationId", "patientId", "treatmentId"],
          to: ["organizationId", "patientId", "id"],
        }),
        appointment: rel.belongsTo(Appointment, {
          from: ["organizationId", "patientId", "appointmentId"],
          to: ["organizationId", "patientId", "id"],
        }),
        clinicalEncounter: rel.belongsTo(ClinicalEncounter, {
          from: ["organizationId", "patientId", "clinicalEncounterId"],
          to: ["organizationId", "patientId", "id"],
        }),
      }).sql(({ cols, constraints }) => ({
        table: "Payment",
        foreignKeys: [
          constraints.foreignKey(
            [cols.organizationId, cols.patientId],
            [Patient.refs.organizationId, Patient.refs.id],
            { onDelete: "restrict" },
          ),
          constraints.foreignKey(
            [cols.organizationId, cols.patientId, cols.treatmentId],
            [
              Treatment.refs.organizationId,
              Treatment.refs.patientId,
              Treatment.refs.id,
            ],
            { onDelete: "restrict" },
          ),
          constraints.foreignKey(
            [cols.organizationId, cols.patientId, cols.appointmentId],
            [
              Appointment.refs.organizationId,
              Appointment.refs.patientId,
              Appointment.refs.id,
            ],
            { onDelete: "restrict" },
          ),
          constraints.foreignKey(
            [cols.organizationId, cols.patientId, cols.clinicalEncounterId],
            [
              ClinicalEncounter.refs.organizationId,
              ClinicalEncounter.refs.patientId,
              ClinicalEncounter.refs.id,
            ],
            { onDelete: "restrict" },
          ),
        ],
        indexes: [
          constraints.index([cols.organizationId, cols.paidAt], {
            name: "payment_org_paid_idx",
          }),
          constraints.index([cols.organizationId, cols.branchId, cols.paidAt], {
            name: "payment_branch_paid_idx",
          }),
          constraints.index(
            [cols.organizationId, cols.patientId, cols.paidAt],
            { name: "payment_patient_paid_idx" },
          ),
        ],
        checks: [
          check({ name: "payment_amount", expression: '"amountMinor" > 0' }),
          check({
            name: "payment_status",
            expression: "\"status\" IN ('COMPLETED', 'VOIDED')",
          }),
          check({
            name: "payment_void",
            expression:
              '"status" <> \'VOIDED\' OR ("voidedAt" IS NOT NULL AND "voidedByMembershipId" IS NOT NULL AND "voidReason" IS NOT NULL AND length(btrim("voidReason")) > 0)',
          }),
          check({
            name: "payment_currency",
            expression: "\"currency\" ~ '^[A-Z]{3}$'",
          }),
        ],
      })),
      ClinicalFile: ClinicalFile.attributes(({ fields, constraints }) => ({
        uniques: [constraints.unique([fields.organizationId, fields.id])],
      }))
        .relations({
          patient: rel.belongsTo(Patient, {
            from: ["organizationId", "patientId"],
            to: ["organizationId", "id"],
          }),
          treatment: rel.belongsTo(Treatment, {
            from: ["organizationId", "patientId", "treatmentId"],
            to: ["organizationId", "patientId", "id"],
          }),
          appointment: rel.belongsTo(Appointment, {
            from: ["organizationId", "patientId", "appointmentId"],
            to: ["organizationId", "patientId", "id"],
          }),
          clinicalEncounter: rel.belongsTo(ClinicalEncounter, {
            from: ["organizationId", "patientId", "clinicalEncounterId"],
            to: ["organizationId", "patientId", "id"],
          }),
          radiograph: rel.hasOne(Radiograph, { by: "clinicalFileId" }),
        })
        .sql(({ cols, constraints }) => ({
          table: "ClinicalFile",
          foreignKeys: [
            constraints.foreignKey(
              [cols.organizationId, cols.patientId],
              [Patient.refs.organizationId, Patient.refs.id],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.patientId, cols.treatmentId],
              [
                Treatment.refs.organizationId,
                Treatment.refs.patientId,
                Treatment.refs.id,
              ],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.patientId, cols.appointmentId],
              [
                Appointment.refs.organizationId,
                Appointment.refs.patientId,
                Appointment.refs.id,
              ],
              { onDelete: "restrict" },
            ),
            constraints.foreignKey(
              [cols.organizationId, cols.patientId, cols.clinicalEncounterId],
              [
                ClinicalEncounter.refs.organizationId,
                ClinicalEncounter.refs.patientId,
                ClinicalEncounter.refs.id,
              ],
              { onDelete: "restrict" },
            ),
          ],
          indexes: [
            constraints.index(
              [cols.organizationId, cols.patientId, cols.capturedAt],
              { name: "file_patient_capture_idx" },
            ),
            constraints.index([cols.organizationId, cols.clinicalEncounterId], {
              name: "file_encounter_idx",
            }),
            constraints.index(
              [cols.storageProvider, cols.bucket, cols.objectKey],
              { name: "file_storage_object_uidx", unique: true },
            ),
          ],
          checks: [
            check({
              name: "file_category",
              expression:
                "\"category\" IN ('RADIOGRAPH', 'PHOTO', 'DOCUMENT', 'OTHER')",
            }),
            check({ name: "file_size", expression: '"sizeBytes" > 0' }),
            check({
              name: "file_upload_status",
              expression: "\"uploadStatus\" IN ('PENDING', 'READY', 'FAILED')",
            }),
            check({
              name: "file_upload_pending",
              expression:
                '"uploadStatus" <> \'PENDING\' OR "uploadExpiresAt" IS NOT NULL',
            }),
            check({
              name: "file_upload_ready",
              expression:
                '"uploadStatus" <> \'READY\' OR "uploadedAt" IS NOT NULL',
            }),
          ],
        })),
      Radiograph: Radiograph.relations({
        clinicalFile: rel.belongsTo(ClinicalFile, {
          from: ["organizationId", "clinicalFileId"],
          to: ["organizationId", "id"],
        }),
      }).sql(({ cols, constraints }) => ({
        table: "Radiograph",
        foreignKeys: [
          constraints.foreignKey(
            [cols.organizationId, cols.clinicalFileId],
            [ClinicalFile.refs.organizationId, ClinicalFile.refs.id],
            { onDelete: "restrict" },
          ),
        ],
        checks: [
          check({
            name: "radiograph_type",
            expression:
              "\"radiographType\" IN ('PANORAMIC', 'PERIAPICAL', 'BITEWING', 'OCCLUSAL', 'CEPHALOMETRIC', 'CBCT', 'OTHER')",
          }),
          check({
            name: "radiograph_laterality",
            expression:
              "\"laterality\" IS NULL OR \"laterality\" IN ('LEFT', 'RIGHT', 'BILATERAL')",
          }),
        ],
      })),
    },
  };
}

export const contract = defineContract(
  { namespaces: [CORE_NAMESPACE, DENTISTRY_NAMESPACE] },
  (ctx) => ({
    models: {
      ...buildCoreModels(ctx).models,
      ...buildDentistryModels(ctx).models,
    },
  }),
);
