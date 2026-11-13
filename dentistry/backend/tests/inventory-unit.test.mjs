import test from 'node:test';
import assert from 'node:assert/strict';

const { InventoryItem } = await import(
  '../dist/modules/inventory/domain/entities/inventory-item.entity.js'
);
const { InventoryMovement } = await import(
  '../dist/modules/inventory/domain/entities/inventory-movement.entity.js'
);
const { CreateInventoryItemUseCase } = await import(
  '../dist/modules/inventory/application/use-case/create-inventory-item.use-case.js'
);
const { RegisterInventoryMovementUseCase } = await import(
  '../dist/modules/inventory/application/use-case/register-inventory-movement.use-case.js'
);

const ORGANIZATION = '00000000-0000-7000-8000-000000000001';
const BRANCH = '00000000-0000-7000-8000-000000000002';
const OTHER_BRANCH = '00000000-0000-7000-8000-000000000003';
const MEMBERSHIP = '00000000-0000-7000-8000-000000000004';

function item(overrides = {}) {
  return new InventoryItem({
    id: 'item-1',
    organizationId: ORGANIZATION,
    branchId: BRANCH,
    sku: 'ANE-LID-001',
    name: 'Anestesia Lidocaína 2%',
    unit: 'cajas',
    minStock: 3,
    currentStock: 6,
    createdByMembershipId: MEMBERSHIP,
    ...overrides,
  });
}

function fakeRepository() {
  const items = [];
  return {
    items,
    async findItems() {
      return items;
    },
    async findItemById(id) {
      return items.find((entry) => entry.id === id) ?? null;
    },
    async findBySku(_organizationId, _branchId, sku) {
      return items.find((entry) => entry.sku === sku) ?? null;
    },
    async createItem(entry) {
      const created = new InventoryItem({
        ...entry,
        id: 'item-1',
      });
      items.push(created);
      return created;
    },
    async updateItem(entry) {
      return entry;
    },
    async softDeleteItem() {
      return null;
    },
    async findMovements() {
      return [];
    },
    async registerMovement(data) {
      return {
        item: item({ currentStock: 4 }),
        movement: new InventoryMovement({
          id: 'movement-1',
          organizationId: data.organizationId,
          branchId: BRANCH,
          itemId: data.itemId,
          type: data.type,
          quantity: data.quantity,
          createdByMembershipId: data.createdByMembershipId,
        }),
      };
    },
  };
}

test('InventoryItem: valida campos obligatorios y stock no negativo', () => {
  assert.throws(() => item({ sku: ' ' }), /SKU/);
  assert.throws(() => item({ name: ' ' }), /nombre/);
  assert.throws(() => item({ unit: ' ' }), /unidad/);
  assert.throws(() => item({ currentStock: -1 }), /stock actual/);
  assert.throws(() => item({ minStock: -1 }), /stock mínimo/);
  assert.throws(() => item({ currency: 'XX' }), /moneda/);
});

test('InventoryItem: calcula OUT_OF_STOCK, LOW y OK', () => {
  assert.equal(item({ currentStock: 0 }).status, 'OUT_OF_STOCK');
  assert.equal(item({ currentStock: 2, minStock: 3 }).status, 'LOW');
  assert.equal(item({ currentStock: 3, minStock: 3 }).status, 'OK');
});

test('InventoryMovement: IN suma, OUT resta y ADJUSTMENT conserva el signo', () => {
  const base = {
    id: 'movement-1',
    organizationId: ORGANIZATION,
    branchId: BRANCH,
    itemId: 'item-1',
    quantity: 6,
    createdByMembershipId: MEMBERSHIP,
  };

  assert.equal(new InventoryMovement({ ...base, type: 'IN' }).signedQuantity, 6);
  assert.equal(new InventoryMovement({ ...base, type: 'OUT' }).signedQuantity, -6);
  assert.equal(
    new InventoryMovement({ ...base, type: 'ADJUSTMENT', quantity: -2 }).signedQuantity,
    -2,
  );
});

test('InventoryMovement: rechaza cantidad cero y salidas negativas', () => {
  const base = {
    id: 'movement-1',
    organizationId: ORGANIZATION,
    branchId: BRANCH,
    itemId: 'item-1',
    createdByMembershipId: MEMBERSHIP,
  };

  assert.throws(
    () => new InventoryMovement({ ...base, type: 'IN', quantity: 0 }),
    /distinto de cero/,
  );
  assert.throws(
    () => new InventoryMovement({ ...base, type: 'OUT', quantity: -1 }),
    /cantidad positiva/,
  );
});

test('CreateInventoryItemUseCase: rechaza sucursal no autorizada', async () => {
  const useCase = new CreateInventoryItemUseCase(fakeRepository());

  await assert.rejects(
    useCase.execute({
      organizationId: ORGANIZATION,
      authorizedBranchIds: [BRANCH],
      branchId: OTHER_BRANCH,
      sku: 'ANE-LID-001',
      name: 'Anestesia',
      unit: 'cajas',
      createdByMembershipId: MEMBERSHIP,
    }),
    /sucursal/,
  );
});

test('CreateInventoryItemUseCase: rechaza SKU duplicado', async () => {
  const repository = fakeRepository();
  repository.items.push(item());
  const useCase = new CreateInventoryItemUseCase(repository);

  await assert.rejects(
    useCase.execute({
      organizationId: ORGANIZATION,
      authorizedBranchIds: [BRANCH],
      branchId: BRANCH,
      sku: 'ANE-LID-001',
      name: 'Anestesia',
      unit: 'cajas',
      createdByMembershipId: MEMBERSHIP,
    }),
    /SKU/,
  );
});

test('CreateInventoryItemUseCase: crea el artículo', async () => {
  const useCase = new CreateInventoryItemUseCase(fakeRepository());
  const created = await useCase.execute({
    organizationId: ORGANIZATION,
    authorizedBranchIds: [BRANCH],
    branchId: BRANCH,
    sku: 'ANE-LID-001',
    name: 'Anestesia',
    unit: 'cajas',
    minStock: 3,
    currentStock: 6,
    createdByMembershipId: MEMBERSHIP,
  });

  assert.equal(created.id, 'item-1');
  assert.equal(created.status, 'OK');
});

test('RegisterInventoryMovementUseCase: valida cantidad y tipo', async () => {
  const useCase = new RegisterInventoryMovementUseCase(fakeRepository());

  await assert.rejects(
    useCase.execute({
      organizationId: ORGANIZATION,
      authorizedBranchIds: [BRANCH],
      itemId: 'item-1',
      type: 'IN',
      quantity: 0,
      createdByMembershipId: MEMBERSHIP,
    }),
    /distinto de cero/,
  );

  await assert.rejects(
    useCase.execute({
      organizationId: ORGANIZATION,
      authorizedBranchIds: [BRANCH],
      itemId: 'item-1',
      type: 'OUT',
      quantity: -1,
      createdByMembershipId: MEMBERSHIP,
    }),
    /cantidad positiva/,
  );
});

test('RegisterInventoryMovementUseCase: delega un ajuste negativo', async () => {
  const useCase = new RegisterInventoryMovementUseCase(fakeRepository());
  const result = await useCase.execute({
    organizationId: ORGANIZATION,
    authorizedBranchIds: [BRANCH],
    itemId: 'item-1',
    type: 'ADJUSTMENT',
    quantity: -2,
    createdByMembershipId: MEMBERSHIP,
  });

  assert.equal(result.movement.signedQuantity, -2);
});
