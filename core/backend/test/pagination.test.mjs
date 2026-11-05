import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from '../dist/common/pagination/pagination.js';
import { PaginationQueryDto } from '../dist/common/presentation/dto/pagination.query.dto.js';
import { ListOrganizationsQueryDto } from '../dist/modules/organization/presentation/dto/list-organizations.query.dto.js';
import { ListOrganizationsUseCase } from '../dist/modules/organization/application/use-case/list-organizations.use-case.js';
import { OrganizationController } from '../dist/modules/organization/presentation/http/organization.controller.js';
import { ListUsersQueryDto } from '../dist/modules/user/presentation/dto/list-users.query.dto.js';
import { ListUsersUseCase } from '../dist/modules/user/application/use-case/list-users.use-case.js';
import { UserController } from '../dist/modules/user/presentation/http/user.controller.js';

test('1. PaginationQueryDto: valida parámetros con defaults canónicos', async () => {
  const dtoDefault = plainToInstance(PaginationQueryDto, {});
  const errorsDefault = await validate(dtoDefault);
  assert.equal(errorsDefault.length, 0);
  assert.equal(dtoDefault.page, DEFAULT_PAGE);
  assert.equal(dtoDefault.pageSize, DEFAULT_PAGE_SIZE);

  const dtoCustom = plainToInstance(PaginationQueryDto, {
    page: 2,
    limit: 25,
    pageSize: 25,
    offset: 25,
  });
  const errorsCustom = await validate(dtoCustom);
  assert.equal(errorsCustom.length, 0);
  assert.equal(dtoCustom.page, 2);
  assert.equal(dtoCustom.limit, 25);
  assert.equal(dtoCustom.offset, 25);
});

test('2. createPaginatedResult: genera contrato canónico { items, total, page, limit, hasMore }', () => {
  // Primera página con registros restantes
  const itemsPage1 = [{ id: '1' }, { id: '2' }, { id: '3' }];
  const res1 = createPaginatedResult(itemsPage1, { page: 1, limit: 3 }, 8);
  assert.equal(res1.items.length, 3);
  assert.equal(res1.total, 8);
  assert.equal(res1.page, 1);
  assert.equal(res1.limit, 3);
  assert.equal(res1.hasMore, true);
  assert.equal(res1.pagination.totalPages, 3);

  // Segunda página
  const itemsPage2 = [{ id: '4' }, { id: '5' }, { id: '6' }];
  const res2 = createPaginatedResult(itemsPage2, { page: 2, limit: 3 }, 8);
  assert.equal(res2.hasMore, true);

  // Tercera página (última)
  const itemsPage3 = [{ id: '7' }, { id: '8' }];
  const res3 = createPaginatedResult(itemsPage3, { page: 3, limit: 3 }, 8);
  assert.equal(res3.items.length, 2);
  assert.equal(res3.total, 8);
  assert.equal(res3.page, 3);
  assert.equal(res3.limit, 3);
  assert.equal(res3.hasMore, false);

  // Paginación por offset directo (scroll infinito)
  const resOffset = createPaginatedResult(itemsPage3, { offset: 6, limit: 3 }, 8);
  assert.equal(resOffset.page, 3);
  assert.equal(resOffset.hasMore, false);
});

test('3. ListOrganizationsUseCase & OrganizationController: listado con paginación canónica y filtros', async () => {
  const dummyOrgs = [
    { id: 'org-1', name: 'Clínica Dental Central', status: 'ACTIVE' },
    { id: 'org-2', name: 'Centro Odontológico Norte', status: 'ACTIVE' },
  ];

  let capturedQuery = null;
  const mockRepo = {
    async createOrganization() {},
    async findAll() { return dummyOrgs; },
    async findById() { return null; },
    async listOrganizations(query) {
      capturedQuery = query;
      return createPaginatedResult(dummyOrgs, { page: query?.page ?? 1, limit: query?.limit ?? 15 }, 2);
    },
  };

  const useCase = new ListOrganizationsUseCase(mockRepo);
  const controller = new OrganizationController(null, null, useCase, null);

  const queryDto = plainToInstance(ListOrganizationsQueryDto, {
    page: 1,
    limit: 10,
    search: 'Central',
    status: 'ACTIVE',
  });

  const response = await controller.listOrganizations(queryDto);

  assert.equal(capturedQuery.search, 'Central');
  assert.equal(capturedQuery.status, 'ACTIVE');
  assert.equal(capturedQuery.page, 1);
  assert.equal(capturedQuery.limit, 10);

  // Verificación de contrato canónico
  assert.equal(response.items.length, 2);
  assert.equal(response.total, 2);
  assert.equal(response.page, 1);
  assert.equal(response.limit, 10);
  assert.equal(response.hasMore, false);
  assert.ok(response.pagination);
});

test('4. ListUsersUseCase & UserController: listado de usuarios con paginación canónica', async () => {
  const dummyUsers = [
    { id: 'u-1', email: 'dr.perez@clinica.com', firstName: 'Juan', lastName: 'Pérez', status: 'ACTIVE', memberships: [] },
    { id: 'u-2', email: 'dra.gomez@clinica.com', firstName: 'María', lastName: 'Gómez', status: 'ACTIVE', memberships: [] },
  ];

  let capturedQuery = null;
  const mockRepo = {
    async listUsers(query) {
      capturedQuery = query;
      return createPaginatedResult(dummyUsers, { page: query?.page ?? 1, limit: query?.limit ?? 15 }, 12);
    },
    async listUsersByOrganizationScope() { return []; },
    async emailExists() { return false; },
    async findAuthRecord() { return null; },
    async findCurrentSession() { return null; },
    async createUserWithMembership() {},
  };

  const useCase = new ListUsersUseCase(mockRepo);
  const controller = new UserController(null, useCase);

  const queryDto = plainToInstance(ListUsersQueryDto, {
    page: 1,
    limit: 2,
    search: 'Pérez',
    status: 'ACTIVE',
  });

  const response = await controller.listUsers(queryDto);

  assert.equal(capturedQuery.search, 'Pérez');
  assert.equal(capturedQuery.page, 1);
  assert.equal(capturedQuery.limit, 2);

  // Verificación de contrato canónico
  assert.equal(response.items.length, 2);
  assert.equal(response.total, 12);
  assert.equal(response.page, 1);
  assert.equal(response.limit, 2);
  assert.equal(response.hasMore, true);
  assert.equal(response.pagination.totalPages, 6);
});
