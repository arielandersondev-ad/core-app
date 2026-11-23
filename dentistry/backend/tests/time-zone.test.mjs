import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  civilDateIn,
  endOfDayIn,
  hasExplicitOffset,
  parseInstantIn,
  pickTimeZone,
  startOfDayIn,
} from '../dist/common/time/zoned-time.js';
import { TimeZoneResolver } from '../dist/common/infrastructure/time-zone.resolver.js';
import { AppointmentController } from '../dist/modules/appointment/presentation/http/appointment.controller.js';
import { PrismaAppointmentRepository } from '../dist/modules/appointment/infrastructure/prisma-appointment.repository.js';
import { DentistryAuthController } from '../dist/modules/auth/presentation/http/dentistry-auth.controller.js';

const LA_PAZ = 'America/La_Paz'; // UTC-4, sin horario de verano
const LIMA = 'America/Lima'; // UTC-5

test('zoned-time: hora de pared ↔ instante en la zona indicada', () => {
  assert.equal(parseInstantIn('2026-11-22T09:00', LA_PAZ).toISOString(), '2026-11-22T13:00:00.000Z');
  assert.equal(parseInstantIn('2026-11-22T09:00:00', LIMA).toISOString(), '2026-11-22T14:00:00.000Z');
  // Con zona explícita se respeta el instante recibido.
  assert.equal(parseInstantIn('2026-11-22T09:00:00.000Z', LA_PAZ).toISOString(), '2026-11-22T09:00:00.000Z');
  assert.equal(parseInstantIn('2026-11-22T09:00:00-04:00', LIMA).toISOString(), '2026-11-22T13:00:00.000Z');
  // Fechas imposibles o sin hora no son instantes.
  assert.equal(parseInstantIn('2026-02-30T09:00', LA_PAZ), null);
  assert.equal(parseInstantIn('2026-11-22', LA_PAZ), null);
  assert.equal(parseInstantIn('ayer', LA_PAZ), null);

  assert.equal(hasExplicitOffset('2026-11-22T09:00Z'), true);
  assert.equal(hasExplicitOffset('2026-11-22T09:00+05:30'), true);
  assert.equal(hasExplicitOffset('2026-11-22T09:00'), false);
  assert.equal(hasExplicitOffset('2026-11-22'), false);
});

test('zoned-time: día civil y cruce de medianoche', () => {
  // 21:30 en La Paz sigue siendo el 22 aunque en UTC ya sea el 23.
  assert.equal(civilDateIn(new Date('2026-11-23T01:30:00Z'), LA_PAZ), '2026-11-22');
  assert.equal(civilDateIn(new Date('2026-11-23T01:30:00Z'), 'UTC'), '2026-11-23');
  assert.equal(startOfDayIn('2026-11-22', LA_PAZ).toISOString(), '2026-11-22T04:00:00.000Z');
  assert.equal(endOfDayIn('2026-11-22', LA_PAZ).toISOString(), '2026-11-23T03:59:59.999Z');
  // Respeta cambios de horario (Santiago pasa a UTC-3 en septiembre).
  assert.equal(parseInstantIn('2026-12-15T09:00', 'America/Santiago').toISOString(), '2026-12-15T12:00:00.000Z');
  assert.equal(parseInstantIn('2026-06-15T09:00', 'America/Santiago').toISOString(), '2026-06-15T13:00:00.000Z');
});

test('zoned-time: zona inválida o vacía cae en la siguiente candidata', () => {
  assert.equal(pickTimeZone('', 'Marte/Olympus', LA_PAZ), LA_PAZ);
  assert.equal(pickTimeZone(null, undefined), 'UTC');
});

function fakePrisma({ organizationZone = LA_PAZ, branches = {}, appointments = [] } = {}) {
  const organizationId = 'org';
  const branchRows = Object.entries(branches).map(([id, timezone]) => ({ id, organizationId, timezone }));
  return {
    orm: {
      core: {
        Organization: { first: async () => ({ id: organizationId, timezone: organizationZone }) },
        Branch: {
          first: async ({ id }) => branchRows.find((row) => row.id === id) ?? null,
          where: () => ({ where: () => ({ all: async () => branchRows }) }),
        },
      },
      dentistry: {
        Appointment: { where: () => ({ all: async () => appointments }) },
      },
    },
  };
}

test('resolver: la sucursal manda; sin zona válida se usa la de la organización', async () => {
  const resolver = new TimeZoneResolver(fakePrisma({ branches: { lima: LIMA, vacia: '' } }));
  assert.equal(await resolver.forBranch('org', 'lima'), LIMA);
  assert.equal(await resolver.forBranch('org', 'vacia'), LA_PAZ);
  assert.equal(await resolver.forBranch('org', 'inexistente'), LA_PAZ);
  const zones = await resolver.forBranches('org', ['lima', 'vacia']);
  assert.equal(zones.organization, LA_PAZ);
  assert.deepEqual(Object.fromEntries(zones.branches), { lima: LIMA, vacia: LA_PAZ });
});

test('citas: una hora sin zona se guarda como hora de la sucursal', async () => {
  const branchId = randomUUID();
  const resolver = new TimeZoneResolver(fakePrisma({ branches: { [branchId]: LIMA } }));
  let command = null;
  const controller = new AppointmentController(
    { execute: async (cmd) => (command = cmd) },
    {}, {}, {}, {},
    resolver,
  );
  const principal = { membershipId: randomUUID(), organizationId: 'org', branchIds: [branchId], permissions: [] };

  await controller.create(principal, {
    branchId,
    patientId: randomUUID(),
    scheduledStartAt: '2026-11-22T09:00',
    scheduledEndAt: '2026-11-22T09:30',
  });
  assert.equal(command.scheduledStartAt.toISOString(), '2026-11-22T14:00:00.000Z');
  assert.equal(command.scheduledEndAt.toISOString(), '2026-11-22T14:30:00.000Z');

  // Un instante con zona explícita no se reinterpreta.
  await controller.create(principal, {
    branchId,
    patientId: randomUUID(),
    scheduledStartAt: '2026-11-22T13:00:00.000Z',
    scheduledEndAt: '2026-11-22T13:30:00.000Z',
  });
  assert.equal(command.scheduledStartAt.toISOString(), '2026-11-22T13:00:00.000Z');

  await assert.rejects(
    controller.create(principal, { branchId, scheduledStartAt: '2026-11-31T09:00', scheduledEndAt: '2026-11-31T10:00' }),
    (error) => error.getStatus?.() === 400,
  );
});

test('citas: ?date= es el día de calendario de la sucursal de cada cita', async () => {
  const laPaz = randomUUID();
  const lima = randomUUID();
  const row = (branchId, startIso) => ({
    id: randomUUID(),
    organizationId: 'org',
    branchId,
    patientId: randomUUID(),
    practitionerMembershipId: null,
    scheduledStartAt: new Date(startIso),
    scheduledEndAt: new Date(new Date(startIso).getTime() + 30 * 60000),
    status: 'SCHEDULED',
    rowVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const appointments = [
    row(laPaz, '2026-11-22T04:00:00Z'), // 00:00 del 22 en La Paz → entra
    row(laPaz, '2026-11-23T01:30:00Z'), // 21:30 del 22 en La Paz → entra (en UTC ya es 23)
    row(laPaz, '2026-11-22T03:59:00Z'), // 23:59 del 21 en La Paz → fuera
    row(lima, '2026-11-23T04:30:00Z'), // 23:30 del 22 en Lima → entra
    row(lima, '2026-11-23T05:00:00Z'), // 00:00 del 23 en Lima → fuera
  ];
  const prisma = fakePrisma({ branches: { [laPaz]: LA_PAZ, [lima]: LIMA }, appointments });
  const repository = new PrismaAppointmentRepository(prisma, new TimeZoneResolver(prisma));

  const found = await repository.findByFilters({
    organizationId: 'org',
    authorizedBranchIds: [laPaz, lima],
    civilDate: '2026-11-22',
  });
  assert.deepEqual(
    found.map((appointment) => appointment.scheduledStartAt.toISOString()),
    ['2026-11-22T04:00:00.000Z', '2026-11-23T01:30:00.000Z', '2026-11-23T04:30:00.000Z'],
  );
});

test('citas: startDate/endDate sin zona usan la sucursal filtrada', async () => {
  const branchId = randomUUID();
  const resolver = new TimeZoneResolver(fakePrisma({ branches: { [branchId]: LIMA } }));
  let filters = null;
  const controller = new AppointmentController(
    {},
    { execute: async (received) => (filters = received) },
    {}, {}, {},
    resolver,
  );
  const principal = { membershipId: 'm', organizationId: 'org', branchIds: [branchId], permissions: [] };

  await controller.list(principal, { branchId, startDate: '2026-11-22', endDate: '2026-11-22' });
  assert.equal(filters.startDate.toISOString(), '2026-11-22T05:00:00.000Z');
  assert.equal(filters.endDate.toISOString(), '2026-11-23T04:59:59.999Z');
  assert.equal(filters.civilDate, undefined);

  await controller.list(principal, { date: '2026-11-22' });
  assert.equal(filters.civilDate, '2026-11-22');
  assert.equal(filters.startDate, undefined);
});

test('/auth/me informa la zona de la organización y la de cada sucursal', async () => {
  const branchId = randomUUID();
  const controller = new DentistryAuthController(
    { read: async () => null },
    new TimeZoneResolver(fakePrisma({ branches: { [branchId]: LIMA } })),
  );
  const me = await controller.me({
    sub: 'user',
    membershipId: 'm',
    organizationId: 'org',
    branchIds: [branchId],
    permissions: [],
  });
  assert.equal(me.context.timeZone, LA_PAZ);
  assert.deepEqual(me.context.branchTimeZones, { [branchId]: LIMA });
});
