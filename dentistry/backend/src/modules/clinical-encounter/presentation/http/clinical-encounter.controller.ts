import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateClinicalEncounterUseCase } from '../../application/use-case/create-clinical-encounter.use-case.js';
import { ListClinicalEncountersUseCase } from '../../application/use-case/list-clinical-encounters.use-case.js';
import { GetClinicalEncounterByIdUseCase } from '../../application/use-case/get-clinical-encounter-by-id.use-case.js';
import { UpdateClinicalEncounterUseCase } from '../../application/use-case/update-clinical-encounter.use-case.js';
import { CompleteClinicalEncounterUseCase } from '../../application/use-case/complete-clinical-encounter.use-case.js';
import { CreateClinicalEncounterDto } from '../dto/create-clinical-encounter.dto.js';
import { ListClinicalEncountersQueryDto } from '../dto/list-clinical-encounters.query.dto.js';
import { UpdateClinicalEncounterDto } from '../dto/update-clinical-encounter.dto.js';
import { CompleteClinicalEncounterDto } from '../dto/complete-clinical-encounter.dto.js';

@Controller('clinical-encounters')
export class ClinicalEncounterController {
  constructor(
    private readonly createClinicalEncounterUseCase: CreateClinicalEncounterUseCase,
    private readonly listClinicalEncountersUseCase: ListClinicalEncountersUseCase,
    private readonly getClinicalEncounterByIdUseCase: GetClinicalEncounterByIdUseCase,
    private readonly updateClinicalEncounterUseCase: UpdateClinicalEncounterUseCase,
    private readonly completeClinicalEncounterUseCase: CompleteClinicalEncounterUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateClinicalEncounterDto) {
    return this.createClinicalEncounterUseCase.execute({
      organizationId: dto.organizationId,
      branchId: dto.branchId,
      patientId: dto.patientId,
      professionalMembershipId: dto.professionalMembershipId,
      appointmentId: dto.appointmentId,
      treatmentId: dto.treatmentId,
      startedAt: new Date(dto.startedAt),
      chiefComplaint: dto.chiefComplaint,
      diagnosis: dto.diagnosis,
      procedurePerformed: dto.procedurePerformed,
      evolution: dto.evolution,
      recommendations: dto.recommendations,
      notes: dto.notes,
      createdByMembershipId: dto.createdByMembershipId,
    });
  }

  @Get()
  async list(@Query() query: ListClinicalEncountersQueryDto) {
    let startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Si se pasa un parámetro de fecha específica ej. '2026-09-01', abarca todo ese día
    if (query.date && !startDate && !endDate) {
      startDate = new Date(`${query.date}T00:00:00.000Z`);
      endDate = new Date(`${query.date}T23:59:59.999Z`);
    }

    return this.listClinicalEncountersUseCase.execute({
      organizationId: query.organizationId,
      branchId: query.branchId,
      patientId: query.patientId,
      professionalMembershipId: query.professionalMembershipId,
      appointmentId: query.appointmentId,
      treatmentId: query.treatmentId,
      startDate,
      endDate,
      status: query.status,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getClinicalEncounterByIdUseCase.execute(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClinicalEncounterDto) {
    return this.updateClinicalEncounterUseCase.execute({
      id,
      chiefComplaint: dto.chiefComplaint,
      diagnosis: dto.diagnosis,
      procedurePerformed: dto.procedurePerformed,
      evolution: dto.evolution,
      recommendations: dto.recommendations,
      notes: dto.notes,
      updatedByMembershipId: dto.updatedByMembershipId,
    });
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') id: string, @Body() dto: CompleteClinicalEncounterDto) {
    return this.completeClinicalEncounterUseCase.execute({
      id,
      endedAt: dto.endedAt,
      updatedByMembershipId: dto.updatedByMembershipId,
    });
  }
}