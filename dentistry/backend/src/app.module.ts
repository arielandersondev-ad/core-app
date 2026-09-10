import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { AppointmentModule } from './modules/appointment/appointment.module.js';

@Module({
  imports: [PrismaModule, AppointmentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
