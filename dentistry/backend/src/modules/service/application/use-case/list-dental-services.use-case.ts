import { Injectable } from '@nestjs/common';
import { DentalService } from '../../domain/entities/dental-service.entity.js';
import {
  DentalServiceRepository,
  FindDentalServicesFilters,
} from '../../domain/repositories/dental-service.repository.js';

@Injectable()
export class ListDentalServicesUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(filters: FindDentalServicesFilters): Promise<DentalService[]> {
    return this.serviceRepository.findByFilters(filters);
  }
}
