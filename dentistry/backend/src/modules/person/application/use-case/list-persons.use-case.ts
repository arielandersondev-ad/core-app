import { Injectable } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import {
  ListPersonsFilter,
  PersonRepository,
} from '../../domain/repositories/person.repository.js';

@Injectable()
export class ListPersonsUseCase {
  constructor(private readonly personRepository: PersonRepository) {}

  async execute(filter: ListPersonsFilter): Promise<Person[]> {
    return this.personRepository.list(filter);
  }
}
