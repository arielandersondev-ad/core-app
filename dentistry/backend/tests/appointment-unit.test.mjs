import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Appointment } from '../dist/modules/appointment/domain/entities/appointment.entity.js';
import { CreateAppointmentUseCase } from '../dist/modules/appointment/application/use-case/create-appointment.use-case.js';
import { CreateAppointmentDto } from '../dist/modules/appointment/presentation/dto/create-appointment.dto.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const actor = randomUUID();
const organizationId = randomUUID();
const branchId = randomUUID();

// ============================================================================
// 1. DOMAIN ENTITY TESTS: Appointment
// ============================================================================

test('Appointment Entity: rechaza rango temporal inválido (start >= end o fechas no válidas)', () => {
  const personId = randomUUID();

  // Caso 1: start > end
  assert.throws(
    () =>
      new Appointment({
        organizationId,
        branchId,
        personId,
        practitionerMembershipId: actor,
        createdByMembershipId: actor,
        scheduledStartAt: new Date('2026-11-01T11:00:00Z'),
        scheduledEndAt: new Date('2026-11-01T10:00:00Z'),
      }),
    /La hora de inicio debe ser anterior a la hora de fin/,
  );

  // Caso 2: start === end (duración 0)
  assert.throws(
    () =>
      new Appointment({
        organizationId,
        branchId,
        personId,
        practitionerMembershipId: actor,
        createdByMembershipId: actor,
        scheduledStartAt: new Date('2026-11-01T10:00:00Z'),
        scheduledEndAt: new Date('2026-11-01T10:00:00Z'),
      }),
    /La hora de inicio debe ser anterior a la hora de fin/,
  );

  // Caso 3: fechas inválidas (NaN)
  assert.throws(
    () =>
      new Appointment({
        organizationId,
        branchId,
        personId,
        practitionerMembershipId: actor,
        createdByMembershipId: actor,
        scheduledStartAt: new Date('invalid-date'),
        scheduledEndAt: new Date('2026-11-01T10:00:00Z'),
      }),
    /La hora de inicio debe ser anterior a la hora de fin/,
  );
});

test('Appointment Entity: exige al menos patientId o personId', () => {
  assert.throws(
    () =>
      new Appointment({
        organizationId,
        branchId,
        practitionerMembershipId: actor,
        createdByMembershipId: actor,
        scheduledStartAt: new Date('2026-11-01T10:00:00Z'),
        scheduledEndAt: new Date('2026-11-01T10:30:00Z'),
      }),
    /asociado un paciente o una persona de contacto/,
  );
});

test('Appointment Entity: inicializa correctamente con paciente o persona y deduplica servicios', () => {
  const patientId = randomUUID();
  const svc1 = randomUUID();
  const svc2 = randomUUID();

  const apptWithPatient = new Appointment({
    organizationId,
    branchId,
    patientId,
    practitionerMembershipId: actor,
    serviceIds: [svc1, svc2, svc1], // con duplicado intencional
    createdByMembershipId: actor,
    scheduledStartAt: new Date('2026-11-01T10:00:00Z'),
    scheduledEndAt: new Date('2026-11-01T10:30:00Z'),
    reason: 'Control semestral',
    notes: 'Paciente puntual',
  });

  assert.equal(apptWithPatient.patientId, patientId);
  assert.equal(apptWithPatient.personId, null);
  assert.equal(apptWithPatient.status, 'SCHEDULED');
  assert.equal(apptWithPatient.rowVersion, 1);
  assert.deepEqual(apptWithPatient.serviceIds, [svc1, svc2]);
  assert.equal(apptWithPatient.serviceId, svc1);
  assert.equal(apptWithPatient.reason, 'Control semestral');
  assert.equal(apptWithPatient.notes, 'Paciente puntual');

  // Caso con solo personId (prospecto sin paciente)
  const personId = randomUUID();
  const apptWithPerson = new Appointment({
    organizationId,
    branchId,
    personId,
    practitionerMembershipId: actor,
    serviceId: svc1,
    createdByMembershipId: actor,
    scheduledStartAt: new Date('2026-11-01T11:00:00Z'),
    scheduledEndAt: new Date('2026-11-01T11:45:00Z'),
  });

  assert.equal(apptWithPerson.patientId, null);
  assert.equal(apptWithPerson.personId, personId);
  assert.deepEqual(apptWithPerson.serviceIds, [svc1]);
  assert.equal(apptWithPerson.serviceId, svc1);
});

test('Appointment Entity: ciclo de vida de transiciones de estado y restricciones de negocio', () => {
  const appt = new Appointment({
    organizationId,
    branchId,
    personId: randomUUID(),
    practitionerMembershipId: actor,
    createdByMembershipId: actor,
    scheduledStartAt: new Date('2026-11-01T10:00:00Z'),
    scheduledEndAt: new Date('2026-11-01T10:30:00Z'),
  });

  assert.equal(appt.status, 'SCHEDULED');

  appt.confirm();
  assert.equal(appt.status, 'CONFIRMED');

  appt.markInWaitingRoom();
  assert.equal(appt.status, 'WAITING_ROOM');

  appt.start();
  assert.equal(appt.status, 'IN_PROGRESS');

  appt.complete();
  assert.equal(appt.status, 'COMPLETED');

  // No se puede confirmar ni cancelar una cita ya completada
  assert.throws(() => appt.confirm(), /ya completada/);
  assert.throws(() => appt.markInWaitingRoom(), /ya completada/);
  assert.throws(() => appt.start(), /ya completada/);
  assert.throws(() => appt.cancel(actor, 'Cancelación tardía'), /completada/);

  // Nueva cita para probar cancelación
  const apptToCancel = new Appointment({
    organizationId,
    branchId,
    personId: randomUUID(),
    practitionerMembershipId: actor,
    createdByMembershipId: actor,
    scheduledStartAt: new Date('2026-11-01T12:00:00Z'),
    scheduledEndAt: new Date('2026-11-01T12:30:00Z'),
  });

  assert.throws(() => apptToCancel.cancel(actor, '   '), /El motivo de cancelación es obligatorio/);

  apptToCancel.cancel(actor, 'Paciente solicitó reprogramar');
  assert.equal(apptToCancel.status, 'CANCELED');
  assert.equal(apptToCancel.canceledByMembershipId, actor);
  assert.equal(apptToCancel.cancellationReason, 'Paciente solicitó reprogramar');
  assert.ok(apptToCancel.canceledAt instanceof Date);

  // No se puede confirmar ni reactivar una cita cancelada directamente
  assert.throws(() => apptToCancel.confirm(), /cancelada/);
  assert.throws(() => apptToCancel.markInWaitingRoom(), /cancelada/);
  assert.throws(() => apptToCancel.start(), /cancelada/);
  assert.throws(() => apptToCancel.complete(), /cancelada/);
});

// ============================================================================
// 2. USE CASE TESTS: CreateAppointmentUseCase
// ============================================================================

test('CreateAppointmentUseCase: rechaza acceso si la sucursal no está autorizada para el actor', async () => {
  const useCase = new CreateAppointmentUseCase({
    referencesBelongToOrganization: async () => true,
    hasOverlap: async () => false,
    create: async (a) => a,
  });

  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [randomUUID()], // sucursal distinta
      patientId: randomUUID(),
      practitionerMembershipId: actor,
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T09:30:00Z'),
      createdByMembershipId: actor,
    }),
    { status: 403, message: 'No tiene acceso a la sucursal indicada.' },
  );
});

test('CreateAppointmentUseCase: prohíbe asignación de citas a otra membresía (autoasignación estricta)', async () => {
  const otherPractitioner = randomUUID();
  const useCase = new CreateAppointmentUseCase({
    referencesBelongToOrganization: async () => true,
    hasOverlap: async () => false,
    create: async (a) => a,
  });

  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [branchId],
      patientId: randomUUID(),
      practitionerMembershipId: otherPractitioner, // diferente a createdByMembershipId
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T09:30:00Z'),
      createdByMembershipId: actor,
    }),
    { status: 403, message: 'No puede asignar citas a otra membresía.' },
  );
});

test('CreateAppointmentUseCase: rechaza si faltan tanto patientId como personId', async () => {
  const useCase = new CreateAppointmentUseCase({
    referencesBelongToOrganization: async () => true,
    hasOverlap: async () => false,
    create: async (a) => a,
  });

  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [branchId],
      practitionerMembershipId: actor,
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T09:30:00Z'),
      createdByMembershipId: actor,
    }),
    { status: 400, message: 'Debe especificar un paciente o una persona de contacto para la cita.' },
  );
});

test('CreateAppointmentUseCase: rechaza fechas invertidas o fecha fin igual/menor a inicio', async () => {
  const useCase = new CreateAppointmentUseCase({
    referencesBelongToOrganization: async () => true,
    hasOverlap: async () => false,
    create: async (a) => a,
  });

  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [branchId],
      patientId: randomUUID(),
      practitionerMembershipId: actor,
      scheduledStartAt: new Date('2026-11-01T10:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T09:30:00Z'), // Fin antes que inicio
      createdByMembershipId: actor,
    }),
    { status: 400, message: 'La hora de inicio debe ser anterior a la hora de fin.' },
  );
});

test('CreateAppointmentUseCase: rechaza referencias ajenas o inactivas (paciente, persona, servicio o tratamiento)', async () => {
  const mockRepo = {
    referencesBelongToOrganization: async () => false,
    hasOverlap: async () => false,
    create: async (a) => a,
  };
  const useCase = new CreateAppointmentUseCase(mockRepo);

  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [branchId],
      patientId: randomUUID(),
      practitionerMembershipId: actor,
      serviceIds: [randomUUID()],
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T09:30:00Z'),
      createdByMembershipId: actor,
    }),
    {
      status: 400,
      message: 'Paciente, persona, servicio o tratamiento inválido para la organización.',
    },
  );
});

test('CreateAppointmentUseCase: rechaza por solapamiento de horario (409 Conflict)', async () => {
  const mockRepo = {
    referencesBelongToOrganization: async () => true,
    hasOverlap: async () => true, // Solapamiento detectado
    create: async (a) => a,
  };
  const useCase = new CreateAppointmentUseCase(mockRepo);

  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [branchId],
      patientId: randomUUID(),
      practitionerMembershipId: actor,
      scheduledStartAt: new Date('2026-11-01T09:00:00Z'),
      scheduledEndAt: new Date('2026-11-01T09:30:00Z'),
      createdByMembershipId: actor,
    }),
    {
      status: 409,
      message: 'El profesional ya cuenta con una cita programada en ese rango de horario.',
    },
  );
});

test('CreateAppointmentUseCase: crea exitosamente cita con paciente y múltiples servicios', async () => {
  const patientId = randomUUID();
  const svc1 = randomUUID();
  const svc2 = randomUUID();
  let savedAppointment = null;

  const mockRepo = {
    referencesBelongToOrganization: async (params) => {
      assert.equal(params.organizationId, organizationId);
      assert.equal(params.patientId, patientId);
      assert.deepEqual(params.serviceIds, [svc1, svc2]);
      return true;
    },
    hasOverlap: async () => false,
    create: async (appt) => {
      savedAppointment = appt;
      return appt;
    },
  };

  const useCase = new CreateAppointmentUseCase(mockRepo);
  const result = await useCase.execute({
    organizationId,
    branchId,
    authorizedBranchIds: [branchId],
    patientId,
    practitionerMembershipId: actor,
    serviceIds: [svc1, svc2],
    scheduledStartAt: new Date('2026-11-01T14:00:00Z'),
    scheduledEndAt: new Date('2026-11-01T15:00:00Z'),
    reason: 'Profilaxis dental y sellantes',
    notes: 'Alergia a la penicilina',
    createdByMembershipId: actor,
  });

  assert.ok(result);
  assert.equal(result.patientId, patientId);
  assert.equal(result.personId, null);
  assert.equal(result.status, 'SCHEDULED');
  assert.deepEqual(result.serviceIds, [svc1, svc2]);
  assert.equal(result.reason, 'Profilaxis dental y sellantes');
  assert.equal(result.notes, 'Alergia a la penicilina');
  assert.equal(savedAppointment, result);
});

// ============================================================================
// 3. PRESENTATION DTO TESTS: CreateAppointmentDto
// ============================================================================

test('CreateAppointmentDto: valida UUIDs obligatorios y formato ISO8601 de fechas', async () => {
  // DTO con errores múltiples
  const invalidDto = plainToInstance(CreateAppointmentDto, {
    branchId: 'no-es-uuid',
    practitionerMembershipId: 'tampoco-es-uuid',
    scheduledStartAt: 'fecha-completamente-invalida', // no ISO8601
    scheduledEndAt: 'mañana a las 11', // texto libre inválido
    serviceIds: ['no-uuid-1', 'no-uuid-2'],
  });

  const errors = await validate(invalidDto);
  assert.ok(errors.some((e) => e.property === 'branchId'));
  assert.ok(errors.some((e) => e.property === 'practitionerMembershipId'));
  assert.ok(errors.some((e) => e.property === 'scheduledStartAt'));
  assert.ok(errors.some((e) => e.property === 'scheduledEndAt'));
  assert.ok(errors.some((e) => e.property === 'serviceIds'));

  // DTO válido con paciente
  const validDtoPatient = plainToInstance(CreateAppointmentDto, {
    branchId: randomUUID(),
    patientId: randomUUID(),
    practitionerMembershipId: randomUUID(),
    serviceIds: [randomUUID(), randomUUID()],
    scheduledStartAt: '2026-11-01T09:00:00.000Z',
    scheduledEndAt: '2026-11-01T09:45:00.000Z',
    reason: 'Evaluación inicial',
    notes: 'Primera visita',
  });
  const validErrors1 = await validate(validDtoPatient);
  assert.equal(validErrors1.length, 0);

  // DTO válido con persona de contacto
  const validDtoPerson = plainToInstance(CreateAppointmentDto, {
    branchId: randomUUID(),
    personId: randomUUID(),
    practitionerMembershipId: randomUUID(),
    scheduledStartAt: '2026-11-01T15:00:00.000Z',
    scheduledEndAt: '2026-11-01T15:30:00.000Z',
  });
  const validErrors2 = await validate(validDtoPerson);
  assert.equal(validErrors2.length, 0);
});

test('CreateAppointmentDto: valida exitosamente UUIDs v7 canónicos (018f..., 01a043d0-...) sin arrojar 400', async () => {
  const v7Dto = plainToInstance(CreateAppointmentDto, {
    branchId: '01a043d0-05e1-77ce-b3fe-aeccb845bbf0',
    patientId: '018f0000-0000-7000-8000-000000000001',
    practitionerMembershipId: '018f0000-0000-7000-8000-000000000003',
    serviceId: '01a043d0-0000-7000-8000-000000000010',
    serviceIds: [
      '01a043d0-0000-7000-8000-000000000020',
      '01a043d0-0000-7000-8000-000000000030',
    ],
    treatmentId: '018f0000-0000-7000-8000-000000000099',
    scheduledStartAt: '2026-11-05T09:00:00.000Z',
    scheduledEndAt: '2026-11-05T10:00:00.000Z',
    reason: 'Consulta de ortodoncia',
    notes: 'Validación UUIDv7 canónico',
  });

  const errors = await validate(v7Dto);
  assert.equal(errors.length, 0, JSON.stringify(errors.map((e) => ({ prop: e.property, constraints: e.constraints }))));
});


// ============================================================================
// 4. OPTIONAL PRACTITIONER & SERVICES TESTS (HAG-44)
// ============================================================================

test('Appointment Entity: permite practitionerMembershipId nulo u omitido y servicios opcionales', () => {
  const patientId = randomUUID();
  const apptWithoutDoctor = new Appointment({
    organizationId,
    branchId,
    patientId,
    scheduledStartAt: new Date('2026-11-05T09:00:00Z'),
    scheduledEndAt: new Date('2026-11-05T09:30:00Z'),
    createdByMembershipId: actor,
  });

  assert.equal(apptWithoutDoctor.practitionerMembershipId, null);
  assert.deepEqual(apptWithoutDoctor.serviceIds, []);
  assert.equal(apptWithoutDoctor.serviceId, '');
  assert.equal(apptWithoutDoctor.status, 'SCHEDULED');

  const personId = randomUUID();
  const apptWithPersonNoDoctor = new Appointment({
    organizationId,
    branchId,
    personId,
    practitionerMembershipId: null,
    scheduledStartAt: new Date('2026-11-05T10:00:00Z'),
    scheduledEndAt: new Date('2026-11-05T10:30:00Z'),
    createdByMembershipId: actor,
  });

  assert.equal(apptWithPersonNoDoctor.practitionerMembershipId, null);
  assert.equal(apptWithPersonNoDoctor.personId, personId);
  assert.equal(apptWithPersonNoDoctor.patientId, null);
});

test('CreateAppointmentUseCase: crea exitosamente cita con solo { branchId, patientId, scheduledStartAt, scheduledEndAt } (sin doctor ni servicios)', async () => {
  const patientId = randomUUID();
  let savedAppt = null;

  const mockRepo = {
    referencesBelongToOrganization: async (params) => {
      assert.equal(params.organizationId, organizationId);
      assert.equal(params.patientId, patientId);
      assert.deepEqual(params.serviceIds, []);
      return true;
    },
    hasOverlap: async () => {
      throw new Error('hasOverlap no debe ejecutarse si no hay profesional asignado');
    },
    create: async (appt) => {
      savedAppt = appt;
      return appt;
    },
  };

  const useCase = new CreateAppointmentUseCase(mockRepo);
  const result = await useCase.execute({
    organizationId,
    branchId,
    authorizedBranchIds: [branchId],
    patientId,
    scheduledStartAt: new Date('2026-11-05T09:00:00Z'),
    scheduledEndAt: new Date('2026-11-05T09:30:00Z'),
    createdByMembershipId: actor,
  });

  assert.ok(result);
  assert.equal(result.patientId, patientId);
  assert.equal(result.personId, null);
  assert.equal(result.practitionerMembershipId, null);
  assert.deepEqual(result.serviceIds, []);
  assert.equal(savedAppt, result);
});

test('CreateAppointmentUseCase: crea exitosamente cita con solo { branchId, personId, scheduledStartAt, scheduledEndAt } (contacto rápido sin doctor ni servicios)', async () => {
  const personId = randomUUID();
  let savedAppt = null;

  const mockRepo = {
    referencesBelongToOrganization: async (params) => {
      assert.equal(params.organizationId, organizationId);
      assert.equal(params.personId, personId);
      assert.deepEqual(params.serviceIds, []);
      return true;
    },
    hasOverlap: async () => false,
    create: async (appt) => {
      savedAppt = appt;
      return appt;
    },
  };

  const useCase = new CreateAppointmentUseCase(mockRepo);
  const result = await useCase.execute({
    organizationId,
    branchId,
    authorizedBranchIds: [branchId],
    personId,
    practitionerMembershipId: null,
    scheduledStartAt: new Date('2026-11-05T11:00:00Z'),
    scheduledEndAt: new Date('2026-11-05T11:30:00Z'),
    createdByMembershipId: actor,
  });

  assert.ok(result);
  assert.equal(result.personId, personId);
  assert.equal(result.patientId, null);
  assert.equal(result.practitionerMembershipId, null);
  assert.deepEqual(result.serviceIds, []);
  assert.equal(savedAppt, result);
});

test('CreateAppointmentDto: valida exitosamente payload mínimo con solo { branchId, patientId, scheduledStartAt, scheduledEndAt } (HTTP 201)', async () => {
  const minimalDtoPatient = plainToInstance(CreateAppointmentDto, {
    branchId: randomUUID(),
    patientId: randomUUID(),
    scheduledStartAt: '2026-11-05T09:00:00.000Z',
    scheduledEndAt: '2026-11-05T09:30:00.000Z',
  });

  const errorsPatient = await validate(minimalDtoPatient);
  assert.equal(errorsPatient.length, 0, JSON.stringify(errorsPatient));

  const minimalDtoPerson = plainToInstance(CreateAppointmentDto, {
    branchId: randomUUID(),
    personId: randomUUID(),
    scheduledStartAt: '2026-11-05T10:00:00.000Z',
    scheduledEndAt: '2026-11-05T10:30:00.000Z',
  });

  const errorsPerson = await validate(minimalDtoPerson);
  assert.equal(errorsPerson.length, 0, JSON.stringify(errorsPerson));
});
