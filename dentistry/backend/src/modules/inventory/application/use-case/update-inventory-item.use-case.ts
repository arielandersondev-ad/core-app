import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryItem } from '../../domain/entities/inventory-item.entity.js';
import { InventoryRepository } from '../../domain/repositories/inventory.repository.js';

export interface UpdateInventoryItemCommand {
  id: string;
  organizationId: string;
  authorizedBranchIds: string[];
  sku?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  unit?: string;
  minStock?: number;
  unitCostMinor?: number | null;
  currency?: string;
  isActive?: boolean;
  updatedByMembershipId: string;
}

@Injectable()
export class UpdateInventoryItemUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    command: UpdateInventoryItemCommand,
  ): Promise<InventoryItem> {
    const current = await this.inventoryRepository.findItemById(
      command.id,
      command.organizationId,
    );
    if (!current) {
      throw new NotFoundException('Artículo de inventario no encontrado.');
    }
    if (!command.authorizedBranchIds.includes(current.branchId)) {
      throw new ForbiddenException(
        'No tiene acceso a la sucursal del artículo.',
      );
    }

    if (command.sku && command.sku.trim() !== current.sku) {
      const existing = await this.inventoryRepository.findBySku(
        command.organizationId,
        current.branchId,
        command.sku.trim(),
      );
      if (existing) {
        throw new BadRequestException(
          'Ya existe un artículo con ese SKU en la sucursal.',
        );
      }
    }

    try {
      const updated = new InventoryItem({
        id: current.id,
        organizationId: current.organizationId,
        branchId: current.branchId,
        sku: command.sku ?? current.sku,
        name: command.name ?? current.name,
        description:
          command.description === undefined
            ? current.description
            : command.description,
        category:
          command.category === undefined
            ? current.category
            : command.category,
        unit: command.unit ?? current.unit,
        minStock: command.minStock ?? current.minStock,
        currentStock: current.currentStock,
        unitCostMinor:
          command.unitCostMinor === undefined
            ? current.unitCostMinor
            : command.unitCostMinor,
        currency: command.currency ?? current.currency,
        isActive: command.isActive ?? current.isActive,
        createdByMembershipId: current.createdByMembershipId,
        updatedByMembershipId: command.updatedByMembershipId,
        createdAt: current.createdAt,
        rowVersion: current.rowVersion,
      });

      const row = await this.inventoryRepository.updateItem(updated);
      if (!row) {
        throw new NotFoundException(
          'Artículo de inventario no encontrado.',
        );
      }
      return row;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
