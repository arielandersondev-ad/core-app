import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { ClinicController } from './clinic.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicController],
})
export class ClinicModule {}
