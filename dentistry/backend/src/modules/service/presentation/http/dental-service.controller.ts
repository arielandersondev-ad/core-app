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
} from '@nestjs/common';
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
  async create(@Body() dto: CreateDentalServiceDto) {
    return this.createServiceUseCase.execute({
      organizationId: dto.organizationId,
      code: dto.code,
      name: dto.name,
      category: dto.category,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      basePriceMinor: dto.basePriceMinor,
      labCostMinor: dto.labCostMinor,
      currency: dto.currency,
      active: dto.active,
      createdByMembershipId: dto.createdByMembershipId,
      supplies: dto.supplies,
    });
  }

  @Get()
  async list(@Query() query: ListDentalServicesQueryDto) {
    let active: boolean | undefined = undefined;
    if (query.active !== undefined) {
      active = query.active === 'true';
    }

    return this.listServicesUseCase.execute({
      organizationId: query.organizationId,
      category: query.category,
      active,
      search: query.search,
    });
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.getServiceByIdUseCase.execute(id, organizationId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDentalServiceDto) {
    return this.updateServiceUseCase.execute({
      id,
      organizationId: dto.organizationId,
      code: dto.code,
      name: dto.name,
      category: dto.category,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      basePriceMinor: dto.basePriceMinor,
      labCostMinor: dto.labCostMinor,
      currency: dto.currency,
      active: dto.active,
      updatedByMembershipId: dto.updatedByMembershipId,
      supplies: dto.supplies,
    });
  }

  @Patch(':id/toggle-status')
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: ToggleDentalServiceStatusDto,
  ) {
    return this.toggleStatusUseCase.execute({
      id,
      organizationId: dto.organizationId,
      updatedByMembershipId: dto.updatedByMembershipId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.deleteServiceUseCase.execute(id, organizationId);
  }
}
