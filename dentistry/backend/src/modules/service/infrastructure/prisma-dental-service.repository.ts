import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { hasPostgresCode } from '../../../common/infrastructure/postgres-error.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { DentalService } from '../domain/entities/dental-service.entity.js';
import {
  DentalServiceRepository,
  FindDentalServicesFilters,
  PaginatedDentalServicesResult,
} from '../domain/repositories/dental-service.repository.js';
import {
  DentalServiceSupplyRow,
  toDentalServiceEntity,
} from './dental-service.mapper.js';

@Injectable()
export class PrismaDentalServiceRepository extends DentalServiceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(service: DentalService): Promise<DentalService> {
    return this.prisma.transaction(async (tx) => {
      const row = await tx.orm.dentistry.DentalService.create({
        organizationId: service.organizationId,
        code: service.code,
        name: service.name,
        category: service.category,
        description: service.description,
        durationMinutes: service.durationMinutes,
        basePriceMinor: service.basePriceMinor,
        labCostMinor: service.labCostMinor,
        currency: service.currency,
        isActive: service.isActive,
        createdByMembershipId: service.createdByMembershipId,
        updatedByMembershipId: service.updatedByMembershipId
          ? service.updatedByMembershipId
          : null,
      });

      // Create supplies if any
      const suppliesRows: DentalServiceSupplyRow[] = [];
      if (service.supplies && service.supplies.length > 0) {
        for (const supply of service.supplies) {
          const sRow = await tx.orm.dentistry.DentalServiceSupply.create({
            organizationId: service.organizationId,
            serviceId: row.id,
            name: supply.name,
            quantity: supply.quantity,
            unit: supply.unit,
            estimatedCostMinor: supply.estimatedCostMinor,
            notes: supply.notes,
          });
          suppliesRows.push(sRow);
        }
      }

      return toDentalServiceEntity({ ...row, supplies: suppliesRows });
    });
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<DentalService | null> {
    const row = await this.prisma.orm.dentistry.DentalService.first({
      id: id,
      organizationId: organizationId,
    });

    if (!row) return null;

    // Load supplies
    const supplies = await this.prisma.orm.dentistry.DentalServiceSupply.where({
      organizationId: organizationId,
      serviceId: id,
    }).all();

    return toDentalServiceEntity({ ...row, supplies: supplies });
  }

  async findByCode(
    code: string,
    organizationId: string,
  ): Promise<DentalService | null> {
    const row = await this.prisma.orm.dentistry.DentalService.first({
      code,
      organizationId: organizationId,
    });

    if (!row) return null;

    const supplies = await this.prisma.orm.dentistry.DentalServiceSupply.where({
      organizationId: organizationId,
      serviceId: row.id,
    }).all();

    return toDentalServiceEntity({ ...row, supplies: supplies });
  }

  async findByFilters(
    filters: FindDentalServicesFilters,
  ): Promise<PaginatedDentalServicesResult> {
    if (!filters.organizationId?.trim()) {
      throw new Error('organizationId es obligatorio.');
    }

    let query = this.prisma.orm.dentistry.DentalService.where({
      organizationId: filters.organizationId,
    });

    if (filters.category?.trim()) {
      const cat = filters.category.trim();
      query = query.where((s) => s.category.ilike(cat));
    }

    let isActive = filters.isActive;
    if (isActive === undefined && filters.status) {
      const s = filters.status.trim().toUpperCase();
      if (s === 'ACTIVE') isActive = true;
      else if (s === 'INACTIVE') isActive = false;
    }

    if (isActive !== undefined) {
      query = query.where({ isActive });
    }

    const search = filters.search?.trim();
    if (search) {
      const pattern = '%' + search.replace(/[\\%_]/g, '\\$&') + '%';
      query = query.where((s) =>
        or(
          s.name.ilike(pattern),
          s.code.ilike(pattern),
          s.category.ilike(pattern),
          s.description.ilike(pattern),
        ),
      );
    }

    const limit = Math.max(1, filters.limit ?? filters.pageSize ?? 15);
    let page = Math.max(1, filters.page ?? 1);
    let skip: number;

    if (filters.offset !== undefined && filters.offset >= 0) {
      skip = filters.offset;
      page = Math.floor(skip / limit) + 1;
    } else {
      skip = (page - 1) * limit;
    }

    const { totalItems } = await query.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));

    const rows = await query
      .orderBy([
        (s) => s.name.asc(),
        (s) => s.id.asc(),
      ])
      .skip(skip)
      .take(limit)
      .all();

    const serviceIds = new Set(rows.map((r) => r.id));
    const suppliesByService = new Map<string, DentalServiceSupplyRow[]>();

    if (rows.length > 0) {
      const allSupplies =
        await this.prisma.orm.dentistry.DentalServiceSupply.where({
          organizationId: filters.organizationId,
        }).all();

      for (const s of allSupplies) {
        if (serviceIds.has(s.serviceId)) {
          if (!suppliesByService.has(s.serviceId)) {
            suppliesByService.set(s.serviceId, []);
          }
          suppliesByService.get(s.serviceId)!.push(s);
        }
      }
    }

    const items = rows.map((r) =>
      toDentalServiceEntity({
        ...r,
        supplies: suppliesByService.get(r.id) || [],
      }),
    );

    const total = totalItems;
    const hasMore = skip + rows.length < total;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      hasMore,
      pagination: {
        page,
        pageSize: limit,
        totalItems: total,
        totalPages,
        hasMore,
      },
    };
  }

  async update(service: DentalService): Promise<DentalService> {
    return this.prisma.transaction(async (tx) => {
      const row = await tx.orm.dentistry.DentalService.where({
        id: service.id,
        organizationId: service.organizationId,
      }).update({
        code: service.code,
        name: service.name,
        category: service.category,
        description: service.description,
        durationMinutes: service.durationMinutes,
        basePriceMinor: service.basePriceMinor,
        labCostMinor: service.labCostMinor,
        currency: service.currency,
        isActive: service.isActive,
        updatedByMembershipId: service.updatedByMembershipId
          ? service.updatedByMembershipId
          : null,
      });

      if (!row) throw new NotFoundException('Servicio no encontrado');
      // Update supplies: remove old and insert new ones
      if (service.supplies !== undefined) {
        const existing = await tx.orm.dentistry.DentalServiceSupply.where({
          serviceId: service.id,
          organizationId: service.organizationId,
        }).all();

        for (const e of existing) {
          await tx.orm.dentistry.DentalServiceSupply.where({
            id: e.id,
          }).delete();
        }

        for (const s of service.supplies) {
          await tx.orm.dentistry.DentalServiceSupply.create({
            organizationId: service.organizationId,
            serviceId: service.id,
            name: s.name,
            quantity: s.quantity,
            unit: s.unit,
            estimatedCostMinor: s.estimatedCostMinor,
            notes: s.notes,
          });
        }
      }

      const supplies = await tx.orm.dentistry.DentalServiceSupply.where({
        organizationId: service.organizationId,
        serviceId: service.id,
      }).all();
      return toDentalServiceEntity({ ...row, supplies });
    });
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    try {
      return await this.prisma.transaction(async (tx) => {
        // Delete supplies first
        const supplies = await tx.orm.dentistry.DentalServiceSupply.where({
          serviceId: id,
          organizationId: organizationId,
        }).all();

        for (const s of supplies) {
          await tx.orm.dentistry.DentalServiceSupply.where({
            id: s.id,
          }).delete();
        }

        await tx.orm.dentistry.DentalService.where({
          id: id,
          organizationId: organizationId,
        }).delete();

        return true;
      });
    } catch (error) {
      if (hasPostgresCode(error, '23503'))
        throw new ConflictException(
          'El servicio está referenciado; desactívelo para conservar el historial.',
        );
      throw error;
    }
  }
}
