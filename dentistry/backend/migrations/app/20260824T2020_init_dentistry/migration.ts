#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/88664fc7048e9d5ea85e51cf75dbfbe5a9691d6e8d9822cc520aca8ab899f9ec/contract';
import endContract from '../../snapshots/88664fc7048e9d5ea85e51cf75dbfbe5a9691d6e8d9822cc520aca8ab899f9ec/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'dentistry' }),
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'dentistry',
        table: 'appointments',
        columns: [
          col('branchId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('cancellationReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('cancelledAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('cancelledByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('endsAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('patientId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('professionalMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('serviceId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('startsAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('SCHEDULED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('treatmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'clinical_encounters',
        columns: [
          col('appointmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('branchId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('chiefComplaint', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('diagnosis', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('endedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('evolution', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('patientId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('procedurePerformed', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('professionalMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('recommendations', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('treatmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'clinical_files',
        columns: [
          col('appointmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('bucket', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('capturedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('checksumSha256', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('clinicalEncounterId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('mimeType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('objectKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('originalFilename', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('patientId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('sizeBytes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('storageProvider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('treatmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('uploadedByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'clinical_histories',
        columns: [
          col('allergies', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('currentMedications', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dentalHistory', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('medicalHistory', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('observations', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('patientId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('relevantConditions', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'dental_services',
        columns: [
          col('active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('basePriceMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('currency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('durationMinutes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'patients',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('birthDate', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('deleted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('deletedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('documentNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('documentType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('firstName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('lastName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sex', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'payments',
        columns: [
          col('amountMinor', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('appointmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('branchId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('clinicalEncounterId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('currency', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('paidAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('patientId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('paymentMethod', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('receivedByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('COMPLETED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('treatmentId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('voidedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('voidedByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'radiographs',
        columns: [
          col('clinicalFileId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('laterality', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('radiographType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('region', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('takenAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('toothNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'dentistry',
        table: 'treatments',
        columns: [
          col('agreedPriceMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('createdByMembershipId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('currency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('diagnosis', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('endedAt', 'timestamp', { codecRef: { codecId: 'pg/timestamp@1' } }),
          col('estimatedSessions', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('patientId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('responsibleMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('serviceId', 'character(36)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
          col('startedAt', 'timestamp', { notNull: true, codecRef: { codecId: 'pg/timestamp@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('updatedByMembershipId', 'character(36)', {
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 36 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'clinical_encounters',
        constraint: 'clinical_encounters_appointmentId_key',
        columns: ['appointmentId'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'clinical_histories',
        constraint: 'clinical_histories_patientId_key',
        columns: ['patientId'],
      }),
      this.addUnique({
        schema: 'dentistry',
        table: 'radiographs',
        constraint: 'radiographs_clinicalFileId_key',
        columns: ['clinicalFileId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appointments_patientId_idx_e5f07e88',
        columns: ['patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appointments_serviceId_idx_b5d9acbf',
        columns: ['serviceId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appointments_treatmentId_idx_18e96195',
        columns: ['treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appt_org_branch_start_idx_dd7b9f0f',
        columns: ['organizationId', 'branchId', 'startsAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appt_org_prof_start_idx_9d9d088f',
        columns: ['organizationId', 'professionalMembershipId', 'startsAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appt_org_start_idx_4d98ff60',
        columns: ['organizationId', 'startsAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'appointments',
        index: 'appt_patient_start_idx_e7cd3706',
        columns: ['patientId', 'startsAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_encounters',
        index: 'clinical_encounters_patientId_idx_e5f07e88',
        columns: ['patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_encounters',
        index: 'clinical_encounters_treatmentId_idx_18e96195',
        columns: ['treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_encounters',
        index: 'enc_org_patient_start_idx_8434fd72',
        columns: ['organizationId', 'patientId', 'startedAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_encounters',
        index: 'enc_org_prof_start_idx_ccff3a92',
        columns: ['organizationId', 'professionalMembershipId', 'startedAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_files',
        index: 'cf_bucket_object_uidx_fe606a9b',
        columns: ['bucket', 'objectKey'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_files',
        index: 'cf_encounter_idx_2139e386',
        columns: ['clinicalEncounterId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_files',
        index: 'cf_org_patient_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_files',
        index: 'clinical_files_appointmentId_idx_682a8b58',
        columns: ['appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_files',
        index: 'clinical_files_patientId_idx_e5f07e88',
        columns: ['patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_files',
        index: 'clinical_files_treatmentId_idx_18e96195',
        columns: ['treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'clinical_histories',
        index: 'ch_org_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'dental_services',
        index: 'svc_org_active_idx_0c9a1852',
        columns: ['organizationId', 'active'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'dental_services',
        index: 'svc_org_code_uidx_e11c0273',
        columns: ['organizationId', 'code'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'patients',
        index: 'pat_org_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'patients',
        index: 'pat_org_name_idx_a92c3560',
        columns: ['organizationId', 'lastName', 'firstName'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'patients',
        index: 'pat_org_phone_idx_9ebe94ad',
        columns: ['organizationId', 'phone'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'pay_org_branch_paid_idx_7bfda1be',
        columns: ['organizationId', 'branchId', 'paidAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'pay_org_paid_idx_b952dcb9',
        columns: ['organizationId', 'paidAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'pay_patient_paid_idx_c631bb8a',
        columns: ['patientId', 'paidAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'payments_appointmentId_idx_682a8b58',
        columns: ['appointmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'payments_clinicalEncounterId_idx_2139e386',
        columns: ['clinicalEncounterId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'payments_patientId_idx_e5f07e88',
        columns: ['patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'payments',
        index: 'payments_treatmentId_idx_18e96195',
        columns: ['treatmentId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'radiographs',
        index: 'rad_org_taken_idx_7edfcbb7',
        columns: ['organizationId', 'takenAt'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'treatments',
        index: 'treatments_patientId_idx_e5f07e88',
        columns: ['patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'treatments',
        index: 'treatments_serviceId_idx_b5d9acbf',
        columns: ['serviceId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'treatments',
        index: 'trt_org_patient_idx_7c150195',
        columns: ['organizationId', 'patientId'],
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'treatments',
        index: 'trt_org_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'appointments',
        foreignKey: {
          name: 'appointments_patientId_fkey',
          columns: ['patientId'],
          references: { schema: 'dentistry', table: 'patients', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'appointments',
        foreignKey: {
          name: 'appointments_serviceId_fkey',
          columns: ['serviceId'],
          references: { schema: 'dentistry', table: 'dental_services', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'appointments',
        foreignKey: {
          name: 'appointments_treatmentId_fkey',
          columns: ['treatmentId'],
          references: { schema: 'dentistry', table: 'treatments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_encounters',
        foreignKey: {
          name: 'clinical_encounters_patientId_fkey',
          columns: ['patientId'],
          references: { schema: 'dentistry', table: 'patients', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_encounters',
        foreignKey: {
          name: 'clinical_encounters_appointmentId_fkey',
          columns: ['appointmentId'],
          references: { schema: 'dentistry', table: 'appointments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_encounters',
        foreignKey: {
          name: 'clinical_encounters_treatmentId_fkey',
          columns: ['treatmentId'],
          references: { schema: 'dentistry', table: 'treatments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_files',
        foreignKey: {
          name: 'clinical_files_patientId_fkey',
          columns: ['patientId'],
          references: { schema: 'dentistry', table: 'patients', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_files',
        foreignKey: {
          name: 'clinical_files_clinicalEncounterId_fkey',
          columns: ['clinicalEncounterId'],
          references: { schema: 'dentistry', table: 'clinical_encounters', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_files',
        foreignKey: {
          name: 'clinical_files_treatmentId_fkey',
          columns: ['treatmentId'],
          references: { schema: 'dentistry', table: 'treatments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_files',
        foreignKey: {
          name: 'clinical_files_appointmentId_fkey',
          columns: ['appointmentId'],
          references: { schema: 'dentistry', table: 'appointments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'clinical_histories',
        foreignKey: {
          name: 'clinical_histories_patientId_fkey',
          columns: ['patientId'],
          references: { schema: 'dentistry', table: 'patients', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'payments',
        foreignKey: {
          name: 'payments_patientId_fkey',
          columns: ['patientId'],
          references: { schema: 'dentistry', table: 'patients', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'payments',
        foreignKey: {
          name: 'payments_treatmentId_fkey',
          columns: ['treatmentId'],
          references: { schema: 'dentistry', table: 'treatments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'payments',
        foreignKey: {
          name: 'payments_appointmentId_fkey',
          columns: ['appointmentId'],
          references: { schema: 'dentistry', table: 'appointments', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'payments',
        foreignKey: {
          name: 'payments_clinicalEncounterId_fkey',
          columns: ['clinicalEncounterId'],
          references: { schema: 'dentistry', table: 'clinical_encounters', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'radiographs',
        foreignKey: {
          name: 'radiographs_clinicalFileId_fkey',
          columns: ['clinicalFileId'],
          references: { schema: 'dentistry', table: 'clinical_files', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'treatments',
        foreignKey: {
          name: 'treatments_patientId_fkey',
          columns: ['patientId'],
          references: { schema: 'dentistry', table: 'patients', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'dentistry',
        table: 'treatments',
        foreignKey: {
          name: 'treatments_serviceId_fkey',
          columns: ['serviceId'],
          references: { schema: 'dentistry', table: 'dental_services', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
