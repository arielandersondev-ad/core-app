import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SignJWT } from 'jose';

// Generar par de llaves RSA para tokens en memoria
const directory = mkdtempSync(join(tmpdir(), 'dentistry-e2e-test-'));
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKeyPath = join(directory, 'public.pem');
writeFileSync(publicKeyPath, publicKey.export({ type: 'spki', format: 'pem' }));
process.env.JWT_PUBLIC_KEY_PATH = publicKeyPath;
process.env.JWT_ISSUER = 'core-auth';
process.env.JWT_DENTISTRY_AUDIENCE = 'dentistry-api';
after(() => rmSync(directory, { recursive: true, force: true }));

const { DentistryTokenVerifier } = await import(
  '../dist/modules/auth/infrastructure/jwt/dentistry-token.verifier.js'
);
const { AppointmentController } = await import(
  '../dist/modules/appointment/presentation/http/appointment.controller.js'
);
const { CreateAppointmentUseCase } = await import(
  '../dist/modules/appointment/application/use-case/create-appointment.use-case.js'
);
const { ListAppointmentsUseCase } = await import(
  '../dist/modules/appointment/application/use-case/list-appointments.use-case.js'
);
const { GetAppointmentByIdUseCase } = await import(
  '../dist/modules/appointment/application/use-case/get-appointment-by-id.use-case.js'
);
const { CancelAppointmentUseCase } = await import(
  '../dist/modules/appointment/application/use-case/cancel-appointment.use-case.js'
);
const { UpdateAppointmentStatusUseCase } = await import(
  '../dist/modules/appointment/application/use-case/update-appointment-status.use-case.js'
);
const { PrismaAppointmentRepository } = await import(
  '../dist/modules/appointment/infrastructure/prisma-appointment.repository.js'
);
const { PersonController } = await import(
  '../dist/modules/person/presentation/http/person.controller.js'
);
const { CreatePersonUseCase } = await import(
  '../dist/modules/person/application/use-case/create-person.use-case.js'
);
const { ListPersonsUseCase } = await import(
  '../dist/modules/person/application/use-case/list-persons.use-case.js'
);
const { GetPersonByIdUseCase } = await import(
  '../dist/modules/person/application/use-case/get-person-by-id.use-case.js'
);
const { ConvertPersonToPatientUseCase } = await import(
  '../dist/modules/person/application/use-case/convert-person-to-patient.use-case.js'
);
const { PrismaPersonRepository } = await import(
  '../dist/modules/person/infrastructure/prisma-person.repository.js'
);

// ============================================================================
// SIMULADOR DE BASE DE DATOS MULTI-TENANT EN MEMORIA
// ============================================================================

function createInMemoryDatabase() {
  const db = {
    patients: new Map(),
    persons: new Map(),
    services: new Map(),
    treatments: new Map(),
    appointments: new Map(),
    appointmentServices: new Map(),
  };

  const prismaMock = {
    orm: {
      dentistry: {
        Patient: {
          first: async (filter) => {
            for (const p of db.patients.values()) {
              if (filter.id && p.id !== filter.id) continue;
              if (filter.organizationId && p.organizationId !== filter.organizationId) continue;
              if (filter.deletedAt === null && p.deletedAt !== null) continue;
              if (filter.documentType && p.documentType !== filter.documentType) continue;
              if (filter.documentNumber && p.documentNumber !== filter.documentNumber) continue;
              return p;
            }
            return null;
          },
          create: async (data) => {
            const row = {
              id: randomUUID(),
              ...data,
              deletedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            db.patients.set(row.id, row);
            return row;
          },
        },
        Person: {
          first: async (filter) => {
            for (const p of db.persons.values()) {
              if (filter.id && p.id !== filter.id) continue;
              if (filter.organizationId && p.organizationId !== filter.organizationId) continue;
              if (filter.deletedAt === null && p.deletedAt !== null) continue;
              return p;
            }
            return null;
          },
          where: (filter) => ({
            all: async () => {
              const res = [];
              for (const p of db.persons.values()) {
                if (filter.organizationId && p.organizationId !== filter.organizationId) continue;
                if (p.deletedAt !== null) continue;
                res.push(p);
              }
              return res;
            },
            update: async (data) => {
              for (const [id, p] of db.persons.entries()) {
                if (filter.id && p.id !== filter.id) continue;
                if (filter.organizationId && p.organizationId !== filter.organizationId) continue;
                const updated = { ...p, ...data, updatedAt: new Date() };
                db.persons.set(id, updated);
                return updated;
              }
              return null;
            },
          }),
          create: async (data) => {
            const row = {
              id: randomUUID(),
              ...data,
              convertedToPatientId: null,
              convertedAt: null,
              deletedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            db.persons.set(row.id, row);
            return row;
          },
        },
        DentalService: {
          first: async (filter) => {
            for (const s of db.services.values()) {
              if (filter.id && s.id !== filter.id) continue;
              if (filter.organizationId && s.organizationId !== filter.organizationId) continue;
              if (filter.isActive !== undefined && s.isActive !== filter.isActive) continue;
              return s;
            }
            return null;
          },
        },
        Treatment: {
          first: async (filter) => {
            for (const t of db.treatments.values()) {
              if (filter.id && t.id !== filter.id) continue;
              if (filter.organizationId && t.organizationId !== filter.organizationId) continue;
              if (filter.patientId && t.patientId !== filter.patientId) continue;
              return t;
            }
            return null;
          },
        },
        Appointment: {
          first: async (filter) => {
            for (const a of db.appointments.values()) {
              if (filter.id && a.id !== filter.id) continue;
              if (filter.organizationId && a.organizationId !== filter.organizationId) continue;
              return a;
            }
            return null;
          },
          where: (filter) => ({
            all: async () => {
              const res = [];
              for (const a of db.appointments.values()) {
                if (filter.organizationId && a.organizationId !== filter.organizationId) continue;
                if (filter.practitionerMembershipId && a.practitionerMembershipId !== filter.practitionerMembershipId) continue;
                if (filter.personId && a.personId !== filter.personId) continue;
                res.push(a);
              }
              return res;
            },
            update: async (data) => {
              let updatedCount = 0;
              for (const [id, a] of db.appointments.entries()) {
                if (filter.id && a.id !== filter.id) continue;
                if (filter.organizationId && a.organizationId !== filter.organizationId) continue;
                if (filter.personId && a.personId !== filter.personId) continue;
                if (filter.rowVersion && a.rowVersion !== filter.rowVersion) continue;
                const updated = { ...a, ...data, updatedAt: new Date() };
                db.appointments.set(id, updated);
                updatedCount++;
                if (filter.id) return updated;
              }
              return updatedCount > 0 ? {} : null;
            },
          }),
          create: async (data) => {
            const row = {
              id: randomUUID(),
              ...data,
              rowVersion: 1,
              canceledAt: null,
              canceledByMembershipId: null,
              cancellationReason: null,
              updatedByMembershipId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            db.appointments.set(row.id, row);
            return row;
          },
        },
        AppointmentService: {
          where: (filter) => ({
            all: async () => {
              const res = [];
              for (const s of db.appointmentServices.values()) {
                if (filter.organizationId && s.organizationId !== filter.organizationId) continue;
                if (filter.appointmentId && s.appointmentId !== filter.appointmentId) continue;
                res.push(s);
              }
              return res;
            },
          }),
          create: async (data) => {
            const row = {
              id: randomUUID(),
              ...data,
              priceMinor: null,
              currency: null,
              durationMinutes: null,
              notes: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            db.appointmentServices.set(row.id, row);
            return row;
          },
        },
      },
    },
    transaction: async (fn) => fn(prismaMock),
  };

  return { db, prisma: prismaMock };
}

async function createDentistryJwt(principal, lifetime = 1800) {
  return new SignJWT(principal)
    .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: 'test-key' })
    .setSubject(principal.membershipId)
    .setJti(randomUUID())
    .setIssuer('core-auth')
    .setAudience('dentistry-api')
    .setIssuedAt()
    .setExpirationTime(`${lifetime}s`)
    .sign(privateKey);
}

// ============================================================================
// SUITE E2E: FLUJO COMPLETO DE AGENDAMIENTO, RECEPCIÓN Y MANEJO DE ERRORES
// ============================================================================

test('E2E Flujo 1: Agendamiento exitoso de Paciente Registrado con servicios, detección de solapamiento y cancelación', async () => {
  const { db, prisma } = createInMemoryDatabase();
  const orgId = randomUUID();
  const branchA = randomUUID();
  const dentistMembershipId = randomUUID();

  // Sembrar datos iniciales en la clínica
  const patientRow = {
    id: randomUUID(),
    organizationId: orgId,
    firstName: 'Ana',
    lastName: 'Gómez',
    deletedAt: null,
  };
  db.patients.set(patientRow.id, patientRow);

  const serviceCleaning = {
    id: randomUUID(),
    organizationId: orgId,
    name: 'Limpieza Dental',
    isActive: true,
  };
  const serviceFluor = {
    id: randomUUID(),
    organizationId: orgId,
    name: 'Fluorización Tópica',
    isActive: true,
  };
  db.services.set(serviceCleaning.id, serviceCleaning);
  db.services.set(serviceFluor.id, serviceFluor);

  // Armar arquitectura de la aplicación
  const appointmentRepo = new PrismaAppointmentRepository(prisma);
  const createAppointmentUseCase = new CreateAppointmentUseCase(appointmentRepo);
  const getAppointmentByIdUseCase = new GetAppointmentByIdUseCase(appointmentRepo);
  const cancelAppointmentUseCase = new CancelAppointmentUseCase(appointmentRepo);
  const listAppointmentsUseCase = new ListAppointmentsUseCase(appointmentRepo);
  const updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase(appointmentRepo);

  const controller = new AppointmentController(
    createAppointmentUseCase,
    listAppointmentsUseCase,
    getAppointmentByIdUseCase,
    updateAppointmentStatusUseCase,
    cancelAppointmentUseCase,
  );

  // 1. Emisión y validación de token JWT del odontólogo
  const rawPrincipal = {
    membershipId: dentistMembershipId,
    organizationId: orgId,
    branchIds: [branchA],
    permissions: [
      'dentistry:appointments:create',
      'dentistry:appointments:read',
      'dentistry:appointments:cancel',
    ],
  };
  const jwt = await createDentistryJwt(rawPrincipal);
  const verifier = new DentistryTokenVerifier();
  const principal = await verifier.verify(jwt);
  assert.equal(principal.organizationId, orgId);

  // 2. Agendamiento de la cita: 2026-11-05 de 10:00 a 10:45 UTC
  const startAt = '2026-11-05T10:00:00.000Z';
  const endAt = '2026-11-05T10:45:00.000Z';
  const createdAppt = await controller.create(principal, {
    branchId: branchA,
    patientId: patientRow.id,
    practitionerMembershipId: dentistMembershipId,
    serviceIds: [serviceCleaning.id, serviceFluor.id],
    scheduledStartAt: startAt,
    scheduledEndAt: endAt,
    reason: 'Control anual y profilaxis',
    notes: 'Confirmado por recepción',
  });

  assert.ok(createdAppt.id);
  assert.equal(createdAppt.status, 'SCHEDULED');
  assert.equal(createdAppt.patientId, patientRow.id);
  assert.equal(createdAppt.personId, null);
  assert.deepEqual(
    [...createdAppt.serviceIds].sort(),
    [serviceCleaning.id, serviceFluor.id].sort(),
  );

  // 3. Consultar cita por ID y verificar integridad de datos
  const fetched = await controller.getById(principal, createdAppt.id);
  assert.equal(fetched.id, createdAppt.id);
  assert.equal(fetched.reason, 'Control anual y profilaxis');
  assert.equal(fetched.services.length, 2);

  // 4. Intento de agendar segunda cita solapada (10:30 a 11:15) -> debe fallar con 409
  await assert.rejects(
    controller.create(principal, {
      branchId: branchA,
      patientId: patientRow.id,
      practitionerMembershipId: dentistMembershipId,
      serviceIds: [serviceCleaning.id],
      scheduledStartAt: '2026-11-05T10:30:00.000Z',
      scheduledEndAt: '2026-11-05T11:15:00.000Z',
    }),
    {
      status: 409,
      message: 'El profesional ya cuenta con una cita programada en ese rango de horario.',
    },
  );

  // 5. El paciente avisa que no puede asistir y se cancela la cita
  const canceled = await controller.cancel(principal, createdAppt.id, {
    reason: 'Paciente tuvo una urgencia laboral',
  });
  assert.equal(canceled.status, 'CANCELED');
  assert.equal(canceled.cancellationReason, 'Paciente tuvo una urgencia laboral');
  assert.equal(canceled.canceledByMembershipId, dentistMembershipId);

  // 6. Ahora que la cita anterior está cancelada, el horario queda libre:
  // Se intenta agendar la segunda cita en el mismo rango liberado -> ÉXITO
  const replacementAppt = await controller.create(principal, {
    branchId: branchA,
    patientId: patientRow.id,
    practitionerMembershipId: dentistMembershipId,
    serviceIds: [serviceCleaning.id],
    scheduledStartAt: '2026-11-05T10:00:00.000Z',
    scheduledEndAt: '2026-11-05T10:30:00.000Z',
    reason: 'Cita de reemplazo para hueco en agenda',
  });
  assert.ok(replacementAppt.id);
  assert.equal(replacementAppt.status, 'SCHEDULED');
});

test('E2E Flujo 2: Agendamiento de Prospecto (Persona sin expediente) y posterior conversión a Paciente', async () => {
  const { db, prisma } = createInMemoryDatabase();
  const orgId = randomUUID();
  const branchA = randomUUID();
  const staffMembershipId = randomUUID();

  // Servicio activo
  const svcConsultation = {
    id: randomUUID(),
    organizationId: orgId,
    name: 'Consulta Odontológica General',
    isActive: true,
  };
  db.services.set(svcConsultation.id, svcConsultation);

  // Servicios y controladores
  const appointmentRepo = new PrismaAppointmentRepository(prisma);
  const personRepo = new PrismaPersonRepository(prisma);

  const createAppointmentUseCase = new CreateAppointmentUseCase(appointmentRepo);
  const listAppointmentsUseCase = new ListAppointmentsUseCase(appointmentRepo);
  const getAppointmentByIdUseCase = new GetAppointmentByIdUseCase(appointmentRepo);
  const cancelAppointmentUseCase = new CancelAppointmentUseCase(appointmentRepo);
  const updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase(appointmentRepo);

  const appointmentController = new AppointmentController(
    createAppointmentUseCase,
    listAppointmentsUseCase,
    getAppointmentByIdUseCase,
    updateAppointmentStatusUseCase,
    cancelAppointmentUseCase,
  );

  const createPersonUseCase = new CreatePersonUseCase(personRepo);
  const listPersonsUseCase = new ListPersonsUseCase(personRepo);
  const getPersonByIdUseCase = new GetPersonByIdUseCase(personRepo);
  const convertPersonToPatientUseCase = new ConvertPersonToPatientUseCase(prisma);

  const personController = new PersonController(
    createPersonUseCase,
    listPersonsUseCase,
    getPersonByIdUseCase,
    convertPersonToPatientUseCase,
  );

  const principal = {
    membershipId: staffMembershipId,
    organizationId: orgId,
    branchIds: [branchA],
    permissions: [
      'dentistry:appointments:create',
      'dentistry:appointments:read',
      'dentistry:patients:create',
    ],
  };

  // Paso 1: Recepción registra una nueva persona (prospecto telefónico)
  const createdPerson = await personController.create(principal, {
    firstName: 'Carlos',
    lastName: 'Mendoza',
    phone: '76543210',
    email: 'carlos.mendoza@example.com',
    notes: 'Interesado en ortodoncia invisible',
  });
  assert.ok(createdPerson.id);
  assert.equal(createdPerson.fullName, 'Carlos Mendoza');
  assert.equal(createdPerson.convertedToPatientId, null);

  // Paso 2: Agendamiento inmediato de cita vinculada a la nueva persona
  const apptForPerson = await appointmentController.create(principal, {
    branchId: branchA,
    personId: createdPerson.id,
    practitionerMembershipId: staffMembershipId,
    serviceIds: [svcConsultation.id],
    scheduledStartAt: '2026-11-06T15:00:00.000Z',
    scheduledEndAt: '2026-11-06T15:30:00.000Z',
    reason: 'Valoración inicial de ortodoncia',
  });

  assert.ok(apptForPerson.id);
  assert.equal(apptForPerson.personId, createdPerson.id);
  assert.equal(apptForPerson.patientId, null);

  // Paso 3: El día de la cita, el paciente acude físicamente y se convierte formalmente a Paciente
  const conversionResult = await personController.convert(principal, createdPerson.id, {
    firstName: 'Carlos',
    lastName: 'Mendoza',
    phone: '76543210',
    birthDate: '1992-07-15',
    sex: 'MALE',
    documentType: 'CI',
    documentNumber: '87654321',
    address: 'Av. América #123',
  });

  assert.ok(conversionResult.patient);
  assert.equal(conversionResult.patient.documentNumber, '87654321');
  assert.equal(conversionResult.reassignedAppointmentsCount, 1);

  // Paso 4: Validar que la persona ahora figura como convertida con el patientId correspondiente
  const personAfter = await personController.getById(principal, createdPerson.id);
  assert.equal(personAfter.convertedToPatientId, conversionResult.patient.id);

  // Paso 5: Validar que la cita previa ahora tiene asignado el nuevo patientId
  const apptUpdated = await appointmentController.getById(principal, apptForPerson.id);
  assert.equal(apptUpdated.patientId, conversionResult.patient.id);
});

test('E2E Flujo 3: Batería completa de rechazo ante casos de error comunes y anomalías', async () => {
  const { db, prisma } = createInMemoryDatabase();
  const orgId = randomUUID();
  const branchA = randomUUID();
  const staffMembershipId = randomUUID();

  const patientRow = {
    id: randomUUID(),
    organizationId: orgId,
    firstName: 'Laura',
    lastName: 'Suárez',
    deletedAt: null,
  };
  db.patients.set(patientRow.id, patientRow);

  const activeService = {
    id: randomUUID(),
    organizationId: orgId,
    name: 'Extracción simple',
    isActive: true,
  };
  db.services.set(activeService.id, activeService);

  const foreignService = {
    id: randomUUID(),
    organizationId: randomUUID(), // otra clínica
    name: 'Servicio ajeno',
    isActive: true,
  };
  db.services.set(foreignService.id, foreignService);

  const appointmentRepo = new PrismaAppointmentRepository(prisma);
  const controller = new AppointmentController(
    new CreateAppointmentUseCase(appointmentRepo),
    new ListAppointmentsUseCase(appointmentRepo),
    new GetAppointmentByIdUseCase(appointmentRepo),
    new UpdateAppointmentStatusUseCase(appointmentRepo),
    new CancelAppointmentUseCase(appointmentRepo),
  );

  const principal = {
    membershipId: staffMembershipId,
    organizationId: orgId,
    branchIds: [branchA],
    permissions: ['dentistry:appointments:create', 'dentistry:appointments:read'],
  };

  // Error común 1: Sucursal no autorizada en el token del usuario
  await assert.rejects(
    controller.create(principal, {
      branchId: randomUUID(), // sucursal ajena
      patientId: patientRow.id,
      practitionerMembershipId: staffMembershipId,
      serviceIds: [activeService.id],
      scheduledStartAt: '2026-11-07T09:00:00.000Z',
      scheduledEndAt: '2026-11-07T09:30:00.000Z',
    }),
    { status: 403, message: 'No tiene acceso a la sucursal indicada.' },
  );

  // Error común 2: Suplantación de profesional (asignar a otra membresía)
  await assert.rejects(
    controller.create(principal, {
      branchId: branchA,
      patientId: patientRow.id,
      practitionerMembershipId: randomUUID(), // otro odontólogo
      serviceIds: [activeService.id],
      scheduledStartAt: '2026-11-07T09:00:00.000Z',
      scheduledEndAt: '2026-11-07T09:30:00.000Z',
    }),
    { status: 403, message: 'No puede asignar citas a otra membresía.' },
  );

  // Error común 3: Servicio de otra organización (intento de brecha multi-tenant)
  await assert.rejects(
    controller.create(principal, {
      branchId: branchA,
      patientId: patientRow.id,
      practitionerMembershipId: staffMembershipId,
      serviceIds: [foreignService.id],
      scheduledStartAt: '2026-11-07T09:00:00.000Z',
      scheduledEndAt: '2026-11-07T09:30:00.000Z',
    }),
    {
      status: 400,
      message: 'Paciente, persona, servicio o tratamiento inválido para la organización.',
    },
  );

  // Error común 4: Horario invertido (start posterior a end)
  await assert.rejects(
    controller.create(principal, {
      branchId: branchA,
      patientId: patientRow.id,
      practitionerMembershipId: staffMembershipId,
      serviceIds: [activeService.id],
      scheduledStartAt: '2026-11-07T11:00:00.000Z',
      scheduledEndAt: '2026-11-07T10:00:00.000Z',
    }),
    { status: 400, message: 'La hora de inicio debe ser anterior a la hora de fin.' },
  );

  // Error común 5: Duración 0 (start === end)
  await assert.rejects(
    controller.create(principal, {
      branchId: branchA,
      patientId: patientRow.id,
      practitionerMembershipId: staffMembershipId,
      serviceIds: [activeService.id],
      scheduledStartAt: '2026-11-07T10:00:00.000Z',
      scheduledEndAt: '2026-11-07T10:00:00.000Z',
    }),
    { status: 400, message: 'La hora de inicio debe ser anterior a la hora de fin.' },
  );

  // Error común 6: Sin paciente y sin persona
  await assert.rejects(
    controller.create(principal, {
      branchId: branchA,
      practitionerMembershipId: staffMembershipId,
      serviceIds: [activeService.id],
      scheduledStartAt: '2026-11-07T10:00:00.000Z',
      scheduledEndAt: '2026-11-07T10:30:00.000Z',
    }),
    {
      status: 400,
      message: 'Debe especificar un paciente o una persona de contacto para la cita.',
    },
  );
});
