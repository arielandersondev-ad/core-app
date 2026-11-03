import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { CreatePatientUseCase } from '../../application/use-case/create-patient.use-case.js';
import { GetPatientByIdUseCase } from '../../application/use-case/get-patient-by-id.use-case.js';
import { ListPatientsUseCase } from '../../application/use-case/list-patients.use-case.js';
import { UpdatePatientUseCase } from '../../application/use-case/update-patient.use-case.js';
import { DeletePatientUseCase } from '../../application/use-case/delete-patient.use-case.js';
import { CreatePatientDto } from '../dto/create-patient.dto.js';
import { ListPatientsQueryDto } from '../dto/list-patients.query.dto.js';
import { PatientResponseDto } from '../dto/patient.response.dto.js';
import { UpdatePatientDto } from '../dto/update-patient.dto.js';
import { parseCivilDate } from '../../../../common/validation/civil-date.js';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';

@Controller('patients')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class PatientController {
  constructor(
    private readonly listPatientsUseCase: ListPatientsUseCase,
    private readonly getPatientByIdUseCase: GetPatientByIdUseCase,
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly deletePatientUseCase: DeletePatientUseCase,
  ) {}

  @Get()
  @RequirePermission('dentistry:patients:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Query() query: ListPatientsQueryDto,
  ): Promise<PaginatedResult<PatientResponseDto>> {
    const result = await this.listPatientsUseCase.execute({
      organizationId: principal.organizationId,
      search: query.search,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      items: result.items.map(PatientResponseDto.fromEntity),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  @RequirePermission('dentistry:patients:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.getPatientByIdUseCase.execute(
      id,
      principal.organizationId,
    );
    return PatientResponseDto.fromEntity(patient);
  }

  @Post()
  @RequirePermission('dentistry:patients:create')
  async create(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Body() dto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.createPatientUseCase.execute({
      organizationId: principal.organizationId,
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
      createdByMembershipId: principal.membershipId,
    });
    return PatientResponseDto.fromEntity(patient);
  }

  @Patch(':id')
  @RequirePermission('dentistry:patients:update')
  async update(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    const patient = await this.updatePatientUseCase.execute({
      id,
      organizationId: principal.organizationId,
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
      updatedByMembershipId: principal.membershipId,
    });
    return PatientResponseDto.fromEntity(patient);
  }

  @Delete(':id')
  @RequirePermission('dentistry:patients:delete')
  async delete(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.deletePatientUseCase.execute({
      id,
      organizationId: principal.organizationId,
      deletedByMembershipId: principal.membershipId,
    });
    return PatientResponseDto.fromEntity(patient);
  }
}
