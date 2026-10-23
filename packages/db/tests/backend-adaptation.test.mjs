import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  rmdirSync,
} from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isolatedPostgres } from './support/isolated-postgres.mjs';

// Imports of Nest providers validate configuration, but must never use QA's .env.
const keyDirectory = mkdtempSync(join(tmpdir(), 'backend-schema-keys-'));
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const privatePath = join(keyDirectory, 'private.pem'),
  publicPath = join(keyDirectory, 'public.pem');
writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }));
after(() => {
  unlinkSync(privatePath);
  unlinkSync(publicPath);
  rmdirSync(keyDirectory);
});
Object.assign(process.env, {
  NODE_ENV: 'test',
  TZ: 'America/La_Paz',
  DATABASE_URL: 'postgresql://isolated:isolated@127.0.0.1:1/never_connect',
  FRONTEND_URL: 'http://127.0.0.1:3000',
  JWT_ISSUER: 'schema-tests',
  JWT_KEY_ID: 'schema-tests',
  JWT_EXPIRES_IN_SECONDS: '900',
  JWT_PRIVATE_KEY_PATH: privatePath,
  JWT_PUBLIC_KEY_PATH: publicPath,
  JWT_CORE_AUDIENCE: 'core-api',
  JWT_DENTISTRY_AUDIENCE: 'dentistry-api',
  CORE_ADMIN_ORGANIZATION_ID: '00000000-0000-7000-8000-000000000001',
  PORT: '3002',
});

const coreRequire = createRequire(
  new URL('../../../core/backend/package.json', import.meta.url),
);
const dentistryRequire = createRequire(
  new URL('../../../dentistry/backend/package.json', import.meta.url),
);
const { types } = coreRequire('pg');
const { default: postgres } = await import(
  pathToFileURL(coreRequire.resolve('@prisma/orm-postgres/runtime')).href
);
const contract = JSON.parse(
  readFileSync(
    new URL('../src/prisma/generated/contract.json', import.meta.url),
    'utf8',
  ),
);
const { PrismaUserRepository } = await import(
  '../../../core/backend/dist/modules/user/infrastructure/prisma-user.repository.js'
);
const { PrismaPlanRepository } = await import(
  '../../../core/backend/dist/modules/plan/infrastructure/prisma-plan.repository.js'
);
const { PrismaRoleWriter } = await import(
  '../../../core/backend/dist/modules/role/infrastructure/prisma-role.writer.js'
);
const { PrismaPatientRepository } = await import(
  '../../../dentistry/backend/dist/modules/patient/infrastructure/prisma-patient.repository.js'
);
const { Patient } = await import(
  '../../../dentistry/backend/dist/modules/patient/domain/entities/patient.entity.js'
);
const { PrismaDentalServiceRepository } = await import(
  '../../../dentistry/backend/dist/modules/service/infrastructure/prisma-dental-service.repository.js'
);
const { DentalService } = await import(
  '../../../dentistry/backend/dist/modules/service/domain/entities/dental-service.entity.js'
);
const { DentalServiceSupply } = await import(
  '../../../dentistry/backend/dist/modules/service/domain/entities/dental-service-supply.entity.js'
);
const { PrismaAppointmentRepository } = await import(
  '../../../dentistry/backend/dist/modules/appointment/infrastructure/prisma-appointment.repository.js'
);
const { Appointment } = await import(
  '../../../dentistry/backend/dist/modules/appointment/domain/entities/appointment.entity.js'
);
const { PatientResponseDto } = await import(
  '../../../dentistry/backend/dist/modules/patient/presentation/dto/patient.response.dto.js'
);
const { writeAuditLog } = await import(
  '../../../dentistry/backend/dist/common/infrastructure/prisma-audit.writer.js'
);
const { PrismaVerticalAccessPolicy } = await import(
  '../../../core/backend/dist/modules/auth/infrastructure/security/prisma-vertical-access-policy.js'
);

test(
  'backends contra el schema objetivo en PostgreSQL aislado',
  { timeout: 120_000 },
  async (t) => {
    const isolated = await isolatedPostgres(contract, types);
    // Marker verification is disabled ONLY for this fresh fixture without a migration graph.
    const db = postgres({
      contractJson: contract,
      binding: { kind: 'pgClient', client: isolated.client },
      verifyMarker: false,
    });
    const { default: dentistryPostgres } = await import(
      pathToFileURL(dentistryRequire.resolve('@prisma/orm-postgres/runtime'))
        .href
    );
    const dentistryDb = dentistryPostgres({
      contractJson: contract,
      binding: { kind: 'pgClient', client: isolated.client },
      verifyMarker: false,
    });
    try {
      const core = db.orm.core;
      const organization = await core.Organization.create({
        name: 'Clínica de prueba',
        country: 'BO',
        timezone: 'America/La_Paz',
      });
      const branch = await core.Branch.create({
        organizationId: organization.id,
        name: 'Principal',
        country: 'BO',
        timezone: 'America/La_Paz',
      });
      const users = new PrismaUserRepository(db, {
        hash: async () => 'test-only-password-hash',
      });
      let account;
      await t.test(
        'crea usuario, credencial y membresía UUIDv7; login excluye credenciales retiradas',
        async () => {
          account = await users.createUserWithMembership({
            email: 'owner@example.test',
            firstName: 'Ana',
            lastName: 'Pérez',
            password: 'test-only',
            organizationId: organization.id,
            branchIds: [branch.id],
            roleIds: [],
          });
          assert.match(account.user.id, /^[0-9a-f-]{14}7/);
          const record = await users.findAuthRecord(account.user.email);
          assert.equal(record.membershipId, account.membership.id);
          assert.deepEqual(record.branchIds, [branch.id]);
          await core.UserCredential.where({ userId: account.user.id }).update({
            deletedAt: new Date(),
          });
          assert.equal(await users.findAuthRecord(account.user.email), null);
          await core.UserCredential.where({ userId: account.user.id }).update({
            deletedAt: null,
          });
        },
      );
      const actor = account.membership.id;
      await t.test(
        'los conflictos de rol usan las constraints nuevas y conservan el borrado lógico',
        async () => {
          const writer = new PrismaRoleWriter(db);
          const input = {
            organizationId: organization.id,
            name: 'Odontólogo',
            code: 'DENTIST',
            description: null,
          };
          const role = await writer.create(input);
          assert.equal(role.deleted, false);
          await assert.rejects(
            writer.create(input),
            (error) => error.name === 'RoleCodeAlreadyExistsError',
          );
        },
      );
      const plans = new PrismaPlanRepository(db);
      await t.test(
        'crea plan, captura snapshot y conserva acceso tras retirar el catálogo',
        async () => {
          const plan = await plans.create({
            code: 'BASE',
            name: 'Base',
            type: 'PUBLIC',
            description: null,
            vertical: 'DENTISTRY',
            durationDays: 30,
            entitlements: { limits: { patients: 300 } },
            priceMinor: null,
            currency: null,
            isActive: true,
          });
          const grant = await plans.assign({
            organizationId: organization.id,
            planId: plan.id,
            vertical: 'DENTISTRY',
            startsAt: new Date(),
            status: 'ACTIVE',
          });
          assert.equal(grant.entitlementsSnapshot.schemaVersion, 1);
          await plans.update(plan.id, {
            entitlements: { limits: { patients: 900 } },
            isActive: false,
          });
          assert.equal(
            (await plans.listAssignments(organization.id))[0]
              .entitlementsSnapshot.limits.patients,
            300,
          );
          assert.equal(
            await new PrismaVerticalAccessPolicy(db).canAccessDentistry(
              organization.id,
              new Date(),
            ),
            true,
          );
        },
      );
      const patients = new PrismaPatientRepository(dentistryDb);
      let patient;
      await t.test(
        'paciente conserva DATE en TZ America/La_Paz y usa solo deletedAt',
        async () => {
          patient = await patients.create(
            new Patient({
              organizationId: organization.id,
              firstName: 'Paciente',
              lastName: 'Uno',
              createdByMembershipId: actor,
              birthDate: new Date('2000-02-29T00:00:00Z'),
              documentType: 'CI',
              documentNumber: '123',
            }),
          );
          assert.equal(
            PatientResponseDto.fromEntity(patient).birthDate,
            '2000-02-29',
          );
          await assert.rejects(
            patients.create(
              new Patient({
                organizationId: organization.id,
                firstName: 'Duplicado',
                lastName: 'Uno',
                createdByMembershipId: actor,
                documentType: 'CI',
                documentNumber: '123',
              }),
            ),
            (error) => error.getStatus?.() === 409,
          );
          assert.equal(
            (await patients.findByFilters({ organizationId: organization.id }))
              .length,
            1,
          );
          const other = await patients.create(
            new Patient({
              organizationId: organization.id,
              firstName: 'Paciente',
              lastName: 'Retirado',
              createdByMembershipId: actor,
            }),
          );
          other.softDelete(actor);
          await patients.update(other);
          assert.equal(
            await patients.findById(other.id, organization.id),
            null,
          );
          assert.equal(
            (await patients.findByFilters({ organizationId: organization.id }))
              .length,
            1,
          );
        },
      );
      const services = new PrismaDentalServiceRepository(dentistryDb);
      let service, secondService;
      await t.test(
        'servicios e insumos persisten sin inventoryItemId y revierten altas parciales',
        async () => {
          const input = {
            organizationId: organization.id,
            name: 'Limpieza',
            createdByMembershipId: actor,
          };
          service = await services.create(
            new DentalService({
              ...input,
              supplies: [
                new DentalServiceSupply({
                  organizationId: organization.id,
                  name: 'Guantes',
                }),
              ],
            }),
          );
          assert.equal(
            (await services.findById(service.id, organization.id)).supplies
              .length,
            1,
          );
          const count = (await dentistryDb.orm.dentistry.DentalService.all())
            .length;
          await assert.rejects(
            services.create(
              new DentalService({
                ...input,
                name: 'Revertido',
                supplies: [
                  new DentalServiceSupply({
                    organizationId: organization.id,
                    name: 'Inválido',
                    estimatedCostMinor: -1,
                  }),
                ],
              }),
            ),
          );
          assert.equal(
            (await dentistryDb.orm.dentistry.DentalService.all()).length,
            count,
          );
          const previousName = service.name;
          service.updateDetails({
            name: 'Cambio revertido',
            updatedByMembershipId: actor,
            supplies: [
              new DentalServiceSupply({
                organizationId: organization.id,
                name: 'Inválido',
                estimatedCostMinor: -1,
              }),
            ],
          });
          await assert.rejects(services.update(service));
          service = await services.findById(service.id, organization.id);
          assert.equal(service.name, previousName);
          assert.equal(service.supplies[0].name, 'Guantes');
          secondService = await services.create(
            new DentalService({ ...input, name: 'Revisión' }),
          );
        },
      );
      const appointments = new PrismaAppointmentRepository(dentistryDb);
      const appointmentInput = {
        organizationId: organization.id,
        branchId: branch.id,
        patientId: patient.id,
        practitionerMembershipId: actor,
        createdByMembershipId: actor,
        scheduledStartAt: new Date('2026-10-22T14:00:00Z'),
        scheduledEndAt: new Date('2026-10-22T15:00:00Z'),
      };
      let appointment;
      await t.test(
        'citas con cero/varios servicios y rollback si falla una asociación',
        async () => {
          const empty = await appointments.create(
            new Appointment(appointmentInput),
          );
          assert.deepEqual(
            (await appointments.findById(empty.id, organization.id)).serviceIds,
            [],
          );
          appointment = await appointments.create(
            new Appointment({
              ...appointmentInput,
              serviceIds: [service.id, secondService.id, service.id],
            }),
          );
          assert.deepEqual(appointment.serviceIds, [
            service.id,
            secondService.id,
          ]);
          assert.deepEqual(
            (await appointments.findById(appointment.id, organization.id))
              .serviceIds,
            appointment.serviceIds,
          );
          assert.equal(
            await appointments.referencesBelongToOrganization({
              organizationId: organization.id,
              patientId: patient.id,
              serviceIds: appointment.serviceIds,
            }),
            true,
          );
          const before = (await dentistryDb.orm.dentistry.Appointment.all())
            .length;
          await assert.rejects(
            appointments.create(
              new Appointment({
                ...appointmentInput,
                serviceIds: [
                  service.id,
                  '00000000-0000-7000-8000-000000000001',
                ],
              }),
            ),
          );
          assert.equal(
            (await dentistryDb.orm.dentistry.Appointment.all()).length,
            before,
          );
          assert.equal(
            (await dentistryDb.orm.dentistry.AppointmentService.all()).length,
            2,
          );
        },
      );
      await t.test(
        'una edición concurrente no sobrescribe la cancelación ni pierde autor',
        async () => {
          const stale = await appointments.findById(
            appointment.id,
            organization.id,
          );
          appointment.cancel(actor, 'Reprogramar');
          appointment.updatedByMembershipId = actor;
          const updated = await appointments.update(
            appointment,
            organization.id,
          );
          assert.equal(updated.rowVersion, 2);
          assert.equal(updated.updatedByMembershipId, actor);
          stale.confirm();
          await assert.rejects(
            appointments.update(stale, organization.id),
            (error) => error.getStatus?.() === 409,
          );
          assert.equal(
            (await appointments.findById(appointment.id, organization.id))
              .status,
            'CANCELED',
          );
        },
      );
      await t.test(
        'el retiro de un servicio referenciado conserva sus insumos',
        async () => {
          await assert.rejects(
            services.delete(service.id, organization.id),
            (error) => error.getStatus?.() === 409,
          );
          assert.equal(
            (await services.findById(service.id, organization.id)).supplies
              .length,
            1,
          );
        },
      );
      await t.test(
        'auditoría Dentistry conserva metadata y actorMembershipId',
        async () => {
          await dentistryDb.transaction((tx) =>
            writeAuditLog(tx, {
              organizationId: organization.id,
              userId: account.user.id,
              actorMembershipId: actor,
              action: 'TEST',
              resource: 'Patient',
              resourceId: patient.id,
              metadata: { fields: ['phone'] },
            }),
          );
          const audit = await core.AuditLog.first({ action: 'TEST' });
          assert.equal(audit.actorMembershipId, actor);
          assert.deepEqual(audit.metadata, { fields: ['phone'] });
        },
      );
    } finally {
      await dentistryDb.close();
      await db.close();
      await isolated.close();
    }
  },
);
