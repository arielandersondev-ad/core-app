import { Injectable } from '@nestjs/common';
import type { InventoryItem } from '../../domain/entities/inventory-item.entity.js';
import {
  InventoryRepository,
  type FindInventoryItemsFilters,
} from '../../domain/repositories/inventory.repository.js';

@Injectable()
export class ListInventoryItemsUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    filters: FindInventoryItemsFilters,
  ): Promise<InventoryItem[]> {
    return this.inventoryRepository.findItems(filters);
  }
}
