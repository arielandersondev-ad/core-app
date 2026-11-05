import { Injectable } from '@nestjs/common';
import {
  DentalServiceRepository,
  FindDentalServicesFilters,
  PaginatedDentalServicesResult,
} from '../../domain/repositories/dental-service.repository.js';

@Injectable()
export class ListDentalServicesUseCase {
  constructor(private readonly serviceRepository: DentalServiceRepository) {}

  async execute(
    filters: FindDentalServicesFilters,
  ): Promise<PaginatedDentalServicesResult> {
    return this.serviceRepository.findByFilters(filters);
  }
}
