import { ConflictException, Injectable } from '@nestjs/common';
import { DentalService } from '../../domain/entities/dental-service.entity.js';
import { DentalServiceSupply } from '../../domain/entities/dental-service-supply.entity.js';
import { DentalServiceRepository } from '../../domain/repositories/dental-service.repository.js';

export interface CreateDentalServiceSupplyDto {
  inventoryItemId?: string;
  name: string;
  quantity?: number;
  unit?: string;
  estimatedCostMinor?: number;
  notes?: string;
}

export interface CreateDentalServiceCommand {
  organizationId: string;
  code?: string;
  name: string;
  category?: string;
  description?: string;
  durationMinutes?: number;
  basePriceMinor?: number;
  labCostMinor?: number;
  currency?: string;
  active?: boolean;
  createdByMembershipId: string;
  supplies?: CreateDentalServiceSupplyDto[];
}

@Injectable()
export class CreateDentalServiceUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(command: CreateDentalServiceCommand): Promise<DentalService> {
    if (command.code && command.code.trim().length > 0) {
      const existing = await this.serviceRepository.findByCode(
        command.code.trim(),
        command.organizationId,
      );
      if (existing) {
        throw new ConflictException(
          `Ya existe un servicio con el código '${command.code}'.`,
        );
      }
    }

    const supplies = (command.supplies || []).map(
      (s) =>
        new DentalServiceSupply({
          organizationId: command.organizationId,
          inventoryItemId: s.inventoryItemId,
          name: s.name,
          quantity: s.quantity,
          unit: s.unit,
          estimatedCostMinor: s.estimatedCostMinor,
          notes: s.notes,
        }),
    );

    const service = new DentalService({
      organizationId: command.organizationId,
      code: command.code,
      name: command.name,
      category: command.category,
      description: command.description,
      durationMinutes: command.durationMinutes,
      basePriceMinor: command.basePriceMinor,
      labCostMinor: command.labCostMinor,
      currency: command.currency,
      active: command.active ?? true,
      createdByMembershipId: command.createdByMembershipId,
      supplies,
    });

    return this.serviceRepository.create(service);
  }
}
