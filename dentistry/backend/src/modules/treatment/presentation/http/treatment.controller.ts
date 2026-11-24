import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequireModule } from '../../../auth/presentation/http/decorators/require-module.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryModuleGuard } from '../../../auth/presentation/http/guards/dentistry-module.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { CreateTreatmentUseCase } from '../../application/use-case/create-treatment.use-case.js';
import { GetTreatmentUseCase } from '../../application/use-case/get-treatment.use-case.js';
import { ListTreatmentsUseCase } from '../../application/use-case/list-treatments.use-case.js';
import { UpdateTreatmentUseCase } from '../../application/use-case/update-treatment.use-case.js';
import {
  CreateTreatmentDto,
  ListTreatmentsQueryDto,
  UpdateTreatmentDto,
} from '../dto/treatment.dto.js';
import { TreatmentResponseDto } from '../dto/treatment.response.dto.js';

type TreatmentPage = {
  items: TreatmentResponseDto[];
  pagination: PaginatedResult<unknown>['pagination'];
};

@Controller('patients/:patientId/treatments')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard, DentistryModuleGuard)
@RequireModule('treatments')
export class TreatmentController {
  constructor(
    private readonly listUseCase: ListTreatmentsUseCase,
    private readonly getUseCase: GetTreatmentUseCase,
    private readonly createUseCase: CreateTreatmentUseCase,
    private readonly updateUseCase: UpdateTreatmentUseCase,
  ) {}

  @Get()
  @RequirePermission('dentistry:treatments:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: ListTreatmentsQueryDto,
  ): Promise<TreatmentPage> {
    const result = await this.listUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      items: result.items.map(TreatmentResponseDto.fromEntity),
      pagination: result.pagination,
    };
  }

  @Get(':treatmentId')
  @RequirePermission('dentistry:treatments:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('treatmentId', ParseUUIDPipe) treatmentId: string,
  ): Promise<TreatmentResponseDto> {
    const treatment = await this.getUseCase.execute(
      { organizationId: principal.organizationId, patientId },
      treatmentId,
    );
    return TreatmentResponseDto.fromEntity(treatment);
  }

  @Post()
  @RequirePermission('dentistry:treatments:create')
  async create(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateTreatmentDto,
  ): Promise<TreatmentResponseDto> {
    const treatment = await this.createUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      title: dto.title,
      serviceId: dto.serviceId,
      estimatedSessions: dto.estimatedSessions,
      agreedPriceMinor: dto.agreedPriceMinor,
      currency: dto.currency,
      diagnosisSummary: dto.diagnosisSummary,
      notes: dto.notes,
      actorMembershipId: principal.membershipId,
    });
    return TreatmentResponseDto.fromEntity(treatment);
  }

  @Patch(':treatmentId')
  @RequirePermission('dentistry:treatments:update')
  async update(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('treatmentId', ParseUUIDPipe) treatmentId: string,
    @Body() dto: UpdateTreatmentDto,
  ): Promise<TreatmentResponseDto> {
    const treatment = await this.updateUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      treatmentId,
      title: dto.title,
      status: dto.status,
      estimatedSessions: dto.estimatedSessions,
      agreedPriceMinor: dto.agreedPriceMinor,
      currency: dto.currency,
      diagnosisSummary: dto.diagnosisSummary,
      notes: dto.notes,
      actorMembershipId: principal.membershipId,
    });
    return TreatmentResponseDto.fromEntity(treatment);
  }
}
