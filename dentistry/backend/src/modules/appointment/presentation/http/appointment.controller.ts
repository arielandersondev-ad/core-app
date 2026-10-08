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

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
    private readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase,
    private readonly updateAppointmentStatusUseCase: UpdateAppointmentStatusUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    return this.createAppointmentUseCase.execute({
      organizationId: dto.organizationId,
      branchId: dto.branchId,
      patientId: dto.patientId,
      professionalMembershipId: dto.professionalMembershipId,
      serviceId: dto.serviceId,
      serviceIds: dto.serviceIds,
      treatmentId: dto.treatmentId,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      reason: dto.reason,
      notes: dto.notes,
      createdByMembershipId: dto.createdByMembershipId,
    });
  }

  @Get()
  async list(@Query() query: ListAppointmentsQueryDto) {
    let startDate = query.startDate ? new Date(query.startDate) : undefined;
    let endDate = query.endDate ? new Date(query.endDate) : undefined;

    // Si se pasa un parámetro de fecha específica ej. '2026-09-01', abarca todo ese día
    if (query.date && !startDate && !endDate) {
      startDate = new Date(`${query.date}T00:00:00.000Z`);
      endDate = new Date(`${query.date}T23:59:59.999Z`);
    }

    return this.listAppointmentsUseCase.execute({
      organizationId: query.organizationId,
      branchId: query.branchId,
      patientId: query.patientId,
      professionalMembershipId: query.professionalMembershipId,
      startDate,
      endDate,
      status: query.status,
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getAppointmentByIdUseCase.execute(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.updateAppointmentStatusUseCase.execute({
      id,
      status: dto.status,
      notes: dto.notes,
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.cancelAppointmentUseCase.execute({
      id,
      cancelledByMembershipId: dto.cancelledByMembershipId,
      reason: dto.reason,
    });
  }
}
