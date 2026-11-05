#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/60caa8643e70224c6142a506aaabf149485d3e2f295b0d885866c0d2856a4216/contract';
import endContract from '../../snapshots/60caa8643e70224c6142a506aaabf149485d3e2f295b0d885866c0d2856a4216/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b/contract';
import startContract from '../../snapshots/a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  rawSql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      rawSql({
        id: 'reconcile-orphan-appointments-and-require-patient',
        label: 'Remove only verified orphan appointments and require patientId',
        operationClass: 'destructive',
        summary: 'Delete the two reviewed test appointments if still orphaned; reject any other null patient reference',
        target: { id: 'postgres', details: { schema: 'dentistry', objectType: 'table', name: 'Appointment' } },
        precheck: [],
        execute: [{ description: 'Guarded cleanup of the two reviewed orphan appointments and enforce Appointment.patientId NOT NULL', sql: "DO $orphan$\nDECLARE\n  candidate_ids uuid[] := ARRAY[\n    '01a18451-bf7b-73bf-873f-7c73da1a8240'::uuid,\n    '01a18452-716b-7202-a319-397964ed6cab'::uuid\n  ];\nBEGIN\n  PERFORM set_config('lock_timeout', '10s', true);\n  LOCK TABLE \"dentistry\".\"Appointment\", \"dentistry\".\"AppointmentService\", \"dentistry\".\"ClinicalEncounter\", \"dentistry\".\"ClinicalFile\", \"dentistry\".\"Payment\" IN ACCESS EXCLUSIVE MODE;\n\n  IF EXISTS (\n    SELECT 1 FROM \"dentistry\".\"Appointment\"\n    WHERE \"id\" = ANY(candidate_ids) AND \"status\" <> 'SCHEDULED'\n  ) THEN\n    RAISE EXCEPTION 'Reviewed orphan appointment status changed; stop and review data';\n  END IF;\n\n  IF EXISTS (SELECT 1 FROM \"dentistry\".\"AppointmentService\" WHERE \"appointmentId\" = ANY(candidate_ids))\n     OR EXISTS (SELECT 1 FROM \"dentistry\".\"ClinicalEncounter\" WHERE \"appointmentId\" = ANY(candidate_ids))\n     OR EXISTS (SELECT 1 FROM \"dentistry\".\"ClinicalFile\" WHERE \"appointmentId\" = ANY(candidate_ids))\n     OR EXISTS (SELECT 1 FROM \"dentistry\".\"Payment\" WHERE \"appointmentId\" = ANY(candidate_ids)) THEN\n    RAISE EXCEPTION 'Reviewed orphan appointment acquired dependent records; stop and review data';\n  END IF;\n\n  DELETE FROM \"dentistry\".\"Appointment\"\n  WHERE \"id\" = ANY(candidate_ids) AND \"patientId\" IS NULL AND \"status\" = 'SCHEDULED';\n\n  IF EXISTS (SELECT 1 FROM \"dentistry\".\"Appointment\" WHERE \"patientId\" IS NULL) THEN\n    RAISE EXCEPTION 'Other appointment rows have no patient; reconcile them before migration';\n  END IF;\n\n  ALTER TABLE \"dentistry\".\"Appointment\" ALTER COLUMN \"patientId\" SET NOT NULL;\nEND;\n$orphan$;" }],
        postcheck: [],
      }),
      this.dropCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_completion_f68c0f91',
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        columns: [
          col('clinicalEncounterId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('patientId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('rowVersion', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('RECORDED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('targetDescription', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('targetType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toothNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('treatmentProcedureId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('voidReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('voidedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('voidedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('ClinicalEncounterProcedure_version_dd7c92f3', '"rowVersion" > 0'),
          checkExpression(
            'encounter_procedure_description_89a34e41',
            'length(btrim("description")) > 0',
          ),
          checkExpression(
            'encounter_procedure_status_5eb91a7c',
            "\"status\" IN ('RECORDED', 'VOIDED')",
          ),
          checkExpression(
            'encounter_procedure_target_57de7bf8',
            '("targetType" = \'TOOTH\' AND "toothNumber" IS NOT NULL AND length(btrim("toothNumber")) > 0) OR ("targetType" <> \'TOOTH\' AND "toothNumber" IS NULL)',
          ),
          checkExpression(
            'encounter_procedure_target_type_f0db201c',
            "\"targetType\" IN ('TOOTH', 'REGION', 'WHOLE_MOUTH', 'OTHER')",
          ),
          checkExpression(
            'encounter_procedure_void_7fd3b183',
            '("status" = \'RECORDED\' AND "voidedAt" IS NULL AND "voidedByMembershipId" IS NULL AND "voidReason" IS NULL) OR ("status" = \'VOIDED\' AND "voidedAt" IS NOT NULL AND "voidedByMembershipId" IS NOT NULL AND "voidReason" IS NOT NULL AND length(btrim("voidReason")) > 0)',
          ),
        ],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'Person',
        columns: [
          col('convertedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('convertedToPatientId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('deletedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lastName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('person_first_name_not_empty_9cd62522', 'length(btrim("firstName")) > 0'),
          checkExpression(
            'person_last_name_not_empty_1fc0ba58',
            '"lastName" IS NULL OR length(btrim("lastName")) > 0',
          ),
          checkExpression(
            'person_phone_not_empty_64d7f03d',
            '"phone" IS NULL OR length(btrim("phone")) > 0',
          ),
        ],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'TreatmentProcedure',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('organizationId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('patientId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('position', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('rowVersion', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('PLANNED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('targetDescription', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('targetType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('toothNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('treatmentId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('TreatmentProcedure_version_dd7c92f3', '"rowVersion" > 0'),
          checkExpression(
            'treatment_procedure_description_89a34e41',
            'length(btrim("description")) > 0',
          ),
          checkExpression('treatment_procedure_position_f43e8efc', '"position" >= 0'),
          checkExpression(
            'treatment_procedure_status_1cc80bf3',
            "\"status\" IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED')",
          ),
          checkExpression(
            'treatment_procedure_target_57de7bf8',
            '("targetType" = \'TOOTH\' AND "toothNumber" IS NOT NULL AND length(btrim("toothNumber")) > 0) OR ("targetType" <> \'TOOTH\' AND "toothNumber" IS NULL)',
          ),
          checkExpression(
            'treatment_procedure_target_type_f0db201c',
            "\"targetType\" IN ('TOOTH', 'REGION', 'WHOLE_MOUTH', 'OTHER')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Appointment',
        column: col('personId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Patient',
        column: col('maritalStatus', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Patient',
        column: col('occupation', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'Patient',
        column: col('origin', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dropNotNull({
        schema: 'dentistry',
        table: 'Appointment',
        column: 'practitionerMembershipId',
      }),
      this.dropNotNull({ schema: 'dentistry', table: 'Treatment', column: 'serviceId' }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounter',
        constraint: 'encounter_completion_bc0ba739',
        expression:
          '"status" <> \'COMPLETED\' OR ("endedAt" IS NOT NULL AND "completedAt" IS NOT NULL AND "completedByMembershipId" IS NOT NULL)',
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        constraint: 'ClinicalEncounterProcedure_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        constraint: 'ClinicalEncounterProcedure_organizationId_patientId_id_key',
        columns: ['organizationId', 'patientId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'Person',
        constraint: 'Person_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'TreatmentProcedure',
        constraint: 'TreatmentProcedure_organizationId_id_key',
        columns: ['organizationId', 'id'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'TreatmentProcedure',
        constraint: 'TreatmentProcedure_organizationId_patientId_id_key',
        columns: ['organizationId', 'patientId', 'id'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        index: 'encounter_procedure_list_idx_165e4cfa',
        columns: ['organizationId', 'patientId', 'clinicalEncounterId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        index: 'encounter_procedure_plan_idx_b2f5358b',
        columns: ['organizationId', 'patientId', 'treatmentProcedureId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        index: 'encounter_procedure_tooth_idx_fc15b9d9',
        columns: ['organizationId', 'patientId', 'toothNumber'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Person',
        index: 'Person_organizationId_convertedToPatientId_idx_e2b28906',
        columns: ['organizationId', 'convertedToPatientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Person',
        index: 'person_org_name_idx_a92c3560',
        columns: ['organizationId', 'lastName', 'firstName'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Person',
        index: 'person_org_phone_idx_9ebe94ad',
        columns: ['organizationId', 'phone'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'TreatmentProcedure',
        index: 'TreatmentProcedure_organizationId_patientId_treatmentI_dd20ff46',
        columns: ['organizationId', 'patientId', 'treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'TreatmentProcedure',
        index: 'treatment_procedure_status_idx_1c537051',
        columns: ['organizationId', 'patientId', 'status'],
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        foreignKey: {
          name: 'encounter_procedure_encounter_fk',
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
        table: 'ClinicalEncounterProcedure',
        foreignKey: {
          name: 'encounter_procedure_plan_fk',
          columns: ['organizationId', 'patientId', 'treatmentProcedureId'],
          references: {
            schema: 'dentistry',
            table: 'TreatmentProcedure',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'Person',
        foreignKey: {
          name: 'Person_organizationId_convertedToPatientId_fkey',
          columns: ['organizationId', 'convertedToPatientId'],
          references: { schema: 'dentistry', table: 'Patient', columns: ['organizationId', 'id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'TreatmentProcedure',
        foreignKey: {
          name: 'treatment_procedure_treatment_fk',
          columns: ['organizationId', 'patientId', 'treatmentId'],
          references: {
            schema: 'dentistry',
            table: 'Treatment',
            columns: ['organizationId', 'patientId', 'id'],
          },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
