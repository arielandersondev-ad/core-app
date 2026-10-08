import { Injectable, NotFoundException } from '@nestjs/common';
import { DentalService } from '../../domain/entities/dental-service.entity.js';
import { DentalServiceRepository } from '../../domain/repositories/dental-service.repository.js';

@Injectable()
export class GetDentalServiceByIdUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(id: string, organizationId: string): Promise<DentalService> {
    const service = await this.serviceRepository.findById(id, organizationId);
    if (!service) {
      throw new NotFoundException(`Servicio con ID '${id}' no encontrado.`);
    }
    return service;
  }
}
