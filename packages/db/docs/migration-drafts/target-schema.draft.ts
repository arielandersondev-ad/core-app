// NON-EXECUTABLE PLANNER DRAFT. Not part of the app migration graph.
// Do not move into migrations/app until data preservation and backend adaptation are complete.
#!/usr/bin/env -S node
import type { Contract as Start } from '../../migrations/snapshots/826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945/contract';
import startContract from '../../migrations/snapshots/826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945/contract.json' with { type: 'json' };
import type { Contract as End } from '../../migrations/snapshots/a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b/contract';
import endContract from '../../migrations/snapshots/a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'core', table: 'Branch', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'Organization', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'OrganizationMembership', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'OrganizationMembershipBranch', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'OrganizationMembershipRole', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'Plan', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'Role', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'User', column: 'deleted' }),
      this.dropColumn({ schema: 'core', table: 'UserCredential', column: 'deleted' }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'Appointment_patientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'Appointment_serviceId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'Appointment_treatmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'Appointment_patientId_idx_e5f07e88',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'Appointment_serviceId_idx_b5d9acbf',
      }),
      this.dropColumn({ schema: 'dentistry', table: 'Appointment', column: 'serviceId' }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'Appointment_treatmentId_idx_18e96195',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'appt_org_start_idx_5a65ff85',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'appt_patient_start_idx_f2accb68',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'AppointmentService',
        constraint: 'AppointmentService_appointmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'AppointmentService',
        constraint: 'AppointmentService_serviceId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'AppointmentService',
        index: 'AppointmentService_appointmentId_idx_682a8b58',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'AppointmentService',
        index: 'AppointmentService_serviceId_idx_b5d9acbf',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'ClinicalEncounter_appointmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'ClinicalEncounter_patientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'ClinicalEncounter_treatmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        index: 'ClinicalEncounter_patientId_idx_e5f07e88',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        index: 'ClinicalEncounter_treatmentId_idx_18e96195',
      }),
      this.dropColumn({ schema: 'dentistry', table: 'ClinicalFile', column: 'deleted' }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'ClinicalFile_appointmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'ClinicalFile_clinicalEncounterId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'ClinicalFile_patientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'ClinicalFile_treatmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'ClinicalFile_appointmentId_idx_682a8b58',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'ClinicalFile_patientId_idx_e5f07e88',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'ClinicalFile_treatmentId_idx_18e96195',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'cf_bucket_object_uidx_fe606a9b',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'cf_encounter_idx_2139e386',
      }),
      this.dropColumn({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        column: 'inventoryItemId',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        constraint: 'DentalServiceSupply_serviceId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        index: 'DentalServiceSupply_serviceId_idx_b5d9acbf',
      }),
      this.dropColumn({ schema: 'dentistry', table: 'Patient', column: 'deleted' }),
      this.dropIndex({ schema: 'dentistry', table: 'Patient', index: 'pat_org_idx_2e17ef41' }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        constraint: 'PatientHealthProfile_patientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        index: 'ch_org_idx_2e17ef41',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'Payment_appointmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'Payment_clinicalEncounterId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'Payment_patientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'Payment_treatmentId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_appointmentId_idx_682a8b58',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_clinicalEncounterId_idx_2139e386',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_patientId_idx_e5f07e88',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_treatmentId_idx_18e96195',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'pay_patient_paid_idx_c631bb8a',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Radiograph',
        constraint: 'Radiograph_clinicalFileId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Radiograph',
        index: 'rad_org_taken_idx_7edfcbb7',
      }),
      this.dropColumn({ schema: 'dentistry', table: 'Radiograph', column: 'takenAt' }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_patientId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_serviceId_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Treatment',
        index: 'Treatment_patientId_idx_e5f07e88',
      }),
      this.dropIndex({
        schema: 'dentistry',
        table: 'Treatment',
        index: 'Treatment_serviceId_idx_b5d9acbf',
      }),
      this.createTable({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        columns: [
          col('activatedByUserId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('endsAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('featureSnapshot', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('revocationReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('sourcePlanId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('startsAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('trialCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('vertical', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'trial_period_952b1d74',
            '"endsAt" = "startsAt" + interval \'336 hours\'',
          ),
          checkExpression(
            'trial_revocation_49529263',
            '"revokedAt" IS NULL OR ("revokedAt" >= "startsAt" AND "revocationReason" IS NOT NULL AND length(btrim("revocationReason")) > 0)',
          ),
          checkExpression(
            'trial_snapshot_83c20a96',
            "jsonb_typeof(\"featureSnapshot\") = 'object' AND \"featureSnapshot\" ? 'schemaVersion' AND jsonb_typeof(\"featureSnapshot\"->'schemaVersion') = 'number'",
          ),
        ],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'BranchSchedulingPolicy',
        columns: [
          col('branchId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('maxConcurrentAppointments', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('rowVersion', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('BranchSchedulingPolicy_version_dd7c92f3', '"rowVersion" > 0'),
          checkExpression('scheduling_capacity_b088e67e', '"maxConcurrentAppointments" >= 1'),
        ],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'PatientBranchAssignment',
        columns: [
          col('branchId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('patientId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'PatientPractitionerAssignment',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('assignedByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('patientId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('practitionerMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('revokedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'patient_assignment_revocation_4a11a603',
            '("revokedAt" IS NULL AND "revokedByMembershipId" IS NULL) OR ("revokedAt" IS NOT NULL AND "revokedAt" >= "assignedAt" AND "revokedByMembershipId" IS NOT NULL)',
          ),
        ],
      }),
      this.addColumn({
        schema: 'core',
        table: 'AuditLog',
        column: col('actorMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Appointment',
        column: col('rowVersion', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Appointment',
        column: col('updatedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'AppointmentService',
        column: col('currency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('completedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('examinationSummary', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('historySnapshot', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('rowVersion', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('voidReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('voidedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('voidedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: col('deletedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: col('uploadExpiresAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz@1' },
        }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: col('uploadedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        column: col('rowVersion', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Payment',
        column: col('voidReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: col('entitlementsSnapshot', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-OrganizationPlanAssignment-entitlementsSnapshot', {
        check: () => placeholder('backfill-OrganizationPlanAssignment-entitlementsSnapshot:check'),
        run: () => placeholder('backfill-OrganizationPlanAssignment-entitlementsSnapshot:run'),
      }),
      this.setNotNull({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'entitlementsSnapshot',
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: col('status', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-ClinicalEncounter-status', {
        check: () => placeholder('backfill-ClinicalEncounter-status:check'),
        run: () => placeholder('backfill-ClinicalEncounter-status:run'),
      }),
      this.setNotNull({ schema: 'dentistry', table: 'ClinicalEncounter', column: 'status' }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: col('uploadStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-ClinicalFile-uploadStatus', {
        check: () => placeholder('backfill-ClinicalFile-uploadStatus:check'),
        run: () => placeholder('backfill-ClinicalFile-uploadStatus:run'),
      }),
      this.setNotNull({ schema: 'dentistry', table: 'ClinicalFile', column: 'uploadStatus' }),
      this.dataTransform(endContract, 'typechange-AuditLog-branchId', {
        check: () => placeholder('typechange-AuditLog-branchId:check'),
        run: () => placeholder('typechange-AuditLog-branchId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuditLog',
        column: 'branchId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuditLog-id', {
        check: () => placeholder('typechange-AuditLog-id:check'),
        run: () => placeholder('typechange-AuditLog-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuditLog',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuditLog-organizationId', {
        check: () => placeholder('typechange-AuditLog-organizationId:check'),
        run: () => placeholder('typechange-AuditLog-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuditLog',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuditLog-userId', {
        check: () => placeholder('typechange-AuditLog-userId:check'),
        run: () => placeholder('typechange-AuditLog-userId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuditLog',
        column: 'userId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuthSession-expiresAt', {
        check: () => placeholder('typechange-AuthSession-expiresAt:check'),
        run: () => placeholder('typechange-AuthSession-expiresAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuthSession',
        column: 'expiresAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuthSession-id', {
        check: () => placeholder('typechange-AuthSession-id:check'),
        run: () => placeholder('typechange-AuthSession-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuthSession',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuthSession-lastUsedAt', {
        check: () => placeholder('typechange-AuthSession-lastUsedAt:check'),
        run: () => placeholder('typechange-AuthSession-lastUsedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuthSession',
        column: 'lastUsedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuthSession-revokedAt', {
        check: () => placeholder('typechange-AuthSession-revokedAt:check'),
        run: () => placeholder('typechange-AuthSession-revokedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuthSession',
        column: 'revokedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-AuthSession-userId', {
        check: () => placeholder('typechange-AuthSession-userId:check'),
        run: () => placeholder('typechange-AuthSession-userId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'AuthSession',
        column: 'userId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Branch-deletedAt', {
        check: () => placeholder('typechange-Branch-deletedAt:check'),
        run: () => placeholder('typechange-Branch-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Branch',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Branch-id', {
        check: () => placeholder('typechange-Branch-id:check'),
        run: () => placeholder('typechange-Branch-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Branch',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Branch-organizationId', {
        check: () => placeholder('typechange-Branch-organizationId:check'),
        run: () => placeholder('typechange-Branch-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Branch',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Organization-deletedAt', {
        check: () => placeholder('typechange-Organization-deletedAt:check'),
        run: () => placeholder('typechange-Organization-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Organization',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Organization-id', {
        check: () => placeholder('typechange-Organization-id:check'),
        run: () => placeholder('typechange-Organization-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Organization',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembership-deletedAt', {
        check: () => placeholder('typechange-OrganizationMembership-deletedAt:check'),
        run: () => placeholder('typechange-OrganizationMembership-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembership',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembership-id', {
        check: () => placeholder('typechange-OrganizationMembership-id:check'),
        run: () => placeholder('typechange-OrganizationMembership-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembership',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembership-joinedAt', {
        check: () => placeholder('typechange-OrganizationMembership-joinedAt:check'),
        run: () => placeholder('typechange-OrganizationMembership-joinedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembership',
        column: 'joinedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembership-organizationId', {
        check: () => placeholder('typechange-OrganizationMembership-organizationId:check'),
        run: () => placeholder('typechange-OrganizationMembership-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembership',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembership-userId', {
        check: () => placeholder('typechange-OrganizationMembership-userId:check'),
        run: () => placeholder('typechange-OrganizationMembership-userId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembership',
        column: 'userId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipBranch-branchId', {
        check: () => placeholder('typechange-OrganizationMembershipBranch-branchId:check'),
        run: () => placeholder('typechange-OrganizationMembershipBranch-branchId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipBranch',
        column: 'branchId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipBranch-deletedAt', {
        check: () => placeholder('typechange-OrganizationMembershipBranch-deletedAt:check'),
        run: () => placeholder('typechange-OrganizationMembershipBranch-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipBranch',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipBranch-id', {
        check: () => placeholder('typechange-OrganizationMembershipBranch-id:check'),
        run: () => placeholder('typechange-OrganizationMembershipBranch-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipBranch',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipBranch-membershipId', {
        check: () => placeholder('typechange-OrganizationMembershipBranch-membershipId:check'),
        run: () => placeholder('typechange-OrganizationMembershipBranch-membershipId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipBranch',
        column: 'membershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipRole-deletedAt', {
        check: () => placeholder('typechange-OrganizationMembershipRole-deletedAt:check'),
        run: () => placeholder('typechange-OrganizationMembershipRole-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipRole',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipRole-id', {
        check: () => placeholder('typechange-OrganizationMembershipRole-id:check'),
        run: () => placeholder('typechange-OrganizationMembershipRole-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipRole',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipRole-membershipId', {
        check: () => placeholder('typechange-OrganizationMembershipRole-membershipId:check'),
        run: () => placeholder('typechange-OrganizationMembershipRole-membershipId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipRole',
        column: 'membershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationMembershipRole-roleId', {
        check: () => placeholder('typechange-OrganizationMembershipRole-roleId:check'),
        run: () => placeholder('typechange-OrganizationMembershipRole-roleId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationMembershipRole',
        column: 'roleId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-canceledAt', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-canceledAt:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-canceledAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'canceledAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-endsAt', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-endsAt:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-endsAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'endsAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-id', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-id:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-lastRenewedAt', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-lastRenewedAt:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-lastRenewedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'lastRenewedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-organizationId', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-organizationId:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-planId', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-planId:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-planId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'planId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-startsAt', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-startsAt:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-startsAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'startsAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-OrganizationPlanAssignment-suspendedAt', {
        check: () => placeholder('typechange-OrganizationPlanAssignment-suspendedAt:check'),
        run: () => placeholder('typechange-OrganizationPlanAssignment-suspendedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        column: 'suspendedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Permission-id', {
        check: () => placeholder('typechange-Permission-id:check'),
        run: () => placeholder('typechange-Permission-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Permission',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Plan-deletedAt', {
        check: () => placeholder('typechange-Plan-deletedAt:check'),
        run: () => placeholder('typechange-Plan-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Plan',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Plan-id', {
        check: () => placeholder('typechange-Plan-id:check'),
        run: () => placeholder('typechange-Plan-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Plan',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Role-deletedAt', {
        check: () => placeholder('typechange-Role-deletedAt:check'),
        run: () => placeholder('typechange-Role-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Role',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Role-id', {
        check: () => placeholder('typechange-Role-id:check'),
        run: () => placeholder('typechange-Role-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Role',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Role-organizationId', {
        check: () => placeholder('typechange-Role-organizationId:check'),
        run: () => placeholder('typechange-Role-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'Role',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-RolePermission-id', {
        check: () => placeholder('typechange-RolePermission-id:check'),
        run: () => placeholder('typechange-RolePermission-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'RolePermission',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-RolePermission-permissionId', {
        check: () => placeholder('typechange-RolePermission-permissionId:check'),
        run: () => placeholder('typechange-RolePermission-permissionId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'RolePermission',
        column: 'permissionId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-RolePermission-roleId', {
        check: () => placeholder('typechange-RolePermission-roleId:check'),
        run: () => placeholder('typechange-RolePermission-roleId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'RolePermission',
        column: 'roleId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-User-deletedAt', {
        check: () => placeholder('typechange-User-deletedAt:check'),
        run: () => placeholder('typechange-User-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'User',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-User-emailVerifiedAt', {
        check: () => placeholder('typechange-User-emailVerifiedAt:check'),
        run: () => placeholder('typechange-User-emailVerifiedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'User',
        column: 'emailVerifiedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-User-id', {
        check: () => placeholder('typechange-User-id:check'),
        run: () => placeholder('typechange-User-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'User',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-UserCredential-deletedAt', {
        check: () => placeholder('typechange-UserCredential-deletedAt:check'),
        run: () => placeholder('typechange-UserCredential-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'UserCredential',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-UserCredential-id', {
        check: () => placeholder('typechange-UserCredential-id:check'),
        run: () => placeholder('typechange-UserCredential-id:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'UserCredential',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-UserCredential-lockedUntil', {
        check: () => placeholder('typechange-UserCredential-lockedUntil:check'),
        run: () => placeholder('typechange-UserCredential-lockedUntil:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'UserCredential',
        column: 'lockedUntil',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-UserCredential-passwordChangedAt', {
        check: () => placeholder('typechange-UserCredential-passwordChangedAt:check'),
        run: () => placeholder('typechange-UserCredential-passwordChangedAt:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'UserCredential',
        column: 'passwordChangedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-UserCredential-userId', {
        check: () => placeholder('typechange-UserCredential-userId:check'),
        run: () => placeholder('typechange-UserCredential-userId:run'),
      }),
      this.alterColumnType({
        schema: 'core',
        table: 'UserCredential',
        column: 'userId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-branchId', {
        check: () => placeholder('typechange-Appointment-branchId:check'),
        run: () => placeholder('typechange-Appointment-branchId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'branchId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-canceledAt', {
        check: () => placeholder('typechange-Appointment-canceledAt:check'),
        run: () => placeholder('typechange-Appointment-canceledAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'canceledAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-canceledByMembershipId', {
        check: () => placeholder('typechange-Appointment-canceledByMembershipId:check'),
        run: () => placeholder('typechange-Appointment-canceledByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'canceledByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-createdByMembershipId', {
        check: () => placeholder('typechange-Appointment-createdByMembershipId:check'),
        run: () => placeholder('typechange-Appointment-createdByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'createdByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-id', {
        check: () => placeholder('typechange-Appointment-id:check'),
        run: () => placeholder('typechange-Appointment-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-organizationId', {
        check: () => placeholder('typechange-Appointment-organizationId:check'),
        run: () => placeholder('typechange-Appointment-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-patientId', {
        check: () => placeholder('typechange-Appointment-patientId:check'),
        run: () => placeholder('typechange-Appointment-patientId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'patientId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-practitionerMembershipId', {
        check: () => placeholder('typechange-Appointment-practitionerMembershipId:check'),
        run: () => placeholder('typechange-Appointment-practitionerMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'practitionerMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-scheduledEndAt', {
        check: () => placeholder('typechange-Appointment-scheduledEndAt:check'),
        run: () => placeholder('typechange-Appointment-scheduledEndAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'scheduledEndAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-scheduledStartAt', {
        check: () => placeholder('typechange-Appointment-scheduledStartAt:check'),
        run: () => placeholder('typechange-Appointment-scheduledStartAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'scheduledStartAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Appointment-treatmentId', {
        check: () => placeholder('typechange-Appointment-treatmentId:check'),
        run: () => placeholder('typechange-Appointment-treatmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'treatmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AppointmentService-appointmentId', {
        check: () => placeholder('typechange-AppointmentService-appointmentId:check'),
        run: () => placeholder('typechange-AppointmentService-appointmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'AppointmentService',
        column: 'appointmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AppointmentService-id', {
        check: () => placeholder('typechange-AppointmentService-id:check'),
        run: () => placeholder('typechange-AppointmentService-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'AppointmentService',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AppointmentService-organizationId', {
        check: () => placeholder('typechange-AppointmentService-organizationId:check'),
        run: () => placeholder('typechange-AppointmentService-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'AppointmentService',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-AppointmentService-serviceId', {
        check: () => placeholder('typechange-AppointmentService-serviceId:check'),
        run: () => placeholder('typechange-AppointmentService-serviceId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'AppointmentService',
        column: 'serviceId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-appointmentId', {
        check: () => placeholder('typechange-ClinicalEncounter-appointmentId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-appointmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'appointmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-branchId', {
        check: () => placeholder('typechange-ClinicalEncounter-branchId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-branchId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'branchId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-createdByMembershipId', {
        check: () => placeholder('typechange-ClinicalEncounter-createdByMembershipId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-createdByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'createdByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-endedAt', {
        check: () => placeholder('typechange-ClinicalEncounter-endedAt:check'),
        run: () => placeholder('typechange-ClinicalEncounter-endedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'endedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-id', {
        check: () => placeholder('typechange-ClinicalEncounter-id:check'),
        run: () => placeholder('typechange-ClinicalEncounter-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-organizationId', {
        check: () => placeholder('typechange-ClinicalEncounter-organizationId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-patientId', {
        check: () => placeholder('typechange-ClinicalEncounter-patientId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-patientId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'patientId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-practitionerMembershipId', {
        check: () => placeholder('typechange-ClinicalEncounter-practitionerMembershipId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-practitionerMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'practitionerMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-startedAt', {
        check: () => placeholder('typechange-ClinicalEncounter-startedAt:check'),
        run: () => placeholder('typechange-ClinicalEncounter-startedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'startedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-treatmentId', {
        check: () => placeholder('typechange-ClinicalEncounter-treatmentId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-treatmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'treatmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalEncounter-updatedByMembershipId', {
        check: () => placeholder('typechange-ClinicalEncounter-updatedByMembershipId:check'),
        run: () => placeholder('typechange-ClinicalEncounter-updatedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        column: 'updatedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-appointmentId', {
        check: () => placeholder('typechange-ClinicalFile-appointmentId:check'),
        run: () => placeholder('typechange-ClinicalFile-appointmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'appointmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-capturedAt', {
        check: () => placeholder('typechange-ClinicalFile-capturedAt:check'),
        run: () => placeholder('typechange-ClinicalFile-capturedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'capturedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-clinicalEncounterId', {
        check: () => placeholder('typechange-ClinicalFile-clinicalEncounterId:check'),
        run: () => placeholder('typechange-ClinicalFile-clinicalEncounterId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'clinicalEncounterId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-deletedAt', {
        check: () => placeholder('typechange-ClinicalFile-deletedAt:check'),
        run: () => placeholder('typechange-ClinicalFile-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-id', {
        check: () => placeholder('typechange-ClinicalFile-id:check'),
        run: () => placeholder('typechange-ClinicalFile-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-organizationId', {
        check: () => placeholder('typechange-ClinicalFile-organizationId:check'),
        run: () => placeholder('typechange-ClinicalFile-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-patientId', {
        check: () => placeholder('typechange-ClinicalFile-patientId:check'),
        run: () => placeholder('typechange-ClinicalFile-patientId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'patientId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-treatmentId', {
        check: () => placeholder('typechange-ClinicalFile-treatmentId:check'),
        run: () => placeholder('typechange-ClinicalFile-treatmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'treatmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-ClinicalFile-uploadedByMembershipId', {
        check: () => placeholder('typechange-ClinicalFile-uploadedByMembershipId:check'),
        run: () => placeholder('typechange-ClinicalFile-uploadedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'ClinicalFile',
        column: 'uploadedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalService-createdByMembershipId', {
        check: () => placeholder('typechange-DentalService-createdByMembershipId:check'),
        run: () => placeholder('typechange-DentalService-createdByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalService',
        column: 'createdByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalService-id', {
        check: () => placeholder('typechange-DentalService-id:check'),
        run: () => placeholder('typechange-DentalService-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalService',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalService-organizationId', {
        check: () => placeholder('typechange-DentalService-organizationId:check'),
        run: () => placeholder('typechange-DentalService-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalService',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalService-updatedByMembershipId', {
        check: () => placeholder('typechange-DentalService-updatedByMembershipId:check'),
        run: () => placeholder('typechange-DentalService-updatedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalService',
        column: 'updatedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalServiceSupply-id', {
        check: () => placeholder('typechange-DentalServiceSupply-id:check'),
        run: () => placeholder('typechange-DentalServiceSupply-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalServiceSupply-organizationId', {
        check: () => placeholder('typechange-DentalServiceSupply-organizationId:check'),
        run: () => placeholder('typechange-DentalServiceSupply-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-DentalServiceSupply-serviceId', {
        check: () => placeholder('typechange-DentalServiceSupply-serviceId:check'),
        run: () => placeholder('typechange-DentalServiceSupply-serviceId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        column: 'serviceId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Patient-birthDate', {
        check: () => placeholder('typechange-Patient-birthDate:check'),
        run: () => placeholder('typechange-Patient-birthDate:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Patient',
        column: 'birthDate',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
        },
      }),
      this.dataTransform(endContract, 'typechange-Patient-createdByMembershipId', {
        check: () => placeholder('typechange-Patient-createdByMembershipId:check'),
        run: () => placeholder('typechange-Patient-createdByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Patient',
        column: 'createdByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Patient-deletedAt', {
        check: () => placeholder('typechange-Patient-deletedAt:check'),
        run: () => placeholder('typechange-Patient-deletedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Patient',
        column: 'deletedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Patient-id', {
        check: () => placeholder('typechange-Patient-id:check'),
        run: () => placeholder('typechange-Patient-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Patient',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Patient-organizationId', {
        check: () => placeholder('typechange-Patient-organizationId:check'),
        run: () => placeholder('typechange-Patient-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Patient',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Patient-updatedByMembershipId', {
        check: () => placeholder('typechange-Patient-updatedByMembershipId:check'),
        run: () => placeholder('typechange-Patient-updatedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Patient',
        column: 'updatedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-PatientHealthProfile-createdByMembershipId', {
        check: () => placeholder('typechange-PatientHealthProfile-createdByMembershipId:check'),
        run: () => placeholder('typechange-PatientHealthProfile-createdByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        column: 'createdByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-PatientHealthProfile-id', {
        check: () => placeholder('typechange-PatientHealthProfile-id:check'),
        run: () => placeholder('typechange-PatientHealthProfile-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-PatientHealthProfile-organizationId', {
        check: () => placeholder('typechange-PatientHealthProfile-organizationId:check'),
        run: () => placeholder('typechange-PatientHealthProfile-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-PatientHealthProfile-patientId', {
        check: () => placeholder('typechange-PatientHealthProfile-patientId:check'),
        run: () => placeholder('typechange-PatientHealthProfile-patientId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        column: 'patientId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-PatientHealthProfile-updatedByMembershipId', {
        check: () => placeholder('typechange-PatientHealthProfile-updatedByMembershipId:check'),
        run: () => placeholder('typechange-PatientHealthProfile-updatedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        column: 'updatedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-appointmentId', {
        check: () => placeholder('typechange-Payment-appointmentId:check'),
        run: () => placeholder('typechange-Payment-appointmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'appointmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-branchId', {
        check: () => placeholder('typechange-Payment-branchId:check'),
        run: () => placeholder('typechange-Payment-branchId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'branchId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-clinicalEncounterId', {
        check: () => placeholder('typechange-Payment-clinicalEncounterId:check'),
        run: () => placeholder('typechange-Payment-clinicalEncounterId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'clinicalEncounterId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-id', {
        check: () => placeholder('typechange-Payment-id:check'),
        run: () => placeholder('typechange-Payment-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-organizationId', {
        check: () => placeholder('typechange-Payment-organizationId:check'),
        run: () => placeholder('typechange-Payment-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-paidAt', {
        check: () => placeholder('typechange-Payment-paidAt:check'),
        run: () => placeholder('typechange-Payment-paidAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'paidAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-patientId', {
        check: () => placeholder('typechange-Payment-patientId:check'),
        run: () => placeholder('typechange-Payment-patientId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'patientId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-receivedByMembershipId', {
        check: () => placeholder('typechange-Payment-receivedByMembershipId:check'),
        run: () => placeholder('typechange-Payment-receivedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'receivedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-treatmentId', {
        check: () => placeholder('typechange-Payment-treatmentId:check'),
        run: () => placeholder('typechange-Payment-treatmentId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'treatmentId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-voidedAt', {
        check: () => placeholder('typechange-Payment-voidedAt:check'),
        run: () => placeholder('typechange-Payment-voidedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'voidedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Payment-voidedByMembershipId', {
        check: () => placeholder('typechange-Payment-voidedByMembershipId:check'),
        run: () => placeholder('typechange-Payment-voidedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Payment',
        column: 'voidedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Radiograph-clinicalFileId', {
        check: () => placeholder('typechange-Radiograph-clinicalFileId:check'),
        run: () => placeholder('typechange-Radiograph-clinicalFileId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Radiograph',
        column: 'clinicalFileId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Radiograph-id', {
        check: () => placeholder('typechange-Radiograph-id:check'),
        run: () => placeholder('typechange-Radiograph-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Radiograph',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Radiograph-organizationId', {
        check: () => placeholder('typechange-Radiograph-organizationId:check'),
        run: () => placeholder('typechange-Radiograph-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Radiograph',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-createdByMembershipId', {
        check: () => placeholder('typechange-Treatment-createdByMembershipId:check'),
        run: () => placeholder('typechange-Treatment-createdByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'createdByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-endedAt', {
        check: () => placeholder('typechange-Treatment-endedAt:check'),
        run: () => placeholder('typechange-Treatment-endedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'endedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-id', {
        check: () => placeholder('typechange-Treatment-id:check'),
        run: () => placeholder('typechange-Treatment-id:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'id',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-organizationId', {
        check: () => placeholder('typechange-Treatment-organizationId:check'),
        run: () => placeholder('typechange-Treatment-organizationId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'organizationId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-patientId', {
        check: () => placeholder('typechange-Treatment-patientId:check'),
        run: () => placeholder('typechange-Treatment-patientId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'patientId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-practitionerMembershipId', {
        check: () => placeholder('typechange-Treatment-practitionerMembershipId:check'),
        run: () => placeholder('typechange-Treatment-practitionerMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'practitionerMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-serviceId', {
        check: () => placeholder('typechange-Treatment-serviceId:check'),
        run: () => placeholder('typechange-Treatment-serviceId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'serviceId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.dataTransform(endContract, 'typechange-Treatment-startedAt', {
        check: () => placeholder('typechange-Treatment-startedAt:check'),
        run: () => placeholder('typechange-Treatment-startedAt:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'startedAt',
        options: {
          qualifiedTargetType: 'timestamptz',
          formatTypeExpected: 'timestamp with time zone',
          rawTargetTypeForLabel: 'timestamptz',
        },
      }),
      this.dropNotNull({ schema: 'dentistry', table: 'Treatment', column: 'startedAt' }),
      this.dataTransform(endContract, 'typechange-Treatment-updatedByMembershipId', {
        check: () => placeholder('typechange-Treatment-updatedByMembershipId:check'),
        run: () => placeholder('typechange-Treatment-updatedByMembershipId:run'),
      }),
      this.alterColumnType({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'updatedByMembershipId',
        options: {
          qualifiedTargetType: 'uuid',
          formatTypeExpected: 'uuid',
          rawTargetTypeForLabel: 'uuid',
        },
      }),
      this.setDefault({
        schema: 'dentistry',
        table: 'Treatment',
        column: 'status',
        defaultSql: "DEFAULT 'PROPOSED'",
        operationClass: 'widening',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'AuthSession',
        constraint: 'session_expiry_ba6ba4ee',
        expression: '"expiresAt" > "createdAt"',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Branch',
        constraint: 'Branch_name_8e77c20d',
        expression: 'length(btrim("name")) > 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Branch',
        constraint: 'branch_coordinates_56618bb4',
        expression:
          '("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90) AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180)',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Organization',
        constraint: 'Organization_name_8e77c20d',
        expression: 'length(btrim("name")) > 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        constraint: 'plan_assignment_period_20c1ac54',
        expression: '"endsAt" > "startsAt"',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        constraint: 'plan_assignment_renewal_40ad111f',
        expression:
          "\"renewalPreference\" IN ('UNDECIDED', 'WANTS_RENEWAL', 'DOES_NOT_WANT_RENEWAL') AND \"renewalCount\" >= 0",
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        constraint: 'plan_assignment_snapshot_72303cec',
        expression:
          "jsonb_typeof(\"entitlementsSnapshot\") = 'object' AND \"entitlementsSnapshot\" ? 'schemaVersion' AND jsonb_typeof(\"entitlementsSnapshot\"->'schemaVersion') = 'number'",
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        constraint: 'plan_assignment_status_b9e0a885',
        expression: "\"status\" IN ('TRIALING', 'ACTIVE', 'SUSPENDED', 'CANCELED')",
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'OrganizationPlanAssignment',
        constraint: 'plan_assignment_suspension_ddbd1dc4',
        expression:
          '"status" <> \'SUSPENDED\' OR ("suspendedAt" IS NOT NULL AND "suspensionReason" IS NOT NULL AND length(btrim("suspensionReason")) > 0)',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Plan',
        constraint: 'Plan_currency_ecb311fb',
        expression:
          '("priceMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Plan',
        constraint: 'Plan_name_8e77c20d',
        expression: 'length(btrim("name")) > 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Plan',
        constraint: 'Plan_priceMinor_nonnegative_11edf7e3',
        expression: '"priceMinor" IS NULL OR "priceMinor" >= 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Plan',
        constraint: 'plan_duration_e29b5072',
        expression: '"durationDays" > 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Plan',
        constraint: 'plan_entitlements_version_258a43ba',
        expression:
          "jsonb_typeof(\"entitlements\") = 'object' AND \"entitlements\" ? 'schemaVersion' AND jsonb_typeof(\"entitlements\"->'schemaVersion') = 'number'",
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Plan',
        constraint: 'plan_type_41a85693',
        expression: "\"type\" IN ('PUBLIC', 'CUSTOM')",
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'Role',
        constraint: 'Role_name_8e77c20d',
        expression: 'length(btrim("name")) > 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'User',
        constraint: 'User_name_8e64109c',
        expression:
          'length(btrim("firstName")) > 0 AND length(btrim("lastName")) > 0 AND length(btrim("email")) > 0',
      }),
      this.addCheckConstraint({
        schema: 'core',
        table: 'UserCredential',
        constraint: 'credential_attempts_a4193ee4',
        expression: '"failedAttempts" >= 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'Appointment_version_dd7c92f3',
        expression: '"rowVersion" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'appointment_cancellation_db41f933',
        expression:
          '"status" <> \'CANCELED\' OR ("canceledAt" IS NOT NULL AND "canceledByMembershipId" IS NOT NULL AND "cancellationReason" IS NOT NULL AND length(btrim("cancellationReason")) > 0)',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'appointment_period_442ac438',
        expression: '"scheduledEndAt" > "scheduledStartAt"',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'appointment_status_95fcb93c',
        expression:
          "\"status\" IN ('SCHEDULED', 'CONFIRMED', 'WAITING_ROOM', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELED')",
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'Appointment_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'Appointment',
        constraint: 'Appointment_organizationId_patientId_id_key',
        columns: ['organizationId', 'patientId', 'id'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'AppointmentService',
        constraint: 'AppointmentService_currency_ecb311fb',
        expression:
          '("priceMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'AppointmentService',
        constraint: 'AppointmentService_durationMinutes_positive_8030d417',
        expression: '"durationMinutes" IS NULL OR "durationMinutes" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'AppointmentService',
        constraint: 'AppointmentService_priceMinor_nonnegative_11edf7e3',
        expression: '"priceMinor" IS NULL OR "priceMinor" >= 0',
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'BranchSchedulingPolicy',
        constraint: 'BranchSchedulingPolicy_branchId_key',
        columns: ['branchId'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'ClinicalEncounter_version_dd7c92f3',
        expression: '"rowVersion" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_completion_f68c0f91',
        expression:
          '"status" <> \'COMPLETED\' OR ("endedAt" IS NOT NULL AND "completedAt" IS NOT NULL AND "completedByMembershipId" IS NOT NULL AND "procedureSummary" IS NOT NULL AND length(btrim("procedureSummary")) > 0)',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_period_83482cfa',
        expression: '"endedAt" IS NULL OR "endedAt" >= "startedAt"',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_revocation_cb0f7bd5',
        expression:
          '("status" <> \'VOIDED\' AND "voidedAt" IS NULL AND "voidedByMembershipId" IS NULL AND "voidReason" IS NULL) OR ("status" = \'VOIDED\' AND "voidedAt" IS NOT NULL AND "voidedByMembershipId" IS NOT NULL AND "voidReason" IS NOT NULL AND length(btrim("voidReason")) > 0)',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_snapshot_093a76bd',
        expression:
          '"historySnapshot" IS NULL OR (jsonb_typeof("historySnapshot") = \'object\' AND "historySnapshot" ? \'schemaVersion\' AND jsonb_typeof("historySnapshot"->\'schemaVersion\') = \'number\')',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_status_47fdd5c9',
        expression: "\"status\" IN ('IN_PROGRESS', 'COMPLETED', 'VOIDED')",
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'ClinicalEncounter_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'ClinicalEncounter_organizationId_patientId_id_key',
        columns: ['organizationId', 'patientId', 'id'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'file_category_d2437530',
        expression: "\"category\" IN ('RADIOGRAPH', 'PHOTO', 'DOCUMENT', 'OTHER')",
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'file_size_c80e0712',
        expression: '"sizeBytes" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'file_upload_pending_a00263ea',
        expression: '"uploadStatus" <> \'PENDING\' OR "uploadExpiresAt" IS NOT NULL',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'file_upload_ready_612d5863',
        expression: '"uploadStatus" <> \'READY\' OR "uploadedAt" IS NOT NULL',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'file_upload_status_ee474e5d',
        expression: "\"uploadStatus\" IN ('PENDING', 'READY', 'FAILED')",
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'ClinicalFile',
        constraint: 'ClinicalFile_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalService',
        constraint: 'DentalService_basePriceMinor_nonnegative_9e87f68a',
        expression: '"basePriceMinor" IS NULL OR "basePriceMinor" >= 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalService',
        constraint: 'DentalService_currency_3571822c',
        expression:
          '("basePriceMinor" IS NULL AND "labCostMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalService',
        constraint: 'DentalService_durationMinutes_positive_8030d417',
        expression: '"durationMinutes" IS NULL OR "durationMinutes" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalService',
        constraint: 'DentalService_labCostMinor_nonnegative_62ea7896',
        expression: '"labCostMinor" IS NULL OR "labCostMinor" >= 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalService',
        constraint: 'service_name_8e77c20d',
        expression: 'length(btrim("name")) > 0',
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'DentalService',
        constraint: 'DentalService_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        constraint: 'DentalServiceSupply_estimatedCostMinor_nonnegative_0bdfed78',
        expression: '"estimatedCostMinor" IS NULL OR "estimatedCostMinor" >= 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        constraint: 'supply_quantity_fc510296',
        expression: '"quantity" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Patient',
        constraint: 'patient_document_8e293bbf',
        expression:
          '("documentType" IS NULL AND "documentNumber" IS NULL) OR ("documentType" IS NOT NULL AND "documentNumber" IS NOT NULL AND length(btrim("documentType")) > 0 AND length(btrim("documentNumber")) > 0)',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Patient',
        constraint: 'patient_name_502392af',
        expression: 'length(btrim("firstName")) > 0 AND length(btrim("lastName")) > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Patient',
        constraint: 'patient_sex_2df08017',
        expression: "\"sex\" IS NULL OR \"sex\" IN ('MALE', 'FEMALE', 'OTHER')",
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Patient',
        constraint: 'patient_status_ee520df2',
        expression: "\"status\" IN ('ACTIVE', 'INACTIVE')",
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'Patient',
        constraint: 'Patient_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        constraint: 'PatientHealthProfile_version_dd7c92f3',
        expression: '"rowVersion" > 0',
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        constraint: 'PatientHealthProfile_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'payment_amount_b855849f',
        expression: '"amountMinor" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'payment_currency_bbe8c718',
        expression: '"currency" ~ \'^[A-Z]{3}$\'',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'payment_status_f6809ca0',
        expression: "\"status\" IN ('COMPLETED', 'VOIDED')",
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Payment',
        constraint: 'payment_void_0109b95c',
        expression:
          '"status" <> \'VOIDED\' OR ("voidedAt" IS NOT NULL AND "voidedByMembershipId" IS NOT NULL AND "voidReason" IS NOT NULL AND length(btrim("voidReason")) > 0)',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Radiograph',
        constraint: 'radiograph_laterality_366d3f9b',
        expression: "\"laterality\" IS NULL OR \"laterality\" IN ('LEFT', 'RIGHT', 'BILATERAL')",
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Radiograph',
        constraint: 'radiograph_type_7cdc7660',
        expression:
          "\"radiographType\" IN ('PANORAMIC', 'PERIAPICAL', 'BITEWING', 'OCCLUSAL', 'CEPHALOMETRIC', 'CBCT', 'OTHER')",
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_agreedPriceMinor_nonnegative_1e89f048',
        expression: '"agreedPriceMinor" IS NULL OR "agreedPriceMinor" >= 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_currency_3d83f060',
        expression:
          '("agreedPriceMinor" IS NULL) OR ("currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_estimatedSessions_positive_44733360',
        expression: '"estimatedSessions" IS NULL OR "estimatedSessions" > 0',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'treatment_period_236b673f',
        expression: '"endedAt" IS NULL OR ("startedAt" IS NOT NULL AND "endedAt" >= "startedAt")',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'treatment_status_94785b0f',
        expression:
          "\"status\" IN ('PROPOSED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'DECLINED', 'CANCELED')",
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'Treatment_organizationId_patientId_id_key',
        columns: ['organizationId', 'patientId', 'id'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'AuditLog',
        index: 'AuditLog_actorMembershipId_idx_993b1bc0',
        columns: ['actorMembershipId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'Branch',
        index: 'branch_org_code_uidx_86acfd58',
        columns: ['organizationId', 'code'],
        extras: { where: '"deletedAt" IS NULL AND "code" IS NOT NULL', unique: true },
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        index: 'OrganizationFeatureTrial_activatedByUserId_idx_db4a3739',
        columns: ['activatedByUserId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        index: 'OrganizationFeatureTrial_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        index: 'OrganizationFeatureTrial_sourcePlanId_idx_3a6dc372',
        columns: ['sourcePlanId'],
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        index: 'feature_trial_offer_uidx_707a487d',
        columns: ['organizationId', 'vertical', 'trialCode'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationMembership',
        index: 'membership_org_user_uidx_97d1e537',
        columns: ['organizationId', 'userId'],
        extras: { where: '"deletedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationMembershipBranch',
        index: 'membership_branch_uidx_74280930',
        columns: ['membershipId', 'branchId'],
        extras: { where: '"deletedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'core',
        table: 'OrganizationMembershipRole',
        index: 'membership_role_uidx_62f11429',
        columns: ['membershipId', 'roleId'],
        extras: { where: '"deletedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'core',
        table: 'Role',
        index: 'role_global_code_uidx_4cecb184',
        columns: ['code'],
        extras: { where: '"organizationId" IS NULL AND "deletedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'core',
        table: 'Role',
        index: 'role_org_code_uidx_8c1de131',
        columns: ['organizationId', 'code'],
        extras: { where: '"organizationId" IS NOT NULL AND "deletedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'Appointment_organizationId_patientId_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'Appointment_organizationId_patientId_treatmentId_idx_dd20ff46',
        columns: ['organizationId', 'patientId', 'treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Appointment',
        index: 'appointment_patient_start_idx_dc58e3ea',
        columns: ['organizationId', 'patientId', 'scheduledStartAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'AppointmentService',
        index: 'appointment_service_uidx_09188bd9',
        columns: ['appointmentId', 'serviceId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'BranchSchedulingPolicy',
        index: 'scheduling_org_branch_idx_9d922e31',
        columns: ['organizationId', 'branchId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        index: 'ClinicalEncounter_organizationId_patientId_appointment_19789725',
        columns: ['organizationId', 'patientId', 'appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        index: 'ClinicalEncounter_organizationId_patientId_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        index: 'ClinicalEncounter_organizationId_patientId_treatmentId_dd20ff46',
        columns: ['organizationId', 'patientId', 'treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'ClinicalFile_organizationId_patientId_appointmentId_id_19789725',
        columns: ['organizationId', 'patientId', 'appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'ClinicalFile_organizationId_patientId_clinicalEncounte_165e4cfa',
        columns: ['organizationId', 'patientId', 'clinicalEncounterId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'ClinicalFile_organizationId_patientId_treatmentId_idx_dd20ff46',
        columns: ['organizationId', 'patientId', 'treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'file_encounter_idx_60023e76',
        columns: ['organizationId', 'clinicalEncounterId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'file_patient_capture_idx_c7009c42',
        columns: ['organizationId', 'patientId', 'capturedAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        index: 'file_storage_object_uidx_2cc9a136',
        columns: ['storageProvider', 'bucket', 'objectKey'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Patient',
        index: 'patient_org_document_uidx_0ff52a5d',
        columns: ['organizationId', 'documentType', 'documentNumber'],
        extras: {
          where:
            '"deletedAt" IS NULL AND "documentType" IS NOT NULL AND "documentNumber" IS NOT NULL',
          unique: true,
        },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientBranchAssignment',
        index: 'PatientBranchAssignment_organizationId_patientId_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientBranchAssignment',
        index: 'patient_branch_lookup_idx_bc6b0b84',
        columns: ['organizationId', 'branchId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientBranchAssignment',
        index: 'patient_branch_uidx_775cfe89',
        columns: ['organizationId', 'patientId', 'branchId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        index: 'PatientHealthProfile_organizationId_patientId_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientPractitionerAssignment',
        index: 'PatientPractitionerAssignment_organizationId_patientId_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientPractitionerAssignment',
        index: 'patient_practitioner_active_uidx_52eb9a22',
        columns: ['organizationId', 'patientId', 'practitionerMembershipId'],
        extras: { where: '"revokedAt" IS NULL', unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'PatientPractitionerAssignment',
        index: 'practitioner_patients_idx_19e8e01d',
        columns: ['organizationId', 'practitionerMembershipId', 'revokedAt', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_organizationId_patientId_appointmentId_idx_19789725',
        columns: ['organizationId', 'patientId', 'appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_organizationId_patientId_clinicalEncounterId_i_165e4cfa',
        columns: ['organizationId', 'patientId', 'clinicalEncounterId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_organizationId_patientId_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'Payment_organizationId_patientId_treatmentId_idx_dd20ff46',
        columns: ['organizationId', 'patientId', 'treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'payment_patient_paid_idx_ea204da7',
        columns: ['organizationId', 'patientId', 'paidAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Radiograph',
        index: 'Radiograph_organizationId_clinicalFileId_idx_d102136d',
        columns: ['organizationId', 'clinicalFileId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Treatment',
        index: 'Treatment_organizationId_serviceId_idx_8c10b794',
        columns: ['organizationId', 'serviceId'],
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'AuditLog',
        foreignKey: {
          name: 'AuditLog_actorMembershipId_fkey',
          columns: ['actorMembershipId'],
          references: { schema: 'core', table: 'OrganizationMembership', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        foreignKey: {
          name: 'OrganizationFeatureTrial_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'core', table: 'Organization', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        foreignKey: {
          name: 'OrganizationFeatureTrial_sourcePlanId_fkey',
          columns: ['sourcePlanId'],
          references: { schema: 'core', table: 'Plan', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'core',
        table: 'OrganizationFeatureTrial',
        foreignKey: {
          name: 'OrganizationFeatureTrial_activatedByUserId_fkey',
          columns: ['activatedByUserId'],
          references: { schema: 'core', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Appointment',
        foreignKey: {
          name: 'Appointment_organizationId_patientId_treatmentId_fkey',
          columns: ['organizationId', 'patientId', 'treatmentId'],
          references: {
            schema: 'dentistry',
            table: 'Treatment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Appointment',
        foreignKey: {
          name: 'Appointment_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'AppointmentService',
        foreignKey: {
          name: 'AppointmentService_organizationId_appointmentId_fkey',
          columns: ['organizationId', 'appointmentId'],
          references: {
            schema: 'dentistry',
            table: 'Appointment',
            columns: ['organizationId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'AppointmentService',
        foreignKey: {
          name: 'AppointmentService_organizationId_serviceId_fkey',
          columns: ['organizationId', 'serviceId'],
          references: {
            schema: 'dentistry',
            table: 'DentalService',
            columns: ['organizationId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        foreignKey: {
          name: 'ClinicalEncounter_organizationId_patientId_appointmentId_fkey',
          columns: ['organizationId', 'patientId', 'appointmentId'],
          references: {
            schema: 'dentistry',
            table: 'Appointment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        foreignKey: {
          name: 'ClinicalEncounter_organizationId_patientId_treatmentId_fkey',
          columns: ['organizationId', 'patientId', 'treatmentId'],
          references: {
            schema: 'dentistry',
            table: 'Treatment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        foreignKey: {
          name: 'ClinicalEncounter_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalFile',
        foreignKey: {
          name: 'ClinicalFile_organizationId_patientId_appointmentId_fkey',
          columns: ['organizationId', 'patientId', 'appointmentId'],
          references: {
            schema: 'dentistry',
            table: 'Appointment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalFile',
        foreignKey: {
          name: 'ClinicalFile_organizationId_patientId_clinicalEncounterId_fkey',
          columns: ['organizationId', 'patientId', 'clinicalEncounterId'],
          references: {
            schema: 'dentistry',
            table: 'ClinicalEncounter',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalFile',
        foreignKey: {
          name: 'ClinicalFile_organizationId_patientId_treatmentId_fkey',
          columns: ['organizationId', 'patientId', 'treatmentId'],
          references: {
            schema: 'dentistry',
            table: 'Treatment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalFile',
        foreignKey: {
          name: 'ClinicalFile_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        foreignKey: {
          name: 'DentalServiceSupply_organizationId_serviceId_fkey',
          columns: ['organizationId', 'serviceId'],
          references: {
            schema: 'dentistry',
            table: 'DentalService',
            columns: ['organizationId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'PatientBranchAssignment',
        foreignKey: {
          name: 'PatientBranchAssignment_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'PatientHealthProfile',
        foreignKey: {
          name: 'PatientHealthProfile_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'PatientPractitionerAssignment',
        foreignKey: {
          name: 'PatientPractitionerAssignment_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Payment',
        foreignKey: {
          name: 'Payment_organizationId_patientId_appointmentId_fkey',
          columns: ['organizationId', 'patientId', 'appointmentId'],
          references: {
            schema: 'dentistry',
            table: 'Appointment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Payment',
        foreignKey: {
          name: 'Payment_organizationId_patientId_clinicalEncounterId_fkey',
          columns: ['organizationId', 'patientId', 'clinicalEncounterId'],
          references: {
            schema: 'dentistry',
            table: 'ClinicalEncounter',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Payment',
        foreignKey: {
          name: 'Payment_organizationId_patientId_treatmentId_fkey',
          columns: ['organizationId', 'patientId', 'treatmentId'],
          references: {
            schema: 'dentistry',
            table: 'Treatment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Payment',
        foreignKey: {
          name: 'Payment_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Radiograph',
        foreignKey: {
          name: 'Radiograph_organizationId_clinicalFileId_fkey',
          columns: ['organizationId', 'clinicalFileId'],
          references: {
            schema: 'dentistry',
            table: 'ClinicalFile',
            columns: ['organizationId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Treatment',
        foreignKey: {
          name: 'Treatment_organizationId_patientId_fkey',
          columns: ['organizationId', 'patientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Treatment',
        foreignKey: {
          name: 'Treatment_organizationId_serviceId_fkey',
          columns: ['organizationId', 'serviceId'],
          references: {
            schema: 'dentistry',
            table: 'DentalService',
            columns: ['organizationId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'AppointmentService',
        from: 'apptsvc_org_appt_idx_9087d499',
        to: 'AppointmentService_organizationId_appointmentId_idx_9087d499',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'AppointmentService',
        from: 'apptsvc_org_svc_idx_8c10b794',
        to: 'AppointmentService_organizationId_serviceId_idx_8c10b794',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'ClinicalFile',
        from: 'cf_org_patient_idx_7c150195',
        to: 'ClinicalFile_organizationId_patientId_idx_7c150195',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Appointment',
        from: 'appt_org_branch_start_idx_4ed245ce',
        to: 'appointment_branch_start_idx_4ed245ce',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Appointment',
        from: 'appt_org_prof_start_idx_88b66a83',
        to: 'appointment_practitioner_start_idx_88b66a83',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        from: 'enc_org_patient_start_idx_8434fd72',
        to: 'encounter_patient_start_idx_8434fd72',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        from: 'enc_org_prof_start_idx_3b92be85',
        to: 'encounter_practitioner_start_idx_3b92be85',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Patient',
        from: 'pat_org_name_idx_a92c3560',
        to: 'patient_org_name_idx_a92c3560',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Patient',
        from: 'pat_org_phone_idx_9ebe94ad',
        to: 'patient_org_phone_idx_9ebe94ad',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Payment',
        from: 'pay_org_branch_paid_idx_7bfda1be',
        to: 'payment_branch_paid_idx_7bfda1be',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Payment',
        from: 'pay_org_paid_idx_b952dcb9',
        to: 'payment_org_paid_idx_b952dcb9',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'DentalService',
        from: 'svc_org_active_idx_c89f2a48',
        to: 'service_org_active_idx_c89f2a48',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'DentalService',
        from: 'svc_org_category_idx_a0ddcd26',
        to: 'service_org_category_idx_a0ddcd26',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'DentalService',
        from: 'svc_org_code_uidx_e11c0273',
        to: 'service_org_code_uidx_e11c0273',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'DentalServiceSupply',
        from: 'dss_org_service_idx_8c10b794',
        to: 'supply_org_service_idx_8c10b794',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Treatment',
        from: 'trt_org_patient_idx_7c150195',
        to: 'treatment_patient_idx_7c150195',
      }),
      this.renameIndex({
        schema: 'dentistry',
        table: 'Treatment',
        from: 'trt_org_status_idx_21af5e82',
        to: 'treatment_status_idx_21af5e82',
      }),
    ];
  }
}

throw new Error("DRAFT ONLY: resolve all placeholders, data reconciliation and operation ordering before emitting a runnable migration.");
