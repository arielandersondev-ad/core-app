import { describe, expect, it } from 'vitest';

import {
  getMovementsByItem,
  inventory,
  inventoryMovements,
  inventoryStatus,
  lastRestockAt,
  signedQuantity,
  stockFromMovements,
  type InventoryItem,
} from '@/shared/data/clinic-data';

const byId = (id: string): InventoryItem => {
  const item = inventory.find((i) => i.id === id);

  if (!item) throw new Error(`missing item ${id}`);

  return item;
};

describe('signedQuantity', () => {
  it('entradas add', () => {
    expect(
      signedQuantity({
        id: 'x',
        itemId: 'inv-1',
        type: 'entrada',
        quantity: 6,
        date: '2026-08-10',
        reason: 'r',
      })
    ).toBe(6);
  });

  it('salidas subtract regardless of the stored sign', () => {
    expect(
      signedQuantity({
        id: 'x',
        itemId: 'inv-1',
        type: 'salida',
        quantity: 6,
        date: '2026-08-10',
        reason: 'r',
      })
    ).toBe(-6);
  });

  it('ajustes keep their own sign', () => {
    const base = {
      id: 'x',
      itemId: 'inv-1',
      type: 'ajuste',
      date: '2026-08-10',
      reason: 'r',
    } as const;

    expect(signedQuantity({ ...base, quantity: -1 })).toBe(-1);
    expect(signedQuantity({ ...base, quantity: 2 })).toBe(2);
  });
});

describe('stock ledger', () => {
  it('reconciles with the stored stock for every item', () => {
    const broken = inventory
      .filter(
        (item) => stockFromMovements(item.id) !== item.stock
      )
      .map((item) => item.id);

    expect(broken).toEqual([]);
  });

  it('never yields negative stock', () => {
    for (const item of inventory) {
      expect(stockFromMovements(item.id)).toBeGreaterThanOrEqual(
        0
      );
    }
  });

  it('every movement points at an existing item', () => {
    const ids = new Set(inventory.map((i) => i.id));

    for (const movement of inventoryMovements) {
      expect(ids.has(movement.itemId)).toBe(true);
    }
  });
});

describe('lastRestockAt', () => {
  it('matches the denormalized lastRefill on every item', () => {
    const drifted = inventory
      .filter(
        (item) => lastRestockAt(item.id) !== item.lastRefill
      )
      .map((item) => ({
        id: item.id,
        denormalized: item.lastRefill,
        derived: lastRestockAt(item.id),
      }));

    expect(drifted).toEqual([]);
  });

  it('only considers entradas', () => {
    // inv-8 has a salida on 2026-08-19, later than its restock
    expect(lastRestockAt('inv-8')).toBe('2026-08-12');
  });

  it('is undefined for an item that was never restocked', () => {
    expect(lastRestockAt('no-existe')).toBeUndefined();
  });
});

describe('getMovementsByItem', () => {
  it('returns newest first', () => {
    const dates = getMovementsByItem('inv-1').map(
      (m) => m.date
    );

    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe('inventoryStatus', () => {
  it('flags zero stock as critical', () => {
    expect(
      inventoryStatus({ ...byId('inv-1'), stock: 0 })
    ).toBe('critico');
  });

  it('flags stock at or under 30% of the minimum as critical', () => {
    const base = byId('inv-3'); // minStock 4

    expect(
      inventoryStatus({ ...base, stock: 1 })
    ).toBe('critico');
    expect(
      inventoryStatus({ ...base, stock: 2 })
    ).toBe('bajo');
  });

  it('is ok at or above the minimum', () => {
    const base = byId('inv-1'); // minStock 3

    expect(
      inventoryStatus({ ...base, stock: 3 })
    ).toBe('ok');
    expect(
      inventoryStatus({ ...base, stock: 30 })
    ).toBe('ok');
  });

  it('agrees with the shipped mock data', () => {
    // inv-1: 6 / min 3 -> at or above minimum
    expect(inventoryStatus(byId('inv-1'))).toBe('ok');
    // inv-3: 2 / min 4 -> below minimum but above 30% of it
    expect(inventoryStatus(byId('inv-3'))).toBe('bajo');
    // inv-8: 1 / min 2 -> 50% of the minimum, still not critical
    expect(inventoryStatus(byId('inv-8'))).toBe('bajo');
  });

  it('has no item in a critical state by default', () => {
    // Worth knowing: the demo data never exercises the "critico" badge.
    expect(
      inventory.filter(
        (item) => inventoryStatus(item) === 'critico'
      )
    ).toEqual([]);
  });
});