import { Injectable, NotFoundException } from '@nestjs/common';
import { DentalService } from '../../domain/entities/dental-service.entity.js';
import { DentalServiceRepository } from '../../domain/repositories/dental-service.repository.js';

export interface ToggleDentalServiceStatusCommand {
  id: string;
  organizationId: string;
  updatedByMembershipId: string;
}

@Injectable()
export class ToggleDentalServiceStatusUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(
    command: ToggleDentalServiceStatusCommand,
  ): Promise<DentalService> {
    const service = await this.serviceRepository.findById(
      command.id,
      command.organizationId,
    );

    if (!service) {
      throw new NotFoundException(
        `Servicio con ID '${command.id}' no encontrado.`,
      );
    }

    service.toggleActive(command.updatedByMembershipId);
    return this.serviceRepository.update(service);
  }
}
