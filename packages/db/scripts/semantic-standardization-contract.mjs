import assert from 'node:assert/strict';
import { tableRenames, modelRenames, columnRenames, relationRenames, quoteIdentifier as q } from './semantic-standardization-map.mjs';

export const baselineStorageHash = '0ebda04f6a9e692ce82d511f100cd78a2f29836b1b82b73e3ecac8963ff6a6e2';
const clone = value => structuredClone(value);
const tableName = (ns, name) => tableRenames[ns]?.[name] ?? name;
const fields = (ns, table) => columnRenames[`${ns}.${tableName(ns, table)}`] ?? {};
const fieldName = (ns, table, name) => fields(ns, table)[name] ?? name;
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const canonical = value => JSON.stringify(sorted(value));
const sortRows = rows => [...rows].sort((a, b) => canonical(a).localeCompare(canonical(b)));
const renameKeys = (value, map) => Object.fromEntries(Object.entries(value).map(([key, v]) => [map[key] ?? key, v]));

function indexShape(index) { const { name, prefix, ...shape } = index; return shape; }
function mappedForeignKey(fk) {
  const out = clone(fk);
  for (const side of ['source', 'target']) {
    const ref = out[side];
    ref.columns = ref.columns.map(c => fieldName(ref.namespaceId, ref.tableName, c));
    ref.tableName = tableName(ref.namespaceId, ref.tableName);
  }
  return out;
}

/** Rejects any structural or execution-default change beyond the approved names. */
export function assertNominalParity(before, after) {
  const expectedStorage = clone(before.storage.namespaces);
  let tableCount = 0, fieldCount = 0, relationCount = 0;
  for (const [ns, namespace] of Object.entries(expectedStorage)) {
    const tables = namespace.entries.table;
    const transformed = {};
    for (const [oldTable, original] of Object.entries(tables)) {
      const table = clone(original), mapping = fields(ns, oldTable);
      tableCount++; fieldCount += Object.keys(table.columns).length;
      table.columns = renameKeys(table.columns, mapping);
      table.foreignKeys = sortRows((table.foreignKeys ?? []).map(mappedForeignKey));
      for (const key of ['primaryKey', 'uniques', 'indexes']) {
        const entries = key === 'primaryKey' ? [table[key]] : table[key];
        for (const entry of entries ?? []) if (entry) entry.columns = entry.columns.map(c => mapping[c] ?? c);
      }
      table.indexes = sortRows((table.indexes ?? []).map(indexShape));
      table.uniques = sortRows(table.uniques ?? []);
      transformed[tableName(ns, oldTable)] = table;
    }
    namespace.entries.table = transformed;
  }
  const actualStorage = clone(after.storage.namespaces);
  for (const namespace of Object.values(actualStorage)) for (const table of Object.values(namespace.entries.table)) {
    table.foreignKeys = sortRows(table.foreignKeys ?? []);
    table.indexes = sortRows((table.indexes ?? []).map(indexShape));
    table.uniques = sortRows(table.uniques ?? []);
  }
  assert.deepEqual(sorted(actualStorage), sorted(expectedStorage), 'Storage changed beyond the approved names');

  const expectedDomain = clone(before.domain);
  for (const [ns, namespace] of Object.entries(expectedDomain.namespaces)) {
    const transformed = {};
    for (const [oldModel, model] of Object.entries(namespace.models)) {
      const nextModel = modelRenames[oldModel] ?? oldModel;
      const oldTable = model.storage.table, mapping = fields(ns, oldTable);
      model.fields = renameKeys(model.fields, mapping);
      model.storage.fields = renameKeys(model.storage.fields, mapping);
      for (const field of Object.values(model.storage.fields)) field.column = mapping[field.column] ?? field.column;
      model.storage.table = tableName(ns, oldTable);
      const relations = {};
      for (const [name, relation] of Object.entries(model.relations ?? {})) {
        relationCount++;
        const target = before.domain.namespaces[relation.to.namespace].models[relation.to.model];
        relation.on.localFields = relation.on.localFields.map(c => mapping[c] ?? c);
        relation.on.targetFields = relation.on.targetFields.map(c => fieldName(relation.to.namespace, target.storage.table, c));
        relation.to.model = modelRenames[relation.to.model] ?? relation.to.model;
        relations[relationRenames[nextModel]?.[name] ?? name] = relation;
      }
      model.relations = relations;
      transformed[nextModel] = model;
    }
    namespace.models = transformed;
  }
  assert.deepEqual(sorted(after.domain), sorted(expectedDomain), 'Domain types, relationships or cardinalities changed');
  const expectedRoots = Object.fromEntries(Object.entries(before.roots).map(([name, root]) => [modelRenames[name] ?? tableName(root.namespace, name), { ...root, model: modelRenames[root.model] ?? root.model }]));
  assert.deepEqual(sorted(after.roots), sorted(expectedRoots), 'Unexpected root-model change');
  const defaults = before.execution.mutations.defaults.map(item => {
    const next = clone(item), { namespace, table, column } = next.ref;
    next.ref.table = tableName(namespace, table);
    next.ref.column = fieldName(namespace, table, column);
    return next;
  });
  assert.deepEqual(sortRows(after.execution.mutations.defaults), sortRows(defaults), 'Execution defaults changed');
  assert.deepEqual(after.capabilities, before.capabilities);
  assert.deepEqual(after.extensions, before.extensions);
  assert.equal(after.profileHash, before.profileHash);
  return { tableCount, fieldCount, relationCount };
}

const qualified = (ns, table) => `${q(ns)}.${q(table)}`;
const constraintName = (table, columns, suffix) => `${table}_${columns.join('_')}_${suffix}`.slice(0, 63);

/** All statements run in one PostgreSQL DO block (atomic); no drops or casts. */
export function buildRenameStatements(before, after) {
  assertNominalParity(before, after);
  const sql = [];
  for (const [ns, mapping] of Object.entries(tableRenames)) for (const [oldTable, next] of Object.entries(mapping)) {
    sql.push(`ALTER TABLE ${qualified(ns, oldTable)} RENAME TO ${q(next)};`);
  }
  for (const [key, mapping] of Object.entries(columnRenames)) {
    const [ns, table] = key.split('.');
    for (const [oldName, next] of Object.entries(mapping)) sql.push(`ALTER TABLE ${qualified(ns, table)} RENAME COLUMN ${q(oldName)} TO ${q(next)};`);
  }
  for (const [ns, namespace] of Object.entries(before.storage.namespaces)) {
    for (const [oldTable, table] of Object.entries(namespace.entries.table)) {
      const nextTable = tableName(ns, oldTable), mapping = fields(ns, oldTable);
      const nextStorage = after.storage.namespaces[ns].entries.table[nextTable];
      const renameConstraint = (oldName, nextName) => {
        if (oldName !== nextName) sql.push(`ALTER TABLE ${qualified(ns, nextTable)} RENAME CONSTRAINT ${q(oldName)} TO ${q(nextName)};`);
      };
      if (table.primaryKey) renameConstraint(`${oldTable}_pkey`.slice(0,63), `${nextTable}_pkey`.slice(0,63));
      for (const unique of table.uniques ?? []) {
        renameConstraint(unique.name ?? constraintName(oldTable, unique.columns, 'key'), unique.name ?? constraintName(nextTable, unique.columns.map(c => mapping[c] ?? c), 'key'));
      }
      for (const fk of table.foreignKeys ?? []) {
        renameConstraint(fk.name ?? constraintName(oldTable, fk.source.columns, 'fkey'), fk.name ?? constraintName(nextTable, fk.source.columns.map(c => mapping[c] ?? c), 'fkey'));
      }
      const used = new Set();
      for (const index of table.indexes ?? []) {
        const mapped = { ...indexShape(index), columns: index.columns.map(c => mapping[c] ?? c) };
        const nextIndex = nextStorage.indexes.find(candidate => !used.has(candidate.name) && canonical(indexShape(candidate)) === canonical(mapped));
        assert.ok(nextIndex, `Missing equivalent index for ${ns}.${index.name}`);
        used.add(nextIndex.name);
        if (index.name !== nextIndex.name) sql.push(`ALTER INDEX ${qualified(ns, index.name)} RENAME TO ${q(nextIndex.name)};`);
      }
    }
  }
  sql.push(`UPDATE "dentistry"."Appointment" SET "status" = 'CANCELED' WHERE "status" = 'CANCELLED';`);
  return sql;
}
