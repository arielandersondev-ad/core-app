import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DentalService } from '../../domain/entities/dental-service.entity.js';
import { DentalServiceSupply } from '../../domain/entities/dental-service-supply.entity.js';
import { DentalServiceRepository } from '../../domain/repositories/dental-service.repository.js';
import { CreateDentalServiceSupplyDto } from './create-dental-service.use-case.js';

export interface UpdateDentalServiceCommand {
  id: string;
  organizationId: string;
  code?: string;
  name?: string;
  category?: string;
  description?: string;
  durationMinutes?: number;
  basePriceMinor?: number;
  labCostMinor?: number;
  currency?: string;
  active?: boolean;
  updatedByMembershipId: string;
  supplies?: CreateDentalServiceSupplyDto[];
}

@Injectable()
export class UpdateDentalServiceUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(command: UpdateDentalServiceCommand): Promise<DentalService> {
    const service = await this.serviceRepository.findById(
      command.id,
      command.organizationId,
    );

    if (!service) {
      throw new NotFoundException(
        `Servicio con ID '${command.id}' no encontrado.`,
      );
    }

    if (
      command.code &&
      command.code.trim().length > 0 &&
      command.code !== service.code
    ) {
      const existing = await this.serviceRepository.findByCode(
        command.code.trim(),
        command.organizationId,
      );
      if (existing && existing.id !== command.id) {
        throw new ConflictException(
          `Ya existe otro servicio con el código '${command.code}'.`,
        );
      }
    }

    let supplies: DentalServiceSupply[] | undefined = undefined;
    if (command.supplies !== undefined) {
      supplies = command.supplies.map(
        (s) =>
          new DentalServiceSupply({
            organizationId: command.organizationId,
            serviceId: command.id,
            inventoryItemId: s.inventoryItemId,
            name: s.name,
            quantity: s.quantity,
            unit: s.unit,
            estimatedCostMinor: s.estimatedCostMinor,
            notes: s.notes,
          }),
      );
    }

    service.updateDetails({
      code: command.code,
      name: command.name,
      category: command.category,
      description: command.description,
      durationMinutes: command.durationMinutes,
      basePriceMinor: command.basePriceMinor,
      labCostMinor: command.labCostMinor,
      currency: command.currency,
      active: command.active,
      updatedByMembershipId: command.updatedByMembershipId,
      supplies,
    });

    return this.serviceRepository.update(service);
  }
}
