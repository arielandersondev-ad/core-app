import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  InventoryMovementType,
} from '../../domain/entities/inventory-movement.entity.js';
import {
  InventoryRepository,
  type RegisterInventoryMovementResult,
} from '../../domain/repositories/inventory.repository.js';

export interface RegisterInventoryMovementCommand {
  organizationId: string;
  authorizedBranchIds: string[];
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  unitCostMinor?: number | null;
  currency?: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  reason?: string | null;
  relatedTreatmentId?: string | null;
  relatedClinicalEncounterId?: string | null;
  createdByMembershipId: string;
}

@Injectable()
export class RegisterInventoryMovementUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(
    command: RegisterInventoryMovementCommand,
  ): Promise<RegisterInventoryMovementResult> {
    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(command.type)) {
      throw new BadRequestException(
        'El tipo de movimiento no es válido.',
      );
    }
    if (
      !Number.isInteger(command.quantity) ||
      command.quantity === 0
    ) {
      throw new BadRequestException(
        'La cantidad debe ser un entero distinto de cero.',
      );
    }
    if (
      command.type !== 'ADJUSTMENT' &&
      command.quantity < 0
    ) {
      throw new BadRequestException(
        'Las entradas y salidas requieren cantidad positiva.',
      );
    }
    if (
      command.expiryDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(command.expiryDate)
    ) {
      throw new BadRequestException(
        'La fecha de vencimiento debe usar YYYY-MM-DD.',
      );
    }

    return this.inventoryRepository.registerMovement(command);
  }
}
