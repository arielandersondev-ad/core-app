import { Module } from '@nestjs/common';
import { PrismaPersonRepository } from './infrastructure/prisma-person.repository.js';
import { PersonRepository } from './domain/repositories/person.repository.js';
import { CreatePersonUseCase } from './application/use-case/create-person.use-case.js';
import { ListPersonsUseCase } from './application/use-case/list-persons.use-case.js';
import { GetPersonByIdUseCase } from './application/use-case/get-person-by-id.use-case.js';
import { ConvertPersonToPatientUseCase } from './application/use-case/convert-person-to-patient.use-case.js';
import { PersonController } from './presentation/http/person.controller.js';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';

@Module({
  imports: [DentistryAuthModule],
  controllers: [PersonController],
  providers: [
    {
      provide: PersonRepository,
      useClass: PrismaPersonRepository,
    },
    CreatePersonUseCase,
    ListPersonsUseCase,
    GetPersonByIdUseCase,
    ConvertPersonToPatientUseCase,
  ],
  exports: [PersonRepository, GetPersonByIdUseCase],
})
export class PersonModule {}
