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
import { CreateAppointmentUseCase } from '../../application/use-case/create-appointment.use-case.js';
import { ListAppointmentsUseCase } from '../../application/use-case/list-appointments.use-case.js';
import { GetAppointmentByIdUseCase } from '../../application/use-case/get-appointment-by-id.use-case.js';
import { UpdateAppointmentStatusUseCase } from '../../application/use-case/update-appointment-status.use-case.js';
import { CancelAppointmentUseCase } from '../../application/use-case/cancel-appointment.use-case.js';
import { CreateAppointmentDto } from '../dto/create-appointment.dto.js';
import { ListAppointmentsQueryDto } from '../dto/list-appointments.query.dto.js';
import { UpdateAppointmentStatusDto } from '../dto/update-appointment-status.dto.js';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto.js';
import { ForbiddenException, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';

@Controller('appointments')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
    private readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase,
    private readonly updateAppointmentStatusUseCase: UpdateAppointmentStatusUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
  ) {}

  @Post()
  @RequirePermission('dentistry:appointments:create')
  async create(@CurrentPrincipal() principal: DentistryPrincipal, @Body() dto: CreateAppointmentDto) {
    return this.createAppointmentUseCase.execute({
      organizationId: principal.organizationId,
      branchId: dto.branchId,
      authorizedBranchIds: principal.branchIds,
      patientId: dto.patientId,
      professionalMembershipId: dto.professionalMembershipId,
      serviceId: dto.serviceId,
      serviceIds: dto.serviceIds,
      treatmentId: dto.treatmentId,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      reason: dto.reason,
      notes: dto.notes,
      createdByMembershipId: principal.membershipId,
    });
  }

  @Get()
  @RequirePermission('dentistry:appointments:read')
  async list(@CurrentPrincipal() principal: DentistryPrincipal, @Query() query: ListAppointmentsQueryDto) {
    if (query.branchId && !principal.branchIds.includes(query.branchId)) {
      throw new ForbiddenException('No tiene acceso a la sucursal indicada.');
    }
    let startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Si se pasa un parámetro de fecha específica ej. '2026-09-01', abarca todo ese día
    if (query.date && !startDate && !endDate) {
      startDate = new Date(`${query.date}T00:00:00.000Z`);
      endDate = new Date(`${query.date}T23:59:59.999Z`);
    }

    return this.listAppointmentsUseCase.execute({
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      branchId: query.branchId,
      patientId: query.patientId,
      professionalMembershipId: query.professionalMembershipId,
      startDate,
      endDate,
      status: query.status,
    });
  }

  @Get(':id')
  @RequirePermission('dentistry:appointments:read')
  async getById(@CurrentPrincipal() principal: DentistryPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.getAppointmentByIdUseCase.execute(id, principal.organizationId, principal.branchIds);
  }

  @Patch(':id/status')
  @RequirePermission('dentistry:appointments:update')
  async updateStatus(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.updateAppointmentStatusUseCase.execute({
      id,
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      status: dto.status,
      notes: dto.notes,
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:appointments:cancel')
  async cancel(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.cancelAppointmentUseCase.execute({
      id,
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      cancelledByMembershipId: principal.membershipId,
      reason: dto.reason,
    });
  }
}
