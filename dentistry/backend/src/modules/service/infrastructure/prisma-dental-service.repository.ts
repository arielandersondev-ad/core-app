import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { DentalService } from '../domain/entities/dental-service.entity.js';
import {
  DentalServiceRepository,
  FindDentalServicesFilters,
} from '../domain/repositories/dental-service.repository.js';
import {
  DentalServiceRow,
  DentalServiceSupplyRow,
  toDentalServiceEntity,
} from './dental-service.mapper.js';

@Injectable()
export class PrismaDentalServiceRepository extends DentalServiceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(service: DentalService): Promise<DentalService> {
    const row = (await this.prisma.orm.dentistry.DentalService.create({
      organizationId: toUuid36(service.organizationId),
      code: service.code,
      name: service.name,
      category: service.category,
      description: service.description,
      durationMinutes: service.durationMinutes,
      basePriceMinor: service.basePriceMinor,
      labCostMinor: service.labCostMinor,
      currency: service.currency,
      active: service.active,
      createdByMembershipId: toUuid36(service.createdByMembershipId),
      updatedByMembershipId: service.updatedByMembershipId
        ? toUuid36(service.updatedByMembershipId)
        : null,
    })) as unknown as DentalServiceRow;

    // Create supplies if any
    const suppliesRows: DentalServiceSupplyRow[] = [];
    if (service.supplies && service.supplies.length > 0) {
      for (const supply of service.supplies) {
        const sRow =
          (await this.prisma.orm.dentistry.DentalServiceSupply.create({
            organizationId: toUuid36(service.organizationId),
            serviceId: toUuid36(row.id),
            inventoryItemId: supply.inventoryItemId
              ? toUuid36(supply.inventoryItemId)
              : null,
            name: supply.name,
            quantity: supply.quantity,
            unit: supply.unit,
            estimatedCostMinor: supply.estimatedCostMinor,
            notes: supply.notes,
          })) as unknown as DentalServiceSupplyRow;
        suppliesRows.push(sRow);
      }
    }

    row.supplies = suppliesRows;
    return toDentalServiceEntity(row);
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<DentalService | null> {
    const row = (await this.prisma.orm.dentistry.DentalService.first({
      id: toUuid36(id),
      organizationId: toUuid36(organizationId),
    })) as unknown as DentalServiceRow | null;

    if (!row) return null;

    // Load supplies
    const supplies = (await this.prisma.orm.dentistry.DentalServiceSupply.where(
      {
        organizationId: toUuid36(organizationId),
        serviceId: toUuid36(id),
      },
    ).all()) as unknown as DentalServiceSupplyRow[];

    row.supplies = supplies;
    return toDentalServiceEntity(row);
  }

  async findByCode(
    code: string,
    organizationId: string,
  ): Promise<DentalService | null> {
    const row = (await this.prisma.orm.dentistry.DentalService.first({
      code,
      organizationId: toUuid36(organizationId),
    })) as unknown as DentalServiceRow | null;

    if (!row) return null;

    const supplies = (await this.prisma.orm.dentistry.DentalServiceSupply.where(
      {
        organizationId: toUuid36(organizationId),
        serviceId: toUuid36(row.id),
      },
    ).all()) as unknown as DentalServiceSupplyRow[];

    row.supplies = supplies;
    return toDentalServiceEntity(row);
  }

  async findByFilters(
    filters: FindDentalServicesFilters,
  ): Promise<DentalService[]> {
    const rows = (await this.prisma.orm.dentistry.DentalService.where({
      organizationId: toUuid36(filters.organizationId),
    }).all()) as unknown as DentalServiceRow[];

    const allSupplies =
      (await this.prisma.orm.dentistry.DentalServiceSupply.where({
        organizationId: toUuid36(filters.organizationId),
      }).all()) as unknown as DentalServiceSupplyRow[];

    // Map supplies by serviceId
    const suppliesByService = new Map<string, DentalServiceSupplyRow[]>();
    for (const s of allSupplies) {
      if (!suppliesByService.has(s.serviceId)) {
        suppliesByService.set(s.serviceId, []);
      }
      suppliesByService.get(s.serviceId)!.push(s);
    }

    let filtered = rows;

    if (filters.category) {
      const catLower = filters.category.toLowerCase();
      filtered = filtered.filter(
        (r) => r.category && r.category.toLowerCase() === catLower,
      );
    }

    if (filters.active !== undefined) {
      filtered = filtered.filter((r) => r.active === filters.active);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.code && r.code.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }

    return filtered
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => {
        r.supplies = suppliesByService.get(r.id) || [];
        return toDentalServiceEntity(r);
      });
  }

  async update(service: DentalService): Promise<DentalService> {
    await this.prisma.orm.dentistry.DentalService.where({
      id: toUuid36(service.id),
      organizationId: toUuid36(service.organizationId),
    }).update({
      code: service.code,
      name: service.name,
      category: service.category,
      description: service.description,
      durationMinutes: service.durationMinutes,
      basePriceMinor: service.basePriceMinor,
      labCostMinor: service.labCostMinor,
      currency: service.currency,
      active: service.active,
      updatedByMembershipId: service.updatedByMembershipId
        ? toUuid36(service.updatedByMembershipId)
        : null,
    });

    // Update supplies: remove old and insert new ones
    if (service.supplies !== undefined) {
      const existing =
        (await this.prisma.orm.dentistry.DentalServiceSupply.where({
          serviceId: toUuid36(service.id),
          organizationId: toUuid36(service.organizationId),
        }).all()) as unknown as DentalServiceSupplyRow[];

      for (const e of existing) {
        await this.prisma.orm.dentistry.DentalServiceSupply.where({
          id: toUuid36(e.id),
        }).delete();
      }

      for (const s of service.supplies) {
        await this.prisma.orm.dentistry.DentalServiceSupply.create({
          organizationId: toUuid36(service.organizationId),
          serviceId: toUuid36(service.id),
          inventoryItemId: s.inventoryItemId
            ? toUuid36(s.inventoryItemId)
            : null,
          name: s.name,
          quantity: s.quantity,
          unit: s.unit,
          estimatedCostMinor: s.estimatedCostMinor,
          notes: s.notes,
        });
      }
    }

    return this.findById(
      service.id,
      service.organizationId,
    ) as Promise<DentalService>;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    // Delete supplies first
    const supplies = (await this.prisma.orm.dentistry.DentalServiceSupply.where(
      {
        serviceId: toUuid36(id),
        organizationId: toUuid36(organizationId),
      },
    ).all()) as unknown as DentalServiceSupplyRow[];

    for (const s of supplies) {
      await this.prisma.orm.dentistry.DentalServiceSupply.where({
        id: toUuid36(s.id),
      }).delete();
    }

    await this.prisma.orm.dentistry.DentalService.where({
      id: toUuid36(id),
      organizationId: toUuid36(organizationId),
    }).delete();

    return true;
  }
}
