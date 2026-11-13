import { test } from "node:test";
import assert from "node:assert/strict";

import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();
const {
  inventory,
  inventoryMovements,
  inventoryStatus,
  getMovementsByItem,
  lastRestockAt,
  signedQuantity,
  stockFromMovements,
} = load("src/modules/clinic/__mocks__/data.ts");

const byId = (id) => {
  const item = inventory.find((entry) => entry.id === id);

  if (!item) throw new Error(`missing item ${id}`);

  return item;
};

const movement = (type, quantity) => ({
  id: "x",
  itemId: "inv-1",
  type,
  quantity,
  occurredAt: "2026-08-10",
  reason: "r",
});

test("Inventario: las entradas suman", () => {
  assert.equal(signedQuantity(movement("IN", 6)), 6);
});

test("Inventario: las salidas restan sin importar el signo almacenado", () => {
  assert.equal(signedQuantity(movement("OUT", 6)), -6);
  assert.equal(signedQuantity(movement("OUT", -6)), -6);
});

test("Inventario: los ajustes conservan su propio signo", () => {
  assert.equal(signedQuantity(movement("ADJUSTMENT", -1)), -1);
  assert.equal(signedQuantity(movement("ADJUSTMENT", 2)), 2);
});

test("Inventario: el stock denormalizado concilia con la bitácora", () => {
  const broken = inventory
    .filter((item) => stockFromMovements(item.id) !== item.stock)
    .map((item) => item.id);

  assert.deepEqual(broken, []);
});

test("Inventario: la bitácora nunca produce stock negativo", () => {
  for (const item of inventory) {
    assert.ok(
      stockFromMovements(item.id) >= 0,
      `${item.id} quedó en negativo`,
    );
  }
});

test("Inventario: todo movimiento apunta a un artículo existente", () => {
  const ids = new Set(inventory.map((item) => item.id));

  for (const entry of inventoryMovements) {
    assert.ok(
      ids.has(entry.itemId),
      `${entry.id} apunta a ${entry.itemId}`,
    );
  }
});

test("Inventario: lastRestockAt coincide con lastRefill en todos los artículos", () => {
  const drifted = inventory
    .filter((item) => lastRestockAt(item.id) !== item.lastRefill)
    .map((item) => ({
      id: item.id,
      denormalized: item.lastRefill,
      derived: lastRestockAt(item.id),
    }));

  assert.deepEqual(drifted, []);
});

test("Inventario: lastRestockAt solo considera entradas", () => {
  // inv-8 tiene una salida el 2026-08-19, posterior a su entrada.
  assert.equal(lastRestockAt("inv-8"), "2026-08-12");
});

test("Inventario: lastRestockAt es undefined si nunca hubo entrada", () => {
  assert.equal(lastRestockAt("no-existe"), undefined);
});

test("Inventario: la bitácora se ordena de más reciente a más antigua", () => {
  const dates = getMovementsByItem("inv-1").map(
    (entry) => entry.occurredAt,
  );

  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("Inventario: stock cero es crítico", () => {
  assert.equal(inventoryStatus({ ...byId("inv-1"), stock: 0 }), "critico");
});

test("Inventario: stock en o bajo 30% del mínimo es crítico", () => {
  const base = byId("inv-3"); // minStock 4

  assert.equal(inventoryStatus({ ...base, stock: 1 }), "critico");
  assert.equal(inventoryStatus({ ...base, stock: 2 }), "bajo");
});

test("Inventario: stock en o sobre el mínimo está OK", () => {
  const base = byId("inv-1"); // minStock 3

  assert.equal(inventoryStatus({ ...base, stock: 3 }), "ok");
  assert.equal(inventoryStatus({ ...base, stock: 30 }), "ok");
});

test("Inventario: los estados del mock son coherentes", () => {
  assert.equal(inventoryStatus(byId("inv-1")), "ok"); // 6 / min 3
  assert.equal(inventoryStatus(byId("inv-3")), "bajo"); // 2 / min 4
  assert.equal(inventoryStatus(byId("inv-8")), "bajo"); // 1 / min 2
});

test("Inventario: los datos de demo no fuerzan el estado crítico", () => {
  assert.deepEqual(
    inventory.filter((item) => inventoryStatus(item) === "critico"),
    [],
  );
});
