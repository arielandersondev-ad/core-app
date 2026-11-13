import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InventoryItem } from '../../domain/entities/inventory-item.entity.js';
import { InventoryRepository } from '../../domain/repositories/inventory.repository.js';

export interface CreateInventoryItemCommand {
  organizationId: string;
  authorizedBranchIds: string[];
  branchId: string;
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  unit: string;
  minStock?: number;
  currentStock?: number;
  unitCostMinor?: number | null;
  currency?: string;
  createdByMembershipId: string;
}

@Injectable()
export class CreateInventoryItemUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    command: CreateInventoryItemCommand,
  ): Promise<InventoryItem> {
    if (!command.authorizedBranchIds.includes(command.branchId)) {
      throw new ForbiddenException(
        'No tiene acceso a la sucursal indicada.',
      );
    }

    const existing = await this.inventoryRepository.findBySku(
      command.organizationId,
      command.branchId,
      command.sku.trim(),
    );
    if (existing) {
      throw new ConflictException(
        'Ya existe un artículo con ese SKU en la sucursal.',
      );
    }

    try {
      const item = new InventoryItem({
        organizationId: command.organizationId,
        branchId: command.branchId,
        sku: command.sku,
        name: command.name,
        description: command.description,
        category: command.category,
        unit: command.unit,
        minStock: command.minStock,
        currentStock: command.currentStock,
        unitCostMinor: command.unitCostMinor,
        currency: command.currency,
        createdByMembershipId: command.createdByMembershipId,
      });

      return this.inventoryRepository.createItem(item);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
