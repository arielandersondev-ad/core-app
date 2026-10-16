import { DentalService } from '../entities/dental-service.entity.js';

export interface FindDentalServicesFilters {
  organizationId: string;
  category?: string;
  active?: boolean;
  search?: string;
}

export abstract class DentalServiceRepository {
  abstract create(service: DentalService): Promise<DentalService>;
  abstract findById(
    id: string,
    organizationId: string,
  ): Promise<DentalService | null>;
  abstract findByCode(
    code: string,
    organizationId: string,
  ): Promise<DentalService | null>;
  abstract findByFilters(
    filters: FindDentalServicesFilters,
  ): Promise<DentalService[]>;
  abstract update(service: DentalService): Promise<DentalService>;
  abstract delete(id: string, organizationId: string): Promise<boolean>;
}
