import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { AddClinicalEncounterProceduresUseCase } from '../../application/use-case/add-clinical-encounter-procedures.use-case.js';
import { CompleteClinicalEncounterUseCase } from '../../application/use-case/complete-clinical-encounter.use-case.js';
import { CreateClinicalEncounterUseCase } from '../../application/use-case/create-clinical-encounter.use-case.js';
import { GetClinicalEncounterUseCase } from '../../application/use-case/get-clinical-encounter.use-case.js';
import { GetEncounterReferenceDataUseCase } from '../../application/use-case/get-encounter-reference-data.use-case.js';
import { ListClinicalEncountersUseCase } from '../../application/use-case/list-clinical-encounters.use-case.js';
import { VoidClinicalEncounterUseCase } from '../../application/use-case/void-clinical-encounter.use-case.js';
import type { EncounterReferenceData } from '../../domain/repositories/clinical-encounter.repository.js';
import {
  AddClinicalEncounterProceduresDto,
  CompleteClinicalEncounterDto,
  CreateClinicalEncounterDto,
  ListClinicalEncountersQueryDto,
  VoidClinicalEncounterDto,
} from '../dto/clinical-encounter.dto.js';
import {
  ClinicalEncounterProcedureResponseDto,
  ClinicalEncounterResponseDto,
} from '../dto/clinical-encounter.response.dto.js';

type ClinicalEncounterPage = {
  items: ClinicalEncounterResponseDto[];
  pagination: PaginatedResult<unknown>['pagination'];
};

@Controller('patients/:patientId/clinical-encounters')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class ClinicalEncounterController {
  constructor(
    private readonly listUseCase: ListClinicalEncountersUseCase,
    private readonly getUseCase: GetClinicalEncounterUseCase,
    private readonly createUseCase: CreateClinicalEncounterUseCase,
    private readonly addProceduresUseCase: AddClinicalEncounterProceduresUseCase,
    private readonly completeUseCase: CompleteClinicalEncounterUseCase,
    private readonly voidUseCase: VoidClinicalEncounterUseCase,
    private readonly referenceDataUseCase: GetEncounterReferenceDataUseCase,
  ) {}

  @Get()
  @RequirePermission('dentistry:encounters:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: ListClinicalEncountersQueryDto,
  ): Promise<ClinicalEncounterPage> {
    const result = await this.listUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      authorizedBranchIds: principal.branchIds,
      status: query.status,
      practitionerMembershipId: query.practitionerMembershipId,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      items: result.items.map(ClinicalEncounterResponseDto.fromEntity),
      pagination: result.pagination,
    };
  }

  // Debe declararse antes de `:encounterId`: "reference-data" no es un UUID.
  @Get('reference-data')
  @RequirePermission('dentistry:encounters:read')
  referenceData(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<EncounterReferenceData> {
    return this.referenceDataUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      authorizedBranchIds: principal.branchIds,
      membershipId: principal.membershipId,
    });
  }

  @Get(':encounterId')
  @RequirePermission('dentistry:encounters:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
  ): Promise<ClinicalEncounterResponseDto> {
    const encounter = await this.getUseCase.execute(
      { organizationId: principal.organizationId, patientId },
      encounterId,
      principal.branchIds,
    );
    return ClinicalEncounterResponseDto.fromEntity(encounter);
  }

  @Post()
  @RequirePermission('dentistry:encounters:create')
  async create(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateClinicalEncounterDto,
  ): Promise<ClinicalEncounterResponseDto> {
    const encounter = await this.createUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      bodyPatientId: dto.patientId,
      authorizedBranchIds: principal.branchIds,
      branchId: dto.branchId,
      appointmentId: dto.appointmentId,
      treatmentId: dto.treatmentId,
      startedAt: new Date(dto.startedAt),
      chiefComplaint: dto.chiefComplaint,
      examinationSummary: dto.examinationSummary,
      diagnosisSummary: dto.diagnosisSummary,
      procedureSummary: dto.procedureSummary,
      progressNotes: dto.progressNotes,
      patientInstructions: dto.patientInstructions,
      notes: dto.notes,
      actorMembershipId: principal.membershipId,
    });
    return ClinicalEncounterResponseDto.fromEntity(encounter);
  }

  @Post(':encounterId/procedures')
  @RequirePermission('dentistry:encounters:update')
  async addProcedures(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: AddClinicalEncounterProceduresDto,
  ): Promise<ClinicalEncounterProcedureResponseDto[]> {
    const procedures = await this.addProceduresUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      encounterId,
      authorizedBranchIds: principal.branchIds,
      procedures: dto.procedures,
      actorMembershipId: principal.membershipId,
    });
    return procedures.map(ClinicalEncounterProcedureResponseDto.fromEntity);
  }

  @Post(':encounterId/complete')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:encounters:update')
  async complete(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CompleteClinicalEncounterDto,
  ): Promise<ClinicalEncounterResponseDto> {
    const encounter = await this.completeUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      encounterId,
      authorizedBranchIds: principal.branchIds,
      endedAt: new Date(dto.endedAt),
      procedureSummary: dto.procedureSummary,
      actorMembershipId: principal.membershipId,
    });
    return ClinicalEncounterResponseDto.fromEntity(encounter);
  }

  @Post(':encounterId/void')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:encounters:void')
  async void(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: VoidClinicalEncounterDto,
  ): Promise<ClinicalEncounterResponseDto> {
    const encounter = await this.voidUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      encounterId,
      authorizedBranchIds: principal.branchIds,
      reason: dto.reason,
      actorMembershipId: principal.membershipId,
    });
    return ClinicalEncounterResponseDto.fromEntity(encounter);
  }
}
