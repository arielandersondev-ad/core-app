import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { CreateInventoryItemUseCase } from '../../application/use-case/create-inventory-item.use-case.js';
import { DeleteInventoryItemUseCase } from '../../application/use-case/delete-inventory-item.use-case.js';
import { ListInventoryItemsUseCase } from '../../application/use-case/list-inventory-items.use-case.js';
import { ListInventoryMovementsUseCase } from '../../application/use-case/list-inventory-movements.use-case.js';
import { RegisterInventoryMovementUseCase } from '../../application/use-case/register-inventory-movement.use-case.js';
import { UpdateInventoryItemUseCase } from '../../application/use-case/update-inventory-item.use-case.js';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto.js';
import { ListInventoryItemsQueryDto } from '../dto/list-inventory-items.query.dto.js';
import { RegisterInventoryMovementDto } from '../dto/register-inventory-movement.dto.js';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto.js';

@Controller('inventory')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class InventoryController {
  constructor(
    private readonly listItemsUseCase: ListInventoryItemsUseCase,
    private readonly createItemUseCase: CreateInventoryItemUseCase,
    private readonly updateItemUseCase: UpdateInventoryItemUseCase,
    private readonly deleteItemUseCase: DeleteInventoryItemUseCase,
    private readonly listMovementsUseCase: ListInventoryMovementsUseCase,
    private readonly registerMovementUseCase: RegisterInventoryMovementUseCase,
  ) {}

  @Get('items')
  @RequirePermission('dentistry:services:read')
  async listItems(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Query() query: ListInventoryItemsQueryDto,
  ) {
    return this.listItemsUseCase.execute({
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      branchId: query.branchId,
      search: query.search,
      status: query.status ?? 'all',
    });
  }

  @Post('items')
  @RequirePermission('dentistry:services:manage')
  async createItem(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Body() dto: CreateInventoryItemDto,
  ) {
    const branchId = dto.branchId ?? principal.branchIds[0];
    if (!branchId) {
      throw new BadRequestException(
        'Selecciona una sucursal para el artículo.',
      );
    }

    return this.createItemUseCase.execute({
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      branchId,
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      unit: dto.unit,
      minStock: dto.minStock,
      currentStock: dto.currentStock,
      unitCostMinor: dto.unitCostMinor,
      currency: dto.currency,
      createdByMembershipId: principal.membershipId,
    });
  }

  @Patch('items/:id')
  @RequirePermission('dentistry:services:manage')
  async updateItem(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.updateItemUseCase.execute({
      id,
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      unit: dto.unit,
      minStock: dto.minStock,
      unitCostMinor: dto.unitCostMinor,
      currency: dto.currency,
      isActive: dto.isActive,
      updatedByMembershipId: principal.membershipId,
    });
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:services:manage')
  async deleteItem(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteItemUseCase.execute(
      id,
      principal.organizationId,
      principal.branchIds,
      principal.membershipId,
    );
  }

  @Get('items/:id/movements')
  @RequirePermission('dentistry:services:read')
  async listMovements(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listMovementsUseCase.execute(
      id,
      principal.organizationId,
      principal.branchIds,
    );
  }

  @Post('items/:id/movements')
  @RequirePermission('dentistry:services:manage')
  async registerMovement(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterInventoryMovementDto,
  ) {
    return this.registerMovementUseCase.execute({
      organizationId: principal.organizationId,
      authorizedBranchIds: principal.branchIds,
      itemId: id,
      type: dto.type,
      quantity: dto.quantity,
      unitCostMinor: dto.unitCostMinor,
      currency: dto.currency,
      lotNumber: dto.lotNumber,
      expiryDate: dto.expiryDate,
      reason: dto.reason,
      relatedTreatmentId: dto.relatedTreatmentId,
      relatedClinicalEncounterId: dto.relatedClinicalEncounterId,
      createdByMembershipId: principal.membershipId,
    });
  }
}
