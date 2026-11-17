import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { parseCivilDate } from '../../../../common/validation/civil-date.js';
import { CreatePersonUseCase } from '../../application/use-case/create-person.use-case.js';
import { ListPersonsUseCase } from '../../application/use-case/list-persons.use-case.js';
import { GetPersonByIdUseCase } from '../../application/use-case/get-person-by-id.use-case.js';
import { ConvertPersonToPatientUseCase } from '../../application/use-case/convert-person-to-patient.use-case.js';
import { CreatePersonDto } from '../dto/create-person.dto.js';
import { ConvertPersonToPatientDto } from '../dto/convert-person-to-patient.dto.js';
import { PersonResponseDto } from '../dto/person.response.dto.js';
import { PatientResponseDto } from '../../../patient/presentation/dto/patient.response.dto.js';

@Controller('persons')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class PersonController {
  constructor(
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly listPersonsUseCase: ListPersonsUseCase,
    private readonly getPersonByIdUseCase: GetPersonByIdUseCase,
    private readonly convertPersonToPatientUseCase: ConvertPersonToPatientUseCase,
  ) {}

  @Post()
  @RequirePermission('dentistry:appointments:create')
  async create(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Body() dto: CreatePersonDto,
  ): Promise<PersonResponseDto> {
    const resolvedName =
      dto.nombreCompleto?.trim() ||
      dto.fullName?.trim() ||
      `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim();

    const person = await this.createPersonUseCase.execute({
      organizationId: principal.organizationId,
      nombreCompleto: resolvedName,
      phone: dto.phone,
      email: dto.email,
      notes: dto.notes,
      createdByMembershipId: principal.membershipId,
    });
    return PersonResponseDto.fromDomain(person);
  }

  @Get()
  @RequirePermission('dentistry:appointments:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Query('search') search?: string,
    @Query('onlyUnconverted') onlyUnconverted?: string,
  ): Promise<PersonResponseDto[]> {
    const persons = await this.listPersonsUseCase.execute({
      organizationId: principal.organizationId,
      search,
      onlyUnconverted: onlyUnconverted === 'true',
    });
    return persons.map(PersonResponseDto.fromDomain);
  }

  @Get(':id')
  @RequirePermission('dentistry:appointments:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PersonResponseDto> {
    const person = await this.getPersonByIdUseCase.execute(
      id,
      principal.organizationId,
    );
    return PersonResponseDto.fromDomain(person);
  }

  @Post(':id/convert')
  @RequirePermission('dentistry:patients:create')
  async convert(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertPersonToPatientDto,
  ) {
    const result = await this.convertPersonToPatientUseCase.execute({
      organizationId: principal.organizationId,
      personId: id,
      membershipId: principal.membershipId,
      patientData: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        birthDate: parseCivilDate(dto.birthDate),
        sex: dto.sex,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        address: dto.address,
        notes: dto.notes,
      },
    });

    return {
      patient: PatientResponseDto.fromEntity(result.patient),
      reassignedAppointmentsCount: result.reassignedAppointmentsCount,
    };
  }
}
