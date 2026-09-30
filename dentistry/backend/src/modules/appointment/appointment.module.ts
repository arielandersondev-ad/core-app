import { Module } from '@nestjs/common';
import { AppointmentRepository } from './domain/repositories/appointment.repository.js';
import { PrismaAppointmentRepository } from './infrastructure/prisma-appointment.repository.js';
import { CreateAppointmentUseCase } from './application/use-case/create-appointment.use-case.js';
import { ListAppointmentsUseCase } from './application/use-case/list-appointments.use-case.js';
import { GetAppointmentByIdUseCase } from './application/use-case/get-appointment-by-id.use-case.js';
import { UpdateAppointmentStatusUseCase } from './application/use-case/update-appointment-status.use-case.js';
import { CancelAppointmentUseCase } from './application/use-case/cancel-appointment.use-case.js';
import { AppointmentController } from './presentation/http/appointment.controller.js';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';

@Module({
  imports: [DentistryAuthModule],
  controllers: [AppointmentController],
  providers: [
    {
      provide: AppointmentRepository,
      useClass: PrismaAppointmentRepository,
    },
    CreateAppointmentUseCase,
    ListAppointmentsUseCase,
    GetAppointmentByIdUseCase,
    UpdateAppointmentStatusUseCase,
    CancelAppointmentUseCase,
  ],
  exports: [
    AppointmentRepository,
    CreateAppointmentUseCase,
    ListAppointmentsUseCase,
    GetAppointmentByIdUseCase,
  ],
})
export class AppointmentModule {}
