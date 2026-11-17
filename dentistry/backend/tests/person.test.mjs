import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Person } from '../dist/modules/person/domain/entities/person.entity.js';
import { CreatePersonUseCase } from '../dist/modules/person/application/use-case/create-person.use-case.js';
import { CreatePersonDto } from '../dist/modules/person/presentation/dto/create-person.dto.js';
import { PersonResponseDto } from '../dist/modules/person/presentation/dto/person.response.dto.js';
import { toPersonEntity } from '../dist/modules/person/infrastructure/person.mapper.js';

const actor = randomUUID();
const organizationId = randomUUID();

test('1. Person entity: creación con nombreCompleto y teléfono opcional', () => {
  // Error si no se pasa nombre
  assert.throws(
    () =>
      new Person({
        organizationId,
        nombreCompleto: '',
        createdByMembershipId: actor,
      }),
    /El nombre de la persona es obligatorio/,
  );

  assert.throws(
    () =>
      new Person({
        organizationId,
        nombreCompleto: '    ',
        createdByMembershipId: actor,
      }),
    /El nombre de la persona es obligatorio/,
  );

  // Creación solo con nombreCompleto (sin teléfono)
  const person = new Person({
    organizationId,
    nombreCompleto: 'Carlos Mendoza',
    createdByMembershipId: actor,
  });

  assert.equal(person.nombreCompleto, 'Carlos Mendoza');
  assert.equal(person.fullName, 'Carlos Mendoza');
  assert.equal(person.firstName, 'Carlos');
  assert.equal(person.lastName, 'Mendoza');
  assert.equal(person.phone, null);
  assert.equal(person.email, null);
  assert.equal(person.isConverted, false);

  // Creación con un solo nombre de una palabra
  const personSingle = new Person({
    organizationId,
    nombreCompleto: 'Mariana',
    createdByMembershipId: actor,
  });

  assert.equal(personSingle.nombreCompleto, 'Mariana');
  assert.equal(personSingle.fullName, 'Mariana');
  assert.equal(personSingle.firstName, 'Mariana');
  assert.equal(personSingle.lastName, '');
  assert.equal(personSingle.phone, null);

  // Creación con nombreCompleto y teléfono
  const personWithPhone = new Person({
    organizationId,
    nombreCompleto: 'Juan Carlos Gómez',
    phone: '+591 71234567',
    notes: 'Registro inicial rápido',
    createdByMembershipId: actor,
  });

  assert.equal(personWithPhone.nombreCompleto, 'Juan Carlos Gómez');
  assert.equal(personWithPhone.firstName, 'Juan');
  assert.equal(personWithPhone.lastName, 'Carlos Gómez');
  assert.equal(personWithPhone.phone, '+591 71234567');
  assert.equal(personWithPhone.notes, 'Registro inicial rápido');

  // Conversión
  const patientId = randomUUID();
  personWithPhone.markAsConverted(patientId, actor);
  assert.equal(personWithPhone.isConverted, true);
  assert.equal(personWithPhone.convertedToPatientId, patientId);
});

test('2. CreatePersonDto: validación estricta de nombreCompleto y opcionalidad de teléfono', async () => {
  // Rechaza nombreCompleto vacío
  const invalidEmpty = plainToInstance(CreatePersonDto, {
    nombreCompleto: '',
  });
  const errorsEmpty = await validate(invalidEmpty);
  assert.ok(errorsEmpty.some((e) => e.property === 'nombreCompleto'));

  // Rechaza email inválido
  const invalidEmail = plainToInstance(CreatePersonDto, {
    nombreCompleto: 'Lucía Fernández',
    email: 'formato-invalido',
  });
  const errorsEmail = await validate(invalidEmail);
  assert.ok(errorsEmail.some((e) => e.property === 'email'));

  // Válido enviando únicamente nombreCompleto
  const validOnlyName = plainToInstance(CreatePersonDto, {
    nombreCompleto: 'Lucía Fernández',
  });
  const errorsValidOnlyName = await validate(validOnlyName);
  assert.equal(errorsValidOnlyName.length, 0);

  // Válido enviando nombreCompleto y teléfono
  const validWithPhone = plainToInstance(CreatePersonDto, {
    nombreCompleto: 'Lucía Fernández',
    phone: '70011223',
    notes: 'Paciente derivada',
  });
  const errorsValidWithPhone = await validate(validWithPhone);
  assert.equal(errorsValidWithPhone.length, 0);
});

test('3. CreatePersonUseCase: flujo completo de creación con nombreCompleto', async () => {
  let savedPerson = null;
  const mockRepo = {
    save: async (p) => {
      savedPerson = p;
      return p;
    },
    findById: async () => null,
    list: async () => [],
    markAsConverted: async () => {},
  };

  const useCase = new CreatePersonUseCase(mockRepo);

  // Ejecución solo con nombreCompleto
  const result = await useCase.execute({
    organizationId,
    nombreCompleto: 'Rodrigo Morales',
    createdByMembershipId: actor,
  });

  assert.ok(result);
  assert.equal(result.nombreCompleto, 'Rodrigo Morales');
  assert.equal(result.fullName, 'Rodrigo Morales');
  assert.equal(result.phone, null);
  assert.equal(savedPerson.fullName, 'Rodrigo Morales');
  assert.equal(savedPerson.phone, null);

  // Ejecución con teléfono y notas
  const result2 = await useCase.execute({
    organizationId,
    nombreCompleto: 'Valeria Castro',
    phone: '+591 76543210',
    email: 'valeria@example.com',
    notes: 'Contacto por WhatsApp',
    createdByMembershipId: actor,
  });

  assert.ok(result2);
  assert.equal(result2.nombreCompleto, 'Valeria Castro');
  assert.equal(result2.phone, '+591 76543210');
  assert.equal(result2.email, 'valeria@example.com');
  assert.equal(result2.notes, 'Contacto por WhatsApp');
});

test('4. PersonResponseDto: serializa nombreCompleto, fullName y phone nullable', () => {
  const person = new Person({
    id: randomUUID(),
    organizationId,
    nombreCompleto: 'Gabriel Romero',
    phone: null,
    createdByMembershipId: actor,
  });

  const dto = PersonResponseDto.fromDomain(person);
  assert.equal(dto.id, person.id);
  assert.equal(dto.nombreCompleto, 'Gabriel Romero');
  assert.equal(dto.fullName, 'Gabriel Romero');
  assert.equal(dto.phone, null);
});

test('5. PersonMapper: mapea filas de base de datos con teléfono y apellido nulos', () => {
  const row = {
    id: randomUUID(),
    organizationId,
    firstName: 'Elena',
    lastName: null,
    phone: null,
    email: null,
    notes: null,
    convertedToPatientId: null,
    convertedAt: null,
    createdByMembershipId: actor,
    updatedByMembershipId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const entity = toPersonEntity(row);
  assert.equal(entity.firstName, 'Elena');
  assert.equal(entity.lastName, '');
  assert.equal(entity.fullName, 'Elena');
  assert.equal(entity.phone, null);
});
