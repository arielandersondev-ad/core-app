import { Injectable } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import { PersonRepository } from '../../domain/repositories/person.repository.js';

export interface CreatePersonCommand {
  organizationId: string;
  nombreCompleto?: string;
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
}

@Injectable()
export class CreatePersonUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(command: CreatePersonCommand): Promise<Person> {
    const rawName =
      command.nombreCompleto?.trim() ||
      `${command.firstName ?? ''} ${command.lastName ?? ''}`.trim();

    if (!rawName) {
      throw new Error('El nombre completo es obligatorio.');
    }

    const person = new Person({
      organizationId: command.organizationId,
      nombreCompleto: rawName,
      phone: command.phone?.trim() || null,
      email: command.email?.trim() || null,
      notes: command.notes?.trim() || null,
      createdByMembershipId: command.createdByMembershipId,
    });

    return this.personRepository.save(person);
  }
}
