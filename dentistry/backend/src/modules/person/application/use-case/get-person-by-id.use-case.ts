import { Injectable, NotFoundException } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import { PersonRepository } from '../../domain/repositories/person.repository.js';

@Injectable()
export class GetPersonByIdUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(id: string, organizationId: string): Promise<Person> {
    const person = await this.personRepository.findById(id, organizationId);
    if (!person) {
      throw new NotFoundException('Persona no encontrada');
    }
    return person;
  }
}
