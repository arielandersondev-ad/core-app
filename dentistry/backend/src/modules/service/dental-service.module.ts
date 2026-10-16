import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { DentalServiceRepository } from './domain/repositories/dental-service.repository.js';
import { PrismaDentalServiceRepository } from './infrastructure/prisma-dental-service.repository.js';
import { CreateDentalServiceUseCase } from './application/use-case/create-dental-service.use-case.js';
import { ListDentalServicesUseCase } from './application/use-case/list-dental-services.use-case.js';
import { GetDentalServiceByIdUseCase } from './application/use-case/get-dental-service-by-id.use-case.js';
import { UpdateDentalServiceUseCase } from './application/use-case/update-dental-service.use-case.js';
import { ToggleDentalServiceStatusUseCase } from './application/use-case/toggle-dental-service-status.use-case.js';
import { DeleteDentalServiceUseCase } from './application/use-case/delete-dental-service.use-case.js';
import { DentalServiceController } from './presentation/http/dental-service.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [DentalServiceController],
  providers: [
    {
      provide: DentalServiceRepository,
      useClass: PrismaDentalServiceRepository,
    },
    CreateDentalServiceUseCase,
    ListDentalServicesUseCase,
    GetDentalServiceByIdUseCase,
    UpdateDentalServiceUseCase,
    ToggleDentalServiceStatusUseCase,
    DeleteDentalServiceUseCase,
  ],
  exports: [
    DentalServiceRepository,
    CreateDentalServiceUseCase,
    ListDentalServicesUseCase,
    GetDentalServiceByIdUseCase,
  ],
})
export class DentalServiceModule {}
