import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { InventoryMovement } from '../../domain/entities/inventory-movement.entity.js';
import { InventoryRepository } from '../../domain/repositories/inventory.repository.js';

@Injectable()
export class ListInventoryMovementsUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    itemId: string,
    organizationId: string,
    authorizedBranchIds: string[],
  ): Promise<InventoryMovement[]> {
    const item = await this.inventoryRepository.findItemById(
      itemId,
      organizationId,
    );
    if (!item) {
      throw new NotFoundException('Artículo de inventario no encontrado.');
    }
    if (!authorizedBranchIds.includes(item.branchId)) {
      throw new ForbiddenException(
        'No tiene acceso a la sucursal del artículo.',
      );
    }

    return this.inventoryRepository.findMovements(
      itemId,
      organizationId,
    );
  }
}
