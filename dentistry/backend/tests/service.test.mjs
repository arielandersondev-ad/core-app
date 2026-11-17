import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { DentalService } from '../dist/modules/service/domain/entities/dental-service.entity.js';
import { DentalServiceSupply } from '../dist/modules/service/domain/entities/dental-service-supply.entity.js';
import { ListDentalServicesUseCase } from '../dist/modules/service/application/use-case/list-dental-services.use-case.js';
import { ListDentalServicesQueryDto } from '../dist/modules/service/presentation/dto/list-dental-services.query.dto.js';
import { DentalServiceController } from '../dist/modules/service/presentation/http/dental-service.controller.js';

test('1. ListDentalServicesQueryDto: valida paginación y filtros con defaults correctos', async () => {
  // Caso por defecto
  const dtoDefault = plainToInstance(ListDentalServicesQueryDto, {
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  });
  const errorsDefault = await validate(dtoDefault);
  assert.equal(errorsDefault.length, 0);
  assert.equal(dtoDefault.page, 1);
  assert.equal(dtoDefault.limit, 15);

  // Parámetros personalizados de paginación y filtros
  const dtoCustom = plainToInstance(ListDentalServicesQueryDto, {
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    page: 3,
    limit: 20,
    pageSize: 20,
    offset: 40,
    search: 'limpieza',
    category: 'Ortodoncia',
    isActive: 'true',
    status: 'ACTIVE',
  });
  const errorsCustom = await validate(dtoCustom);
  assert.equal(errorsCustom.length, 0);
  assert.equal(dtoCustom.page, 3);
  assert.equal(dtoCustom.limit, 20);
  assert.equal(dtoCustom.pageSize, 20);
  assert.equal(dtoCustom.offset, 40);
  assert.equal(dtoCustom.search, 'limpieza');
  assert.equal(dtoCustom.category, 'Ortodoncia');

  // Validación de límites: page < 1 debe fallar
  const dtoInvalidPage = plainToInstance(ListDentalServicesQueryDto, {
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    page: 0,
  });
  const errorsPage = await validate(dtoInvalidPage);
  assert.ok(errorsPage.some((e) => e.property === 'page'));

  // Validación de límites: limit > 100 debe fallar
  const dtoInvalidLimit = plainToInstance(ListDentalServicesQueryDto, {
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    limit: 150,
  });
  const errorsLimit = await validate(dtoInvalidLimit);
  assert.ok(errorsLimit.some((e) => e.property === 'limit'));

  // organizationId no UUID debe fallar
  const dtoInvalidOrg = plainToInstance(ListDentalServicesQueryDto, {
    organizationId: 'not-a-uuid',
  });
  const errorsOrg = await validate(dtoInvalidOrg);
  assert.ok(errorsOrg.some((e) => e.property === 'organizationId'));
});

test('2. DentalService entity: toJSON() serializa campos limpios con insumos y margen', () => {
  const supply = new DentalServiceSupply({
    id: 'b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    serviceId: 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6f',
    name: 'Guantes de látex',
    quantity: 2,
    unit: 'pares',
    estimatedCostMinor: 500, // 5.00 BOB cada par
    notes: 'Uso obligatorio',
  });

  const service = new DentalService({
    id: 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6f',
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    code: 'SRV-001',
    name: 'Profilaxis Dental Completa',
    category: 'Preventiva',
    description: 'Limpieza con ultrasonido y pulido coronario',
    durationMinutes: 45,
    basePriceMinor: 15000, // 150.00 BOB
    labCostMinor: 0,
    currency: 'BOB',
    isActive: true,
    createdByMembershipId: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c60',
    supplies: [supply],
  });

  assert.equal(service.totalSuppliesCostMinor, 1000); // 500 * 2
  assert.equal(service.estimatedMarginMinor, 14000); // 15000 - 1000

  const json = JSON.parse(JSON.stringify(service));
  assert.equal(json.id, service.id);
  assert.equal(json.name, 'Profilaxis Dental Completa');
  assert.equal(json.code, 'SRV-001');
  assert.equal(json.category, 'Preventiva');
  assert.equal(json.durationMinutes, 45);
  assert.equal(json.basePriceMinor, 15000);
  assert.equal(json.totalSuppliesCostMinor, 1000);
  assert.equal(json.estimatedMarginMinor, 14000);
  assert.equal(json.isActive, true);
  assert.equal(json.supplies.length, 1);
  assert.equal(json.supplies[0].name, 'Guantes de látex');
  assert.equal(json._name, undefined, 'No debe filtrar propiedades internas privadas');
});

test('3. ListDentalServicesUseCase: ejecuta consulta paginada y retorna estructura de scroll infinito', async () => {
  const dummyServices = Array.from({ length: 5 }, (_, i) =>
    new DentalService({
      id: `00000000-0000-0000-0000-00000000000${i + 1}`,
      organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      name: `Servicio Odontológico ${i + 1}`,
      category: 'General',
      durationMinutes: 30,
      basePriceMinor: 10000,
      createdByMembershipId: 'd1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c60',
    }),
  );

  let capturedFilters = null;
  const mockRepo = {
    async findByFilters(filters) {
      capturedFilters = filters;
      return {
        items: dummyServices,
        total: 25,
        page: filters.page || 1,
        limit: filters.limit || 5,
        hasMore: true,
        pagination: {
          page: filters.page || 1,
          pageSize: filters.limit || 5,
          totalItems: 25,
          totalPages: 5,
          hasMore: true,
        },
      };
    },
    async create() {},
    async findById() {},
    async findByCode() {},
    async update() {},
    async delete() {},
  };

  const useCase = new ListDentalServicesUseCase(mockRepo);
  const result = await useCase.execute({
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    page: 2,
    limit: 5,
    search: 'Odontológico',
    category: 'General',
    isActive: true,
  });

  assert.equal(capturedFilters.organizationId, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
  assert.equal(capturedFilters.page, 2);
  assert.equal(capturedFilters.limit, 5);
  assert.equal(capturedFilters.search, 'Odontológico');

  // Verificación de contrato de respuesta estructurado para scroll infinito
  assert.equal(result.items.length, 5);
  assert.equal(result.total, 25);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 5);
  assert.equal(result.hasMore, true);
  assert.ok(result.pagination);
  assert.equal(result.pagination.totalPages, 5);
});

test('4. DentalServiceController: mapea query string a filtros y formato paginado', async () => {
  let executedFilters = null;
  const mockUseCase = {
    async execute(filters) {
      executedFilters = filters;
      return {
        items: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        hasMore: false,
      };
    },
  };

  const controller = new DentalServiceController(
    null, // create
    mockUseCase, // list
    null, // getById
    null, // update
    null, // toggle
    null, // delete
  );

  // Consulta con status 'ACTIVE' e isActive 'true'
  await controller.list({
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    category: 'Ortodoncia',
    isActive: 'true',
    status: 'ACTIVE',
    search: 'bracket',
    page: 2,
    limit: 10,
  });

  assert.equal(executedFilters.organizationId, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
  assert.equal(executedFilters.category, 'Ortodoncia');
  assert.equal(executedFilters.isActive, true);
  assert.equal(executedFilters.search, 'bracket');
  assert.equal(executedFilters.page, 2);
  assert.equal(executedFilters.limit, 10);

  // Consulta con status 'INACTIVE' y pageSize alternativo
  await controller.list({
    organizationId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    status: 'INACTIVE',
    pageSize: 25,
    offset: 50,
  });

  assert.equal(executedFilters.isActive, false);
  assert.equal(executedFilters.limit, 25);
  assert.equal(executedFilters.page, 1);
  assert.equal(executedFilters.offset, 50);
});

test('5. Lógica de Paginación y hasMore: cubre transiciones de primera, intermedia y última página', () => {
  const calcPagination = (total, page, limit, offset) => {
    const lim = Math.max(1, limit ?? 15);
    let p = Math.max(1, page ?? 1);
    let skip;
    if (offset !== undefined && offset >= 0) {
      skip = offset;
      p = Math.floor(skip / lim) + 1;
    } else {
      skip = (p - 1) * lim;
    }

    const remaining = Math.max(0, total - skip);
    const returnedCount = Math.min(lim, remaining);
    const hasMore = skip + returnedCount < total;
    const totalPages = Math.ceil(total / lim);

    return { page: p, limit: lim, skip, returnedCount, hasMore, totalPages };
  };

  // Catálogo vacío
  const pEmpty = calcPagination(0, 1, 15);
  assert.equal(pEmpty.returnedCount, 0);
  assert.equal(pEmpty.hasMore, false);
  assert.equal(pEmpty.totalPages, 0);

  // Primera página con más registros
  const pPage1 = calcPagination(35, 1, 15);
  assert.equal(pPage1.skip, 0);
  assert.equal(pPage1.returnedCount, 15);
  assert.equal(pPage1.hasMore, true);
  assert.equal(pPage1.totalPages, 3);

  // Segunda página con más registros
  const pPage2 = calcPagination(35, 2, 15);
  assert.equal(pPage2.skip, 15);
  assert.equal(pPage2.returnedCount, 15);
  assert.equal(pPage2.hasMore, true);

  // Tercera y última página
  const pPage3 = calcPagination(35, 3, 15);
  assert.equal(pPage3.skip, 30);
  assert.equal(pPage3.returnedCount, 5);
  assert.equal(pPage3.hasMore, false);

  // Scroll infinito por offset
  const pOffset = calcPagination(35, undefined, 15, 30);
  assert.equal(pOffset.page, 3);
  assert.equal(pOffset.skip, 30);
  assert.equal(pOffset.returnedCount, 5);
  assert.equal(pOffset.hasMore, false);
});
