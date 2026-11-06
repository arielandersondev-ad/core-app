import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateDentalServiceUseCase } from '../../application/use-case/create-dental-service.use-case.js';
import { ListDentalServicesUseCase } from '../../application/use-case/list-dental-services.use-case.js';
import { GetDentalServiceByIdUseCase } from '../../application/use-case/get-dental-service-by-id.use-case.js';
import { UpdateDentalServiceUseCase } from '../../application/use-case/update-dental-service.use-case.js';
import { ToggleDentalServiceStatusUseCase } from '../../application/use-case/toggle-dental-service-status.use-case.js';
import { DeleteDentalServiceUseCase } from '../../application/use-case/delete-dental-service.use-case.js';
import { CreateDentalServiceDto } from '../dto/create-dental-service.dto.js';
import {
  ToggleDentalServiceStatusDto,
  UpdateDentalServiceDto,
} from '../dto/update-dental-service.dto.js';
import { ListDentalServicesQueryDto } from '../dto/list-dental-services.query.dto.js';

@Controller('services')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard)
export class DentalServiceController {
  constructor(
    private readonly createServiceUseCase: CreateDentalServiceUseCase,
    private readonly listServicesUseCase: ListDentalServicesUseCase,
    private readonly getServiceByIdUseCase: GetDentalServiceByIdUseCase,
    private readonly updateServiceUseCase: UpdateDentalServiceUseCase,
    private readonly toggleStatusUseCase: ToggleDentalServiceStatusUseCase,
    private readonly deleteServiceUseCase: DeleteDentalServiceUseCase,
  ) {}

  @Post()
  @RequirePermission('dentistry:services:create')
  async create(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Body() dto: CreateDentalServiceDto,
  ) {
    const organizationId = principal?.organizationId ?? dto.organizationId;
    const createdByMembershipId = principal?.membershipId ?? dto.createdByMembershipId;

    return this.createServiceUseCase.execute({
      organizationId,
      code: dto.code,
      name: dto.name,
      category: dto.category,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      basePriceMinor: dto.basePriceMinor,
      labCostMinor: dto.labCostMinor,
      currency: dto.currency,
      isActive: dto.isActive,
      createdByMembershipId,
      supplies: dto.supplies,
    });
  }

  @Get()
  @RequirePermission('dentistry:services:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Query() query?: ListDentalServicesQueryDto,
  ) {
    const q = query ?? (principal as unknown as ListDentalServicesQueryDto) ?? {};
    const organizationId = principal?.organizationId ?? q.organizationId;

    let isActive: boolean | undefined = undefined;
    if (q.isActive !== undefined) {
      if (typeof q.isActive === 'boolean') {
        isActive = q.isActive;
      } else if (typeof q.isActive === 'string') {
        if (q.isActive.toLowerCase() === 'true') isActive = true;
        else if (q.isActive.toLowerCase() === 'false') isActive = false;
      }
    } else if (q.status !== undefined) {
      const s = q.status.trim().toUpperCase();
      if (s === 'ACTIVE') isActive = true;
      else if (s === 'INACTIVE') isActive = false;
    }

    const limit = q.limit ?? q.pageSize ?? 15;
    const page = q.page ?? 1;

    return this.listServicesUseCase.execute({
      organizationId,
      category: q.category,
      isActive,
      status: q.status,
      search: q.search,
      page,
      limit,
      offset: q.offset,
    });
  }

  @Get(':id')
  @RequirePermission('dentistry:services:read')
  async getById(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id') id: string,
    @Query('organizationId') queryOrganizationId?: string,
  ) {
    const organizationId = principal?.organizationId ?? queryOrganizationId!;
    return this.getServiceByIdUseCase.execute(id, organizationId);
  }

  @Patch(':id')
  @RequirePermission('dentistry:services:update')
  async update(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id') id: string,
    @Body() dto: UpdateDentalServiceDto,
  ) {
    const organizationId = principal?.organizationId ?? dto.organizationId;
    const updatedByMembershipId = principal?.membershipId ?? dto.updatedByMembershipId;

    return this.updateServiceUseCase.execute({
      id,
      organizationId,
      code: dto.code,
      name: dto.name,
      category: dto.category,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      basePriceMinor: dto.basePriceMinor,
      labCostMinor: dto.labCostMinor,
      currency: dto.currency,
      isActive: dto.isActive,
      updatedByMembershipId,
      supplies: dto.supplies,
    });
  }

  @Patch(':id/toggle-status')
  @RequirePermission('dentistry:services:update')
  async toggleStatus(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id') id: string,
    @Body() dto?: ToggleDentalServiceStatusDto,
  ) {
    const organizationId = principal?.organizationId ?? dto?.organizationId!;
    const updatedByMembershipId = principal?.membershipId ?? dto?.updatedByMembershipId!;

    return this.toggleStatusUseCase.execute({
      id,
      organizationId,
      updatedByMembershipId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:services:delete')
  async delete(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('id') id: string,
    @Query('organizationId') queryOrganizationId?: string,
  ) {
    const organizationId = principal?.organizationId ?? queryOrganizationId!;
    return this.deleteServiceUseCase.execute(id, organizationId);
  }
}
