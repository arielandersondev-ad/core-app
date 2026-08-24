import { defineContract } from '@prisma/orm-postgres/contract-builder';

const NAMESPACE = 'dentistry' as const;

/**
 * Vertical odontología.
 *
 * IMPORTANTE:
 * - organizationId, branchId y los *MembershipId pertenecen al Core.
 * - Deliberadamente NO se crean FKs hacia tablas del Core.
 * - Las FKs de este contrato solo existen entre entidades propiedad de odontología.
 * - El Core/API debe validar que organization/branch/membership sean válidos
 *   y pertenezcan al tenant activo.
 */
export const contract = defineContract(
  {
    namespaces: [NAMESPACE],
  },
  ({ field, model, rel }) => {
    // =========================================================
    // PATIENT
    // =========================================================

    const Patient = model('Patient', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External reference -> Core.Organization.id
        organizationId: field.uuidString(),

        firstName: field.text(),
        lastName: field.text(),

        phone: field.text().optional(),
        email: field.text().optional(),
        birthDate: field.temporal.timestamp().optional(),
        sex: field.text().optional(),

        documentType: field.text().optional(),
        documentNumber: field.text().optional(),

        address: field.text().optional(),
        notes: field.text().optional(),

        status: field.text().default('ACTIVE'),

        // External references -> Core.Membership.id
        createdByMembershipId: field.uuidString(),
        updatedByMembershipId: field.uuidString().optional(),

        deleted: field.boolean().default(false),
        deletedAt: field.temporal.timestamp().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // CLINICAL HISTORY
    // =========================================================

    const ClinicalHistory = model('ClinicalHistory', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External reference -> Core.Organization.id
        organizationId: field.uuidString(),

        // One clinical history per patient.
        patientId: field.uuidString().unique(),

        medicalHistory: field.text().optional(),
        allergies: field.text().optional(),
        currentMedications: field.text().optional(),
        dentalHistory: field.text().optional(),
        relevantConditions: field.text().optional(),
        observations: field.text().optional(),

        // External references -> Core.Membership.id
        createdByMembershipId: field.uuidString(),
        updatedByMembershipId: field.uuidString().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // DENTAL SERVICE
    // =========================================================

    const DentalService = model('DentalService', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External reference -> Core.Organization.id
        organizationId: field.uuidString(),

        code: field.text().optional(),
        name: field.text(),
        description: field.text().optional(),

        durationMinutes: field.int().optional(),

        // Money is stored in minor units (e.g. 15050 = 150.50).
        basePriceMinor: field.int().optional(),
        currency: field.text().optional(),

        active: field.boolean().default(true),

        // External references -> Core.Membership.id
        createdByMembershipId: field.uuidString(),
        updatedByMembershipId: field.uuidString().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // TREATMENT
    // =========================================================

    const Treatment = model('Treatment', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External reference -> Core.Organization.id
        organizationId: field.uuidString(),

        patientId: field.uuidString(),
        serviceId: field.uuidString(),

        // External reference -> Core.Membership.id
        responsibleMembershipId: field.uuidString().optional(),

        status: field.text().default('ACTIVE'),

        startedAt: field.temporal.timestamp(),
        endedAt: field.temporal.timestamp().optional(),

        estimatedSessions: field.int().optional(),

        agreedPriceMinor: field.int().optional(),
        currency: field.text().optional(),

        diagnosis: field.text().optional(),
        notes: field.text().optional(),

        // External references -> Core.Membership.id
        createdByMembershipId: field.uuidString(),
        updatedByMembershipId: field.uuidString().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // APPOINTMENT
    // =========================================================

    const Appointment = model('Appointment', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External references -> Core
        organizationId: field.uuidString(),
        branchId: field.uuidString(),

        patientId: field.uuidString(),

        // External reference -> Core.Membership.id
        professionalMembershipId: field.uuidString(),

        serviceId: field.uuidString(),
        treatmentId: field.uuidString().optional(),

        startsAt: field.temporal.timestamp(),
        endsAt: field.temporal.timestamp(),

        status: field.text().default('SCHEDULED'),

        reason: field.text().optional(),
        notes: field.text().optional(),

        // External reference -> Core.Membership.id
        createdByMembershipId: field.uuidString(),

        cancelledAt: field.temporal.timestamp().optional(),

        // External reference -> Core.Membership.id
        cancelledByMembershipId: field.uuidString().optional(),

        cancellationReason: field.text().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // CLINICAL ENCOUNTER
    // =========================================================

    const ClinicalEncounter = model('ClinicalEncounter', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External references -> Core
        organizationId: field.uuidString(),
        branchId: field.uuidString(),

        patientId: field.uuidString(),

        // A completed appointment can produce at most one encounter.
        appointmentId: field.uuidString().optional().unique(),

        treatmentId: field.uuidString().optional(),

        // External reference -> Core.Membership.id
        professionalMembershipId: field.uuidString(),

        startedAt: field.temporal.timestamp(),
        endedAt: field.temporal.timestamp().optional(),

        chiefComplaint: field.text().optional(),
        diagnosis: field.text().optional(),
        procedurePerformed: field.text().optional(),
        evolution: field.text().optional(),
        recommendations: field.text().optional(),
        notes: field.text().optional(),

        // External references -> Core.Membership.id
        createdByMembershipId: field.uuidString(),
        updatedByMembershipId: field.uuidString().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // PAYMENT
    // =========================================================

    const Payment = model('Payment', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External references -> Core
        organizationId: field.uuidString(),
        branchId: field.uuidString(),

        patientId: field.uuidString(),

        treatmentId: field.uuidString().optional(),
        appointmentId: field.uuidString().optional(),
        clinicalEncounterId: field.uuidString().optional(),

        // Money is stored in minor units.
        amountMinor: field.int(),
        currency: field.text(),

        paymentMethod: field.text(),
        status: field.text().default('COMPLETED'),

        reference: field.text().optional(),
        notes: field.text().optional(),

        paidAt: field.temporal.timestamp(),

        // External reference -> Core.Membership.id
        receivedByMembershipId: field.uuidString(),

        voidedAt: field.temporal.timestamp().optional(),

        // External reference -> Core.Membership.id
        voidedByMembershipId: field.uuidString().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // CLINICAL FILE
    // =========================================================

    const ClinicalFile = model('ClinicalFile', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External reference -> Core.Organization.id
        organizationId: field.uuidString(),

        patientId: field.uuidString(),

        clinicalEncounterId: field.uuidString().optional(),
        treatmentId: field.uuidString().optional(),
        appointmentId: field.uuidString().optional(),

        // RADIOGRAPH | PHOTO | DOCUMENT | OTHER
        category: field.text(),

        // e.g. S3 | R2 | MINIO | GCS | AZURE_BLOB
        storageProvider: field.text(),

        bucket: field.text(),
        objectKey: field.text(),

        originalFilename: field.text(),
        mimeType: field.text(),
        sizeBytes: field.int(),

        checksumSha256: field.text().optional(),

        capturedAt: field.temporal.timestamp().optional(),
        description: field.text().optional(),

        // External reference -> Core.Membership.id
        uploadedByMembershipId: field.uuidString(),

        deleted: field.boolean().default(false),
        deletedAt: field.temporal.timestamp().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // RADIOGRAPH
    // =========================================================

    const Radiograph = model('Radiograph', {
      namespace: NAMESPACE,

      fields: {
        id: field.id.uuidv7String(),

        // External reference -> Core.Organization.id
        organizationId: field.uuidString(),

        // One radiograph metadata record per clinical file.
        clinicalFileId: field.uuidString().unique(),

        // PANORAMIC | PERIAPICAL | BITEWING | OCCLUSAL |
        // CEPHALOMETRIC | CBCT | OTHER
        radiographType: field.text(),

        // String on purpose: supports dental notation without assuming
        // a numeric-only representation.
        toothNumber: field.text().optional(),
        region: field.text().optional(),

        // LEFT | RIGHT | BILATERAL, when applicable.
        laterality: field.text().optional(),

        takenAt: field.temporal.timestamp().optional(),
        notes: field.text().optional(),

        createdAt: field.temporal.createdAt(),
        updatedAt: field.temporal.updatedAt(),
      },
    });

    // =========================================================
    // RELATIONS + SQL STORAGE
    // =========================================================

    return {
      models: {
        Patient: Patient.relations({
          clinicalHistory: rel.hasOne(ClinicalHistory, {
            by: 'patientId',
          }),

          treatments: rel.hasMany(Treatment, {
            by: 'patientId',
          }),

          appointments: rel.hasMany(Appointment, {
            by: 'patientId',
          }),

          clinicalEncounters: rel.hasMany(ClinicalEncounter, {
            by: 'patientId',
          }),

          payments: rel.hasMany(Payment, {
            by: 'patientId',
          }),

          clinicalFiles: rel.hasMany(ClinicalFile, {
            by: 'patientId',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'patients',

          indexes: [
            constraints.index(
              [cols.organizationId],
              { name: 'pat_org_idx' },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.lastName,
                cols.firstName,
              ],
              { name: 'pat_org_name_idx' },
            ),
            constraints.index(
              [cols.organizationId, cols.phone],
              { name: 'pat_org_phone_idx' },
            ),
          ],
        })),

        ClinicalHistory: ClinicalHistory.relations({
          patient: rel.belongsTo(Patient, {
            from: 'patientId',
            to: 'id',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'clinical_histories',

          foreignKeys: [
            constraints.foreignKey(cols.patientId, Patient.refs.id),
          ],

          indexes: [
            constraints.index(
              [cols.organizationId],
              { name: 'ch_org_idx' },
            ),
          ],
        })),

        DentalService: DentalService.relations({
          treatments: rel.hasMany(Treatment, {
            by: 'serviceId',
          }),

          appointments: rel.hasMany(Appointment, {
            by: 'serviceId',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'dental_services',

          indexes: [
            constraints.index(
              [cols.organizationId, cols.active],
              { name: 'svc_org_active_idx' },
            ),

            // Allows code reuse across organizations, but not duplicates
            // inside the same organization. PostgreSQL still permits
            // multiple NULL values for code.
            constraints.index(
              [cols.organizationId, cols.code],
              {
                name: 'svc_org_code_uidx',
                unique: true,
              },
            ),
          ],
        })),

        Treatment: Treatment.relations({
          patient: rel.belongsTo(Patient, {
            from: 'patientId',
            to: 'id',
          }),

          service: rel.belongsTo(DentalService, {
            from: 'serviceId',
            to: 'id',
          }),

          appointments: rel.hasMany(Appointment, {
            by: 'treatmentId',
          }),

          clinicalEncounters: rel.hasMany(ClinicalEncounter, {
            by: 'treatmentId',
          }),

          payments: rel.hasMany(Payment, {
            by: 'treatmentId',
          }),

          clinicalFiles: rel.hasMany(ClinicalFile, {
            by: 'treatmentId',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'treatments',

          foreignKeys: [
            constraints.foreignKey(cols.patientId, Patient.refs.id),
            constraints.foreignKey(cols.serviceId, DentalService.refs.id),
          ],

          indexes: [
            constraints.index(
              [cols.organizationId, cols.patientId],
              { name: 'trt_org_patient_idx' },
            ),
            constraints.index(
              [cols.organizationId, cols.status],
              { name: 'trt_org_status_idx' },
            ),
          ],
        })),

        Appointment: Appointment.relations({
          patient: rel.belongsTo(Patient, {
            from: 'patientId',
            to: 'id',
          }),

          service: rel.belongsTo(DentalService, {
            from: 'serviceId',
            to: 'id',
          }),

          treatment: rel.belongsTo(Treatment, {
            from: 'treatmentId',
            to: 'id',
          }),

          clinicalEncounter: rel.hasOne(ClinicalEncounter, {
            by: 'appointmentId',
          }),

          payments: rel.hasMany(Payment, {
            by: 'appointmentId',
          }),

          clinicalFiles: rel.hasMany(ClinicalFile, {
            by: 'appointmentId',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'appointments',

          foreignKeys: [
            constraints.foreignKey(cols.patientId, Patient.refs.id),
            constraints.foreignKey(cols.serviceId, DentalService.refs.id),
            constraints.foreignKey(cols.treatmentId, Treatment.refs.id),
          ],

          indexes: [
            constraints.index(
              [cols.organizationId, cols.startsAt],
              { name: 'appt_org_start_idx' },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.branchId,
                cols.startsAt,
              ],
              { name: 'appt_org_branch_start_idx' },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.professionalMembershipId,
                cols.startsAt,
              ],
              { name: 'appt_org_prof_start_idx' },
            ),
            constraints.index(
              [cols.patientId, cols.startsAt],
              { name: 'appt_patient_start_idx' },
            ),
          ],
        })),

        ClinicalEncounter: ClinicalEncounter.relations({
          patient: rel.belongsTo(Patient, {
            from: 'patientId',
            to: 'id',
          }),

          appointment: rel.belongsTo(Appointment, {
            from: 'appointmentId',
            to: 'id',
          }),

          treatment: rel.belongsTo(Treatment, {
            from: 'treatmentId',
            to: 'id',
          }),

          payments: rel.hasMany(Payment, {
            by: 'clinicalEncounterId',
          }),

          clinicalFiles: rel.hasMany(ClinicalFile, {
            by: 'clinicalEncounterId',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'clinical_encounters',

          foreignKeys: [
            constraints.foreignKey(cols.patientId, Patient.refs.id),
            constraints.foreignKey(cols.appointmentId, Appointment.refs.id),
            constraints.foreignKey(cols.treatmentId, Treatment.refs.id),
          ],

          indexes: [
            constraints.index(
              [
                cols.organizationId,
                cols.patientId,
                cols.startedAt,
              ],
              { name: 'enc_org_patient_start_idx' },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.professionalMembershipId,
                cols.startedAt,
              ],
              { name: 'enc_org_prof_start_idx' },
            ),
          ],
        })),

        Payment: Payment.relations({
          patient: rel.belongsTo(Patient, {
            from: 'patientId',
            to: 'id',
          }),

          treatment: rel.belongsTo(Treatment, {
            from: 'treatmentId',
            to: 'id',
          }),

          appointment: rel.belongsTo(Appointment, {
            from: 'appointmentId',
            to: 'id',
          }),

          clinicalEncounter: rel.belongsTo(ClinicalEncounter, {
            from: 'clinicalEncounterId',
            to: 'id',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'payments',

          foreignKeys: [
            constraints.foreignKey(cols.patientId, Patient.refs.id),
            constraints.foreignKey(cols.treatmentId, Treatment.refs.id),
            constraints.foreignKey(cols.appointmentId, Appointment.refs.id),
            constraints.foreignKey(
              cols.clinicalEncounterId,
              ClinicalEncounter.refs.id,
            ),
          ],

          indexes: [
            constraints.index(
              [cols.organizationId, cols.paidAt],
              { name: 'pay_org_paid_idx' },
            ),
            constraints.index(
              [
                cols.organizationId,
                cols.branchId,
                cols.paidAt,
              ],
              { name: 'pay_org_branch_paid_idx' },
            ),
            constraints.index(
              [cols.patientId, cols.paidAt],
              { name: 'pay_patient_paid_idx' },
            ),
          ],
        })),

        ClinicalFile: ClinicalFile.relations({
          patient: rel.belongsTo(Patient, {
            from: 'patientId',
            to: 'id',
          }),

          clinicalEncounter: rel.belongsTo(ClinicalEncounter, {
            from: 'clinicalEncounterId',
            to: 'id',
          }),

          treatment: rel.belongsTo(Treatment, {
            from: 'treatmentId',
            to: 'id',
          }),

          appointment: rel.belongsTo(Appointment, {
            from: 'appointmentId',
            to: 'id',
          }),

          radiograph: rel.hasOne(Radiograph, {
            by: 'clinicalFileId',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'clinical_files',

          foreignKeys: [
            constraints.foreignKey(cols.patientId, Patient.refs.id),
            constraints.foreignKey(
              cols.clinicalEncounterId,
              ClinicalEncounter.refs.id,
            ),
            constraints.foreignKey(cols.treatmentId, Treatment.refs.id),
            constraints.foreignKey(cols.appointmentId, Appointment.refs.id),
          ],

          indexes: [
            constraints.index(
              [cols.organizationId, cols.patientId],
              { name: 'cf_org_patient_idx' },
            ),
            constraints.index(
              [cols.clinicalEncounterId],
              { name: 'cf_encounter_idx' },
            ),

            // Object location must be unique inside a bucket.
            constraints.index(
              [cols.bucket, cols.objectKey],
              {
                name: 'cf_bucket_object_uidx',
                unique: true,
              },
            ),
          ],
        })),

        Radiograph: Radiograph.relations({
          clinicalFile: rel.belongsTo(ClinicalFile, {
            from: 'clinicalFileId',
            to: 'id',
          }),
        }).sql(({ cols, constraints }) => ({
          table: 'radiographs',

          foreignKeys: [
            constraints.foreignKey(
              cols.clinicalFileId,
              ClinicalFile.refs.id,
            ),
          ],

          indexes: [
            constraints.index(
              [cols.organizationId, cols.takenAt],
              { name: 'rad_org_taken_idx' },
            ),
          ],
        })),
      },
    };
  },
);
