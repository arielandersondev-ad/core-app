import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { InventoryItem } from '../../domain/entities/inventory-item.entity.js';
import { InventoryRepository } from '../../domain/repositories/inventory.repository.js';

@Injectable()
export class DeleteInventoryItemUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    id: string,
    organizationId: string,
    authorizedBranchIds: string[],
    deletedByMembershipId: string,
  ): Promise<InventoryItem> {
    const current = await this.inventoryRepository.findItemById(
      id,
      organizationId,
    );
    if (!current) {
      throw new NotFoundException('Artículo de inventario no encontrado.');
    }
    if (!authorizedBranchIds.includes(current.branchId)) {
      throw new ForbiddenException(
        'No tiene acceso a la sucursal del artículo.',
      );
    }

    const deleted = await this.inventoryRepository.softDeleteItem(
      id,
      organizationId,
      deletedByMembershipId,
    );
    if (!deleted) {
      throw new NotFoundException('Artículo de inventario no encontrado.');
    }
    return deleted;
  }
}
