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
import { TimeZoneResolver } from '../../../../common/infrastructure/time-zone.resolver.js';
import { endOfDayIn, startOfDayIn } from '../../../../common/time/zoned-time.js';
import { needsTimeZone, parseZonedInstant } from '../../../../common/validation/zoned-instant.js';

const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/;

@Controller('appointments')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
    private readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase,
    private readonly updateAppointmentStatusUseCase: UpdateAppointmentStatusUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly timeZones: TimeZoneResolver,
  ) {}

  @Post()
  @RequirePermission('dentistry:appointments:create')
  async create(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Body() dto: CreateAppointmentDto,
  ) {
    // Sin zona explícita, la hora es la de pared de la sucursal de la cita.
    const timeZone = needsTimeZone(dto.scheduledStartAt, dto.scheduledEndAt)
      ? await this.timeZones.forBranch(principal.organizationId, dto.branchId)
      : 'UTC';
    return this.createAppointmentUseCase.execute({
      organizationId: principal.organizationId,
      branchId: dto.branchId,
      authorizedBranchIds: principal.branchIds,
      patientId: dto.patientId,
      personId: dto.personId,
      practitionerMembershipId: dto.practitionerMembershipId,
      serviceId: dto.serviceId,
      serviceIds: dto.serviceIds,
      treatmentId: dto.treatmentId,
      scheduledStartAt: parseZonedInstant(dto.scheduledStartAt, timeZone, 'scheduledStartAt'),
      scheduledEndAt: parseZonedInstant(dto.scheduledEndAt, timeZone, 'scheduledEndAt'),
      reason: dto.reason,
      notes: dto.notes,
      createdByMembershipId: principal.membershipId,
    });
  }

  @Get()
  @RequirePermission('dentistry:appointments:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Query() query: ListAppointmentsQueryDto,
  ) {
    if (query.branchId && !principal.branchIds.includes(query.branchId)) {
      throw new ForbiddenException('No tiene acceso a la sucursal indicada.');
    }
    // Fechas sin zona: hora de pared de la sucursal filtrada o de la organización.
    const timeZone = needsTimeZone(query.startDate, query.endDate)
      ? query.branchId
        ? await this.timeZones.forBranch(principal.organizationId, query.branchId)
        : await this.timeZones.forOrganization(principal.organizationId)
      : 'UTC';
    const startDate = query.startDate
      ? CIVIL_DATE.test(query.startDate)
        ? (startOfDayIn(query.startDate, timeZone) ?? undefined)
        : parseZonedInstant(query.startDate, timeZone, 'startDate')
      : undefined;
    const endDate = query.endDate
      ? CIVIL_DATE.test(query.endDate)
        ? (endOfDayIn(query.endDate, timeZone) ?? undefined)
        : parseZonedInstant(query.endDate, timeZone, 'endDate')
      : undefined;
    // `date=YYYY-MM-DD`: el día completo en la zona de la sucursal de cada cita.
    const civilDate = query.date && !startDate && !endDate ? query.date : undefined;

    return this.listAppointmentsUseCase.execute({
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      branchId: query.branchId,
      patientId: query.patientId,
      practitionerMembershipId: query.practitionerMembershipId,
      startDate,
      endDate,
      civilDate,
      status: query.status,
    });
  }

  @Get(':id')
  @RequirePermission('dentistry:appointments:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getAppointmentByIdUseCase.execute(
      id,
      principal.organizationId,
      principal.branchIds,
    );
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
      updatedByMembershipId: principal.membershipId,
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
      canceledByMembershipId: principal.membershipId,
      reason: dto.reason,
    });
  }
}
