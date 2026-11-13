import { Module } from '@nestjs/common';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';
import { CreateInventoryItemUseCase } from './application/use-case/create-inventory-item.use-case.js';
import { DeleteInventoryItemUseCase } from './application/use-case/delete-inventory-item.use-case.js';
import { ListInventoryItemsUseCase } from './application/use-case/list-inventory-items.use-case.js';
import { ListInventoryMovementsUseCase } from './application/use-case/list-inventory-movements.use-case.js';
import { RegisterInventoryMovementUseCase } from './application/use-case/register-inventory-movement.use-case.js';
import { UpdateInventoryItemUseCase } from './application/use-case/update-inventory-item.use-case.js';
import { InventoryRepository } from './domain/repositories/inventory.repository.js';
import { PrismaInventoryRepository } from './infrastructure/prisma-inventory.repository.js';
import { InventoryController } from './presentation/http/inventory.controller.js';

@Module({
  imports: [DentistryAuthModule],
  controllers: [InventoryController],
  providers: [
    {
      provide: InventoryRepository,
      useClass: PrismaInventoryRepository,
    },
    ListInventoryItemsUseCase,
    CreateInventoryItemUseCase,
    UpdateInventoryItemUseCase,
    DeleteInventoryItemUseCase,
    ListInventoryMovementsUseCase,
    RegisterInventoryMovementUseCase,
  ],
  exports: [InventoryRepository],
})
export class InventoryModule {}
