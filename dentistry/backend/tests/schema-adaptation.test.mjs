import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { parseCivilDate } from '../dist/common/validation/civil-date.js';
import { Patient } from '../dist/modules/patient/domain/entities/patient.entity.js';
import { PatientResponseDto } from '../dist/modules/patient/presentation/dto/patient.response.dto.js';
import { PatientController } from '../dist/modules/patient/presentation/http/patient.controller.js';
import { UpdatePatientUseCase } from '../dist/modules/patient/application/use-case/update-patient.use-case.js';
import { CreatePatientUseCase } from '../dist/modules/patient/application/use-case/create-patient.use-case.js';
import { CreateAppointmentUseCase } from '../dist/modules/appointment/application/use-case/create-appointment.use-case.js';
import { CreateAppointmentDto } from '../dist/modules/appointment/presentation/dto/create-appointment.dto.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const actor = randomUUID(),
  organizationId = randomUUID();
function patient() {
  return new Patient({
    id: randomUUID(),
    organizationId,
    createdByMembershipId: actor,
    firstName: 'Ana',
    lastName: 'Pérez',
    birthDate: parseCivilDate('2000-02-29'),
  });
}

test('la fecha civil no admite instantes ni días inexistentes y responde solo YYYY-MM-DD', () => {
  assert.equal(parseCivilDate(null), null);
  assert.equal(parseCivilDate(undefined), undefined);
  for (const invalid of [
    '2025-02-29',
    '2026-13-01',
    '2000-02-29T23:00:00-04:00',
    '',
  ])
    assert.throws(() => parseCivilDate(invalid), { status: 400 });
  assert.equal(
    PatientResponseDto.fromEntity(patient()).birthDate,
    '2000-02-29',
  );
});

test('PATCH sin birthDate conserva el cumpleaños y null lo borra explícitamente', async () => {
  const current = patient();
  const repository = {
    findById: async () => current,
    update: async (value) => value,
  };
  const controller = new PatientController(
    {},
    {},
    {},
    new UpdatePatientUseCase(repository),
  );
  await controller.update(current.id, {
    organizationId,
    updatedByMembershipId: actor,
    phone: '123',
  });
  assert.equal(PatientResponseDto.fromEntity(current).birthDate, '2000-02-29');
  await controller.update(current.id, {
    organizationId,
    updatedByMembershipId: actor,
    birthDate: null,
  });
  assert.equal(current.birthDate, null);
});

test('el alta rechaza un documento incompleto antes de persistir', async () => {
  let writes = 0;
  const useCase = new CreatePatientUseCase({
    create: async (value) => {
      writes++;
      return value;
    },
  });
  const input = {
    organizationId,
    firstName: 'Ana',
    lastName: 'Pérez',
    createdByMembershipId: actor,
  };
  await assert.rejects(useCase.execute({ ...input, documentNumber: '123' }), {
    status: 400,
  });
  await assert.rejects(useCase.execute({ ...input, sex: 'UNKNOWN' }), {
    status: 400,
  });
  assert.equal(writes, 0);
  const result = await useCase.execute({
    ...input,
    documentType: 'CI',
    documentNumber: '123',
  });
  assert.equal(result.documentNumber, '123');
});

test('el DTO admite UUIDv7 en todos los servicios y rechaza un valor que no es lista', async () => {
  const payload = {
    branchId: randomUUID(),
    patientId: randomUUID(),
    practitionerMembershipId: actor,
    scheduledStartAt: '2026-10-22T14:00:00Z',
    scheduledEndAt: '2026-10-22T15:00:00Z',
    serviceIds: ['019a0b38-1000-7000-8000-000000000001'],
  };
  assert.deepEqual(
    await validate(plainToInstance(CreateAppointmentDto, payload)),
    [],
  );
  assert.ok(
    (
      await validate(
        plainToInstance(CreateAppointmentDto, {
          ...payload,
          serviceIds: payload.serviceIds[0],
        }),
      )
    ).some((error) => error.property === 'serviceIds'),
  );
});

test('valida todos los servicios de una cita y no escribe si alguno pertenece a otra organización', async () => {
  const branchId = randomUUID(),
    first = randomUUID(),
    second = randomUUID();
  let writes = 0;
  const useCase = new CreateAppointmentUseCase({
    referencesBelongToOrganization: async (input) => {
      assert.deepEqual(input.serviceIds, [first, second]);
      return false;
    },
    create: async () => {
      writes++;
    },
  });
  await assert.rejects(
    useCase.execute({
      organizationId,
      branchId,
      authorizedBranchIds: [branchId],
      patientId: randomUUID(),
      practitionerMembershipId: actor,
      createdByMembershipId: actor,
      serviceIds: [first, second, second],
      scheduledStartAt: new Date('2026-10-22T14:00:00Z'),
      scheduledEndAt: new Date('2026-10-22T15:00:00Z'),
    }),
    { status: 400 },
  );
  assert.equal(writes, 0);
});
