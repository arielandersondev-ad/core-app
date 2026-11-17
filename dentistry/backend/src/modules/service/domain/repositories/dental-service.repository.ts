import { DentalService } from '../entities/dental-service.entity.js';

export interface FindDentalServicesFilters {
  organizationId: string;
  category?: string;
  isActive?: boolean;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
  offset?: number;
}

export interface PaginatedDentalServicesResult {
  items: DentalService[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
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
  ): Promise<PaginatedDentalServicesResult>;
  abstract update(service: DentalService): Promise<DentalService>;
  abstract delete(id: string, organizationId: string): Promise<boolean>;
}
