import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { InventoryItem } from '../domain/entities/inventory-item.entity.js';
import type { InventoryMovement } from '../domain/entities/inventory-movement.entity.js';
import {
  InventoryRepository,
  type FindInventoryItemsFilters,
  type RegisterInventoryMovementData,
  type RegisterInventoryMovementResult,
} from '../domain/repositories/inventory.repository.js';
import {
  toInventoryItemEntity,
  toInventoryMovementEntity,
  type InventoryItemRow,
  type InventoryMovementRow,
} from './inventory.mapper.js';

@Injectable()
export class PrismaInventoryRepository extends InventoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findItems(
    filters: FindInventoryItemsFilters,
  ): Promise<InventoryItem[]> {
    if (filters.authorizedBranchIds.length === 0) return [];

    let query = this.prisma.orm.dentistry.InventoryItem.where({
      organizationId: filters.organizationId,
      deletedAt: null,
    }).where((item) =>
      item.branchId.in(filters.authorizedBranchIds),
    );

    if (filters.branchId) {
      query = query.where({ branchId: filters.branchId });
    }
    if (!filters.includeInactive) {
      query = query.where({ isActive: true });
    }
    if (filters.search) {
      const pattern =
        '%' +
        filters.search.replace(/[\\%_]/g, '\\$&') +
        '%';
      query = query.where((item) =>
        or(
          item.name.ilike(pattern),
          item.sku.ilike(pattern),
          item.category.ilike(pattern),
        ),
      );
    }

    const rows = (await query.all()) as InventoryItemRow[];
    let items = rows.map(toInventoryItemEntity);

    if (filters.status === 'out') {
      items = items.filter((item) => item.currentStock <= 0);
    } else if (filters.status === 'low') {
      items = items.filter(
        (item) =>
          item.currentStock > 0 &&
          item.currentStock < item.minStock,
      );
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findItemById(
    id: string,
    organizationId: string,
  ): Promise<InventoryItem | null> {
    const row = (await this.prisma.orm.dentistry.InventoryItem.first({
      id,
      organizationId,
      deletedAt: null,
    })) as InventoryItemRow | null;

    return row ? toInventoryItemEntity(row) : null;
  }

  async findBySku(
    organizationId: string,
    branchId: string,
    sku: string,
  ): Promise<InventoryItem | null> {
    const row = (await this.prisma.orm.dentistry.InventoryItem.first({
      organizationId,
      branchId,
      sku,
      deletedAt: null,
    })) as InventoryItemRow | null;

    return row ? toInventoryItemEntity(row) : null;
  }

  async createItem(item: InventoryItem): Promise<InventoryItem> {
    return this.prisma.transaction(async (tx) => {
      const row = (await tx.orm.dentistry.InventoryItem.create({
        organizationId: item.organizationId,
        branchId: item.branchId,
        sku: item.sku,
        name: item.name,
        description: item.description,
        category: item.category,
        unit: item.unit,
        minStock: item.minStock,
        currentStock: item.currentStock,
        unitCostMinor: item.unitCostMinor,
        currency: item.currency,
        isActive: item.isActive,
        createdByMembershipId: item.createdByMembershipId,
      })) as InventoryItemRow;

      // Todo stock inicial debe tener su entrada; si no, la bitácora no
      // puede explicar el stock actual.
      if (item.currentStock > 0) {
        await tx.orm.dentistry.InventoryMovement.create({
          organizationId: item.organizationId,
          branchId: item.branchId,
          itemId: row.id,
          type: "IN",
          quantity: item.currentStock,
          unitCostMinor: item.unitCostMinor,
          currency: item.currency,
          reason: "Stock inicial",
          createdByMembershipId: item.createdByMembershipId,
        });
      }

      return toInventoryItemEntity(row);
    });
  }

  async updateItem(
    item: InventoryItem,
  ): Promise<InventoryItem | null> {
    const current = await this.findItemById(item.id, item.organizationId);
    if (!current) return null;

    const row = (await this.prisma.orm.dentistry.InventoryItem.where({
      id: item.id,
      organizationId: item.organizationId,
    }).update({
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      unit: item.unit,
      minStock: item.minStock,
      unitCostMinor: item.unitCostMinor,
      currency: item.currency,
      isActive: item.isActive,
      updatedByMembershipId: item.updatedByMembershipId,
    })) as InventoryItemRow;

    return toInventoryItemEntity(row);
  }

  async softDeleteItem(
    id: string,
    organizationId: string,
    deletedByMembershipId: string,
  ): Promise<InventoryItem | null> {
    const current = await this.findItemById(id, organizationId);
    if (!current) return null;

    const row = (await this.prisma.orm.dentistry.InventoryItem.where({
      id,
      organizationId,
    }).update({
      deletedAt: new Date(),
      isActive: false,
      updatedByMembershipId: deletedByMembershipId,
    })) as InventoryItemRow;

    return toInventoryItemEntity(row);
  }

  async findMovements(
    itemId: string,
    organizationId: string,
  ): Promise<InventoryMovement[]> {
    const rows = (await this.prisma.orm.dentistry.InventoryMovement.where({
      itemId,
      organizationId,
    }).all()) as InventoryMovementRow[];

    return rows
      .map(toInventoryMovementEntity)
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b.id.localeCompare(a.id),
      );
  }

  async registerMovement(
    data: RegisterInventoryMovementData,
  ): Promise<RegisterInventoryMovementResult> {
    return this.prisma.transaction(async (tx) => {
      const itemRow = (await tx.orm.dentistry.InventoryItem.first({
        id: data.itemId,
        organizationId: data.organizationId,
        deletedAt: null,
      })) as InventoryItemRow | null;

      if (!itemRow) {
        throw new NotFoundException('Artículo de inventario no encontrado.');
      }
      if (!data.authorizedBranchIds.includes(itemRow.branchId)) {
        throw new ForbiddenException(
          'No tiene acceso a la sucursal del artículo.',
        );
      }

      const signed =
        data.type === 'IN'
          ? Math.abs(data.quantity)
          : data.type === 'OUT'
            ? -Math.abs(data.quantity)
            : data.quantity;
      const nextStock = itemRow.currentStock + signed;

      if (nextStock < 0) {
        throw new BadRequestException(
          `Stock insuficiente: hay ${itemRow.currentStock} ${itemRow.unit}.`,
        );
      }

      const movementRow = (await tx.orm.dentistry.InventoryMovement.create({
        organizationId: data.organizationId,
        branchId: itemRow.branchId,
        itemId: itemRow.id,
        type: data.type,
        quantity: data.quantity,
        unitCostMinor: data.unitCostMinor ?? null,
        currency: (data.currency ?? 'BOB').toUpperCase(),
        lotNumber: data.lotNumber?.trim() || null,
        expiryDate: data.expiryDate
          ? new Date(`${data.expiryDate}T00:00:00.000Z`)
          : null,
        reason: data.reason?.trim() || null,
        relatedTreatmentId: data.relatedTreatmentId ?? null,
        relatedClinicalEncounterId:
          data.relatedClinicalEncounterId ?? null,
        createdByMembershipId: data.createdByMembershipId,
      })) as InventoryMovementRow;

      const updatedRow = (await tx.orm.dentistry.InventoryItem.where({
        id: itemRow.id,
      }).update({
        currentStock: nextStock,
        updatedByMembershipId: data.createdByMembershipId,
      })) as InventoryItemRow;

      return {
        item: toInventoryItemEntity(updatedRow),
        movement: toInventoryMovementEntity(movementRow),
      };
    });
  }
}
