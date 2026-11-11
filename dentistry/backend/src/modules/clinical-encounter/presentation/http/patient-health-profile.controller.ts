import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { GetPatientHealthProfileUseCase } from '../../application/use-case/get-patient-health-profile.use-case.js';
import { SavePatientHealthProfileUseCase } from '../../application/use-case/save-patient-health-profile.use-case.js';
import {
  PatientHealthProfileResponseDto,
  SavePatientHealthProfileDto,
} from '../dto/patient-health-profile.dto.js';

/** P3/P5: PATCH (compatible con el BFF) y permisos `dentistry:encounters:*`. */
@Controller('patients/:patientId/health-profile')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class PatientHealthProfileController {
  constructor(
    private readonly getUseCase: GetPatientHealthProfileUseCase,
    private readonly saveUseCase: SavePatientHealthProfileUseCase,
  ) {}

  @Get()
  @RequirePermission('dentistry:encounters:read')
  async get(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientHealthProfileResponseDto> {
    const profile = await this.getUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
    });
    return PatientHealthProfileResponseDto.fromEntity(profile);
  }

  @Patch()
  @RequirePermission('dentistry:encounters:update')
  async save(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: SavePatientHealthProfileDto,
  ): Promise<PatientHealthProfileResponseDto> {
    const profile = await this.saveUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      medicalHistory: dto.medicalHistory,
      allergies: dto.allergies,
      currentMedications: dto.currentMedications,
      dentalHistory: dto.dentalHistory,
      relevantConditions: dto.relevantConditions,
      observations: dto.observations,
      rowVersion: dto.rowVersion,
      actorMembershipId: principal.membershipId,
    });
    return PatientHealthProfileResponseDto.fromEntity(profile);
  }
}
