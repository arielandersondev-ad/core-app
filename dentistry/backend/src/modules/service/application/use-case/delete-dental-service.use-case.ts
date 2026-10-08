import { Injectable, NotFoundException } from '@nestjs/common';
import { DentalServiceRepository } from '../../domain/repositories/dental-service.repository.js';

@Injectable()
export class DeleteDentalServiceUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(
    id: string,
    organizationId: string,
  ): Promise<{ success: boolean; message: string }> {
    const service = await this.serviceRepository.findById(id, organizationId);
    if (!service) {
      throw new NotFoundException(`Servicio con ID '${id}' no encontrado.`);
    }

    const deleted = await this.serviceRepository.delete(id, organizationId);
    return {
      success: deleted,
      message: 'Servicio eliminado correctamente.',
    };
  }
}
