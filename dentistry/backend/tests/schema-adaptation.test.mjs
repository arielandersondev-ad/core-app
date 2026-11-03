import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { parseCivilDate } from '../dist/common/validation/civil-date.js';
import { ValidationPipe } from '@nestjs/common';
import { CreatePatientDto } from '../dist/modules/patient/presentation/dto/create-patient.dto.js';
import { UpdatePatientDto } from '../dist/modules/patient/presentation/dto/update-patient.dto.js';
import { ListPatientsQueryDto } from '../dist/modules/patient/presentation/dto/list-patients.query.dto.js';
import { GetPatientByIdUseCase } from '../dist/modules/patient/application/use-case/get-patient-by-id.use-case.js';
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
  return {
    id: randomUUID(),
    organizationId,
    createdByMembershipId: actor,
    firstName: 'Ana',
    lastName: 'Pérez',
    birthDate: parseCivilDate('2000-02-29'),
    phone: null,
    email: null,
    sex: null,
    documentType: null,
    documentNumber: null,
    address: null,
    notes: null,
    status: 'ACTIVE',
    updatedByMembershipId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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
  let current = patient();
  const repository = {
    findById: async () => current,
    update: async (value) => (current = value),
  };
  const controller = new PatientController(
    {},
    {},
    {},
    new UpdatePatientUseCase(repository),
  );
  const principal = { organizationId, membershipId: actor };
  await controller.update(principal, current.id, {
    phone: '123',
  });
  assert.equal(PatientResponseDto.fromEntity(current).birthDate, '2000-02-29');
  await controller.update(principal, current.id, {
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
  assert.equal(writes, 0);
  const result = await useCase.execute({
    ...input,
    documentType: 'CI',
    documentNumber: '123',
  });
  assert.equal(result.documentNumber, '123');
});

test('los DTO HTTP validan nombres, sexo, correo y fecha antes de ejecutar el caso de uso', async () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const create = {
    firstName: ' Ana ',
    lastName: ' Pérez ',
  };
  const update = {};
  for (const [metatype, base] of [
    [CreatePatientDto, create],
    [UpdatePatientDto, update],
  ]) {
    const transform = (value) =>
      pipe.transform(value, { type: 'body', metatype });
    for (const key of ['firstName', 'lastName']) {
      for (const value of ['', '   ', null, 123]) {
        await assert.rejects(transform({ ...base, [key]: value }), {
          status: 400,
        });
      }
    }
    for (const invalid of [
      { sex: 'UNKNOWN' },
      { email: 'invalid' },
      { birthDate: '2025-02-29' },
      { birthDate: '2000-02-29T00:00:00Z' },
    ]) {
      await assert.rejects(transform({ ...base, ...invalid }), { status: 400 });
    }
    const result = await transform({
      ...base,
      firstName: ' Ana ',
      lastName: ' Pérez ',
    });
    assert.equal(result.firstName, 'Ana');
    assert.equal(result.lastName, 'Pérez');
  }
  const partial = await pipe.transform(update, {
    type: 'body',
    metatype: UpdatePatientDto,
  });
  assert.equal(partial.firstName, undefined);
  assert.equal(partial.lastName, undefined);
});

test('el listado HTTP valida estado y búsqueda sin aceptar organización desde el cliente', async () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = (value) =>
    pipe.transform(value, { type: 'query', metatype: ListPatientsQueryDto });
  for (const invalid of [{ status: 'UNKNOWN' }, { search: ['Ana', 'Luis'] }]) {
    await assert.rejects(transform(invalid), { status: 400 });
  }
  for (const status of ['ACTIVE', 'INACTIVE']) {
    const query = await transform({ organizationId, status, search: 'Ana' });
    assert.equal('organizationId' in query, false);
    assert.equal(query.status, status);
    assert.equal(query.search, 'Ana');
  }
  const query = await transform({ organizationId });
  assert.equal('organizationId' in query, false);
  assert.equal(query.search, undefined);
  assert.equal(query.status, undefined);
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 20);
});

test('la paginación HTTP convierte enteros y rechaza tamaños o páginas inválidas', async () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = (value) =>
    pipe.transform(value, { type: 'query', metatype: ListPatientsQueryDto });
  const query = await transform({ organizationId, page: '3', pageSize: '100' });
  assert.equal(query.page, 3);
  assert.equal(query.pageSize, 100);
  for (const field of ['page', 'pageSize']) {
    for (const value of [
      '0',
      '-1',
      '1.5',
      'abc',
      '',
      'Infinity',
      null,
      ['1', '2'],
    ]) {
      await assert.rejects(transform({ organizationId, [field]: value }), {
        status: 400,
      });
    }
  }
  await assert.rejects(transform({ organizationId, pageSize: '101' }), {
    status: 400,
  });
  await assert.rejects(
    transform({ organizationId, page: '9007199254740992' }),
    { status: 400 },
  );
});

test('el controller entrega los criterios tipados al listado y transforma la respuesta', async () => {
  const query = {
    organizationId,
    status: 'ACTIVE',
    search: 'Ana',
    page: 2,
    pageSize: 10,
  };
  const pagination = { page: 2, pageSize: 10, totalItems: 15, totalPages: 2 };
  let received;
  const controller = new PatientController(
    {
      execute: async (filters) => {
        received = filters;
        return { items: [patient()], pagination };
      },
    },
    {},
    {},
    {},
  );
  const result = await controller.list({ organizationId }, query);
  assert.deepEqual(received, query);
  assert.equal(result.items[0].fullName, 'Ana Pérez');
  assert.deepEqual(result.pagination, pagination);
});

test('el alta normaliza datos y conserva los valores por defecto sin construir una entidad', async () => {
  const useCase = new CreatePatientUseCase({
    create: async (data) => ({
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  });
  const result = await useCase.execute({
    organizationId,
    createdByMembershipId: actor,
    firstName: ' Ana ',
    lastName: ' Pérez ',
    phone: ' 123 ',
    documentType: ' ',
    documentNumber: '',
  });
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(result.phone, '123');
  for (const key of [
    'email',
    'birthDate',
    'sex',
    'documentType',
    'documentNumber',
    'address',
    'notes',
    'updatedByMembershipId',
    'deletedAt',
  ])
    assert.equal(result[key], null);
  assert.equal(result.status, 'ACTIVE');
  const response = PatientResponseDto.fromEntity(result);
  assert.equal(response.fullName, 'Ana Pérez');
  assert.equal('fullName' in result, false);
  assert.equal('deleted' in result, false);
});

test('PATCH valida el documento combinado con el existente sin mutarlo si falla', async () => {
  let current = {
    ...patient(),
    documentType: 'CI',
    documentNumber: '123',
    phone: '123',
    notes: 'Nota',
  };
  let writes = 0;
  const useCase = new UpdatePatientUseCase({
    findById: async () => current,
    update: async (data) => {
      writes++;
      current = data;
      return data;
    },
  });
  const command = {
    id: current.id,
    organizationId,
    updatedByMembershipId: actor,
  };
  const original = { ...current };
  await assert.rejects(useCase.execute({ ...command, documentType: null }), {
    status: 400,
  });
  assert.equal(writes, 0);
  assert.deepEqual(current, original);
  const result = await useCase.execute({
    ...command,
    documentNumber: ' 456 ',
    phone: null,
  });
  assert.equal(result.documentType, 'CI');
  assert.equal(result.documentNumber, '456');
  assert.equal(result.phone, null);
  assert.equal(result.notes, 'Nota');
  assert.equal(result.firstName, original.firstName);
  assert.equal(result.updatedByMembershipId, actor);
  const cleared = await useCase.execute({
    ...command,
    documentType: '',
    documentNumber: null,
  });
  assert.equal(cleared.documentType, null);
  assert.equal(cleared.documentNumber, null);
});

test('la lectura y actualización rechazan pacientes eliminados usando deletedAt', async () => {
  const current = { ...patient(), deletedAt: new Date() };
  const repository = {
    findById: async () => current,
    update: async () => assert.fail('No debe escribir'),
  };
  await assert.rejects(
    new GetPatientByIdUseCase(repository).execute(current.id, organizationId),
    { status: 404 },
  );
  await assert.rejects(
    new UpdatePatientUseCase(repository).execute({
      id: current.id,
      organizationId,
      updatedByMembershipId: actor,
    }),
    { status: 404 },
  );
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
