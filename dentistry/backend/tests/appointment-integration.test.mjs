import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaAppointmentRepository } from '../dist/modules/appointment/infrastructure/prisma-appointment.repository.js';
import { Appointment } from '../dist/modules/appointment/domain/entities/appointment.entity.js';
import { AppointmentController } from '../dist/modules/appointment/presentation/http/appointment.controller.js';
import { CreateAppointmentUseCase } from '../dist/modules/appointment/application/use-case/create-appointment.use-case.js';
import { CreateAppointmentDto } from '../dist/modules/appointment/presentation/dto/create-appointment.dto.js';
import { ConflictException } from '@nestjs/common';

const organizationId = randomUUID();
const otherOrgId = randomUUID();
const branchId = randomUUID();
const practitionerId = randomUUID();
const otherPractitionerId = randomUUID();
const actorId = randomUUID();

// ============================================================================
// 1. REPOSITORY INTEGRATION: hasOverlap exhaustivo (Matriz temporal y de seguridad)
// ============================================================================

test('PrismaAppointmentRepository: matriz exhaustiva de solapamiento temporal y aislamiento', async () => {
  const existingApptId = randomUUID();
  const canceledApptId = randomUUID();
  const baseStart = new Date('2026-11-01T10:00:00Z');
  const baseEnd = new Date('2026-11-01T11:00:00Z');

  // Repositorio en memoria que simula la tabla de Appointments de Prisma
  const appointmentsTable = [
    {
      id: existingApptId,
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: baseStart,
      scheduledEndAt: baseEnd,
      status: 'SCHEDULED',
    },
    {
      id: canceledApptId,
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T12:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T13:00:00Z'),
      status: 'CANCELED', // cancelada no bloquea el horario
    },
    {
      id: randomUUID(),
      organizationId,
      branchId,
      practitionerMembershipId: otherPractitionerId, // otro odontólogo en el mismo consultorio
      scheduledStartAt: baseStart,
      scheduledEndAt: baseEnd,
      status: 'CONFIRMED',
    },
    {
      id: randomUUID(),
      organizationId: otherOrgId, // otra clínica (tenant diferente)
      branchId: randomUUID(),
      practitionerMembershipId: practitionerId,
      scheduledStartAt: baseStart,
      scheduledEndAt: baseEnd,
      status: 'SCHEDULED',
    },
  ];

  const fakePrisma = {
    orm: {
      dentistry: {
        Appointment: {
          where: ({ organizationId: org, practitionerMembershipId: pract }) => ({
            all: async () =>
              appointmentsTable.filter(
                (a) =>
                  a.organizationId === org &&
                  a.practitionerMembershipId === pract,
              ),
          }),
        },
      },
    },
  };

  const repository = new PrismaAppointmentRepository(fakePrisma);

  // Caso 1: Rango idéntico -> SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T10:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T11:00:00Z'),
    }),
    true,
  );

  // Caso 2: Solapamiento parcial al inicio (09:30 - 10:30) -> SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T09:30:00Z'),
      scheduledEndAt: new Date('2026-11-01T10:30:00Z'),
    }),
    true,
  );

  // Caso 3: Solapamiento parcial al final (10:30 - 11:30) -> SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T10:30:00Z'),
      scheduledEndAt: new Date('2026-11-01T11:30:00Z'),
    }),
    true,
  );

  // Caso 4: Contenido adentro (10:15 - 10:45) -> SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T10:15:00Z'),
      scheduledEndAt: new Date('2026-11-01T10:45:00Z'),
    }),
    true,
  );

  // Caso 5: Envolvente afuera (09:00 - 12:00) -> SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T12:00:00Z'),
    }),
    true,
  );

  // Caso 6: Adyacente previo estricto (09:00 - 10:00) -> NO SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T10:00:00Z'),
    }),
    false,
  );

  // Caso 7: Adyacente posterior estricto (11:00 - 12:00) -> NO SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T11:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T12:00:00Z'),
    }),
    false,
  );

  // Caso 8: Rango separado / disjunto (14:00 - 15:00) -> NO SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T14:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T15:00:00Z'),
    }),
    false,
  );

  // Caso 9: Rango ocupado por cita cancelada (12:00 - 13:00) -> NO SOLAPA (horario liberado)
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: new Date('2026-11-01T12:15:00Z'),
      scheduledEndAt: new Date('2026-11-01T12:45:00Z'),
    }),
    false,
  );

  // Caso 10: Excluir id propio (reprogramación de cita existente sobre su mismo horario) -> NO SOLAPA
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: baseStart,
      scheduledEndAt: baseEnd,
      excludeAppointmentId: existingApptId,
    }),
    false,
  );

  // Caso 11: Mismo horario pero con OTRO odontólogo -> NO SOLAPA para este profesional
  assert.equal(
    await repository.hasOverlap({
      organizationId,
      branchId,
      practitionerMembershipId: randomUUID(), // profesional sin citas
      scheduledStartAt: baseStart,
      scheduledEndAt: baseEnd,
    }),
    false,
  );

  // Caso 12: Mismo horario en OTRA organización -> NO SOLAPA (aislamiento tenant)
  assert.equal(
    await repository.hasOverlap({
      organizationId: randomUUID(),
      branchId,
      practitionerMembershipId: practitionerId,
      scheduledStartAt: baseStart,
      scheduledEndAt: baseEnd,
    }),
    false,
  );
});

// ============================================================================
// 2. REPOSITORY INTEGRATION: referencesBelongToOrganization (Multi-tenant check)
// ============================================================================

test('PrismaAppointmentRepository: valida aislamiento y estado activo de todas las referencias', async () => {
  const patientId = randomUUID();
  const deletedPatientId = randomUUID();
  const personId = randomUUID();
  const deletedPersonId = randomUUID();
  const activeSvc1 = randomUUID();
  const activeSvc2 = randomUUID();
  const inactiveSvc = randomUUID();
  const otherOrgSvc = randomUUID();
  const treatmentId = randomUUID();

  const fakePrisma = {
    orm: {
      dentistry: {
        Patient: {
          first: async (filter) => {
            if (filter.id === patientId && filter.organizationId === organizationId && filter.deletedAt === null) {
              return { id: patientId, organizationId };
            }
            if (filter.id === deletedPatientId && filter.deletedAt === null) {
              return null; // eliminado lógicamente
            }
            return null;
          },
        },
        Person: {
          first: async (filter) => {
            if (filter.id === personId && filter.organizationId === organizationId && filter.deletedAt === null) {
              return { id: personId, organizationId };
            }
            if (filter.id === deletedPersonId && filter.deletedAt === null) {
              return null; // eliminado
            }
            return null;
          },
        },
        DentalService: {
          first: async (filter) => {
            if (
              (filter.id === activeSvc1 || filter.id === activeSvc2) &&
              filter.organizationId === organizationId &&
              filter.isActive === true
            ) {
              return { id: filter.id, organizationId, isActive: true };
            }
            if (filter.id === inactiveSvc && filter.isActive === true) {
              return null; // servicio inactivo
            }
            if (filter.id === otherOrgSvc && filter.organizationId === organizationId) {
              return null; // pertenece a otra org
            }
            return null;
          },
        },
        Treatment: {
          first: async (filter) => {
            if (
              filter.id === treatmentId &&
              filter.organizationId === organizationId &&
              filter.patientId === patientId
            ) {
              return { id: treatmentId, organizationId, patientId };
            }
            return null;
          },
        },
      },
    },
  };

  const repository = new PrismaAppointmentRepository(fakePrisma);

  // Caso Válido: Paciente + 2 servicios activos + tratamiento propio
  const valid = await repository.referencesBelongToOrganization({
    organizationId,
    patientId,
    serviceIds: [activeSvc1, activeSvc2],
    treatmentId,
  });
  assert.equal(valid, true);

  // Rechazo: Paciente eliminado
  const invalidDeletedPatient = await repository.referencesBelongToOrganization({
    organizationId,
    patientId: deletedPatientId,
    serviceIds: [activeSvc1],
  });
  assert.equal(invalidDeletedPatient, false);

  // Rechazo: Paciente de otra organización
  const invalidOtherOrgPatient = await repository.referencesBelongToOrganization({
    organizationId: otherOrgId,
    patientId,
    serviceIds: [activeSvc1],
  });
  assert.equal(invalidOtherOrgPatient, false);

  // Válido: Persona de contacto válida sin paciente
  const validPerson = await repository.referencesBelongToOrganization({
    organizationId,
    personId,
    serviceIds: [activeSvc1],
  });
  assert.equal(validPerson, true);

  // Rechazo: Persona eliminada
  const invalidDeletedPerson = await repository.referencesBelongToOrganization({
    organizationId,
    personId: deletedPersonId,
    serviceIds: [activeSvc1],
  });
  assert.equal(invalidDeletedPerson, false);

  // Rechazo: Uno de los servicios está inactivo
  const invalidServiceInactive = await repository.referencesBelongToOrganization({
    organizationId,
    patientId,
    serviceIds: [activeSvc1, inactiveSvc],
  });
  assert.equal(invalidServiceInactive, false);

  // Rechazo: Uno de los servicios pertenece a otra organización
  const invalidServiceOtherOrg = await repository.referencesBelongToOrganization({
    organizationId,
    patientId,
    serviceIds: [activeSvc1, otherOrgSvc],
  });
  assert.equal(invalidServiceOtherOrg, false);

  // Rechazo: Tratamiento indicado para persona sin paciente formal
  const invalidTreatmentForPerson = await repository.referencesBelongToOrganization({
    organizationId,
    personId,
    serviceIds: [activeSvc1],
    treatmentId,
  });
  assert.equal(invalidTreatmentForPerson, false);
});

// ============================================================================
// 3. REPOSITORY INTEGRATION: create() atómico y mapeo de AppointmentService
// ============================================================================

test('PrismaAppointmentRepository: create() persiste la cita y sus AppointmentServices en transacción', async () => {
  const patientId = randomUUID();
  const svc1 = randomUUID();
  const svc2 = randomUUID();
  let createdAppointmentRow = null;
  const createdServices = [];

  const fakeTx = {
    orm: {
      dentistry: {
        Appointment: {
          create: async (data) => {
            createdAppointmentRow = {
              id: randomUUID(),
              ...data,
              rowVersion: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            return createdAppointmentRow;
          },
        },
        AppointmentService: {
          create: async (data) => {
            const row = {
              id: randomUUID(),
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            createdServices.push(row);
            return row;
          },
        },
      },
    },
  };

  const fakePrisma = {
    transaction: async (fn) => fn(fakeTx),
  };

  const repository = new PrismaAppointmentRepository(fakePrisma);
  const apptToCreate = new Appointment({
    organizationId,
    branchId,
    patientId,
    practitionerMembershipId: practitionerId,
    serviceIds: [svc1, svc2],
    scheduledStartAt: new Date('2026-11-01T15:00:00Z'),
    scheduledEndAt: new Date('2026-11-01T15:30:00Z'),
    reason: 'Limpieza dental',
    notes: 'Confirmada por llamada',
    createdByMembershipId: actorId,
  });

  const created = await repository.create(apptToCreate);

  assert.ok(created);
  assert.equal(created.organizationId, organizationId);
  assert.equal(created.patientId, patientId);
  assert.equal(created.status, 'SCHEDULED');
  assert.equal(createdAppointmentRow.patientId, patientId);
  assert.equal(createdServices.length, 2);
  assert.equal(createdServices[0].serviceId, svc1);
  assert.equal(createdServices[1].serviceId, svc2);
  assert.equal(created.services.length, 2);
});

// ============================================================================
// 4. CONTROLLER INTEGRATION: AppointmentController HTTP & Principal mapping
// ============================================================================

test('AppointmentController: mapea claims del DentistryPrincipal y pasa al UseCase', async () => {
  const principal = {
    membershipId: actorId,
    organizationId,
    branchIds: [branchId],
    permissions: ['dentistry:appointments:create'],
  };

  let receivedCommand = null;
  const mockUseCase = {
    execute: async (cmd) => {
      receivedCommand = cmd;
      return new Appointment({
        ...cmd,
        id: randomUUID(),
      });
    },
  };

  const controller = new AppointmentController(
    mockUseCase,
    {}, // listAppointmentsUseCase
    {}, // getAppointmentByIdUseCase
    {}, // updateAppointmentStatusUseCase
    {}, // cancelAppointmentUseCase
  );

  const dto = {
    branchId,
    patientId: randomUUID(),
    practitionerMembershipId: actorId,
    serviceIds: [randomUUID()],
    scheduledStartAt: '2026-11-01T09:00:00.000Z',
    scheduledEndAt: '2026-11-01T09:30:00.000Z',
    reason: 'Revisión periódica',
    notes: 'Paciente acude puntual',
  };

  const result = await controller.create(principal, dto);

  assert.ok(result);
  assert.equal(receivedCommand.organizationId, principal.organizationId);
  assert.deepEqual(receivedCommand.authorizedBranchIds, principal.branchIds);
  assert.equal(receivedCommand.branchId, dto.branchId);
  assert.equal(receivedCommand.createdByMembershipId, principal.membershipId);
  assert.ok(receivedCommand.scheduledStartAt instanceof Date);
  assert.ok(receivedCommand.scheduledEndAt instanceof Date);
  assert.equal(receivedCommand.reason, dto.reason);
  assert.equal(receivedCommand.notes, dto.notes);
});
