import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { baselineStorageHash, assertNominalParity, buildRenameStatements } from '../scripts/semantic-standardization-contract.mjs';
import { preservedColumns } from '../scripts/semantic-standardization-map.mjs';

const read = relative => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'));
const before = read(`../migrations/snapshots/${baselineStorageHash}/contract.json`);
// This suite protects the already-applied nominal migration, not later product changes.
const after = read('../migrations/snapshots/826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945/contract.json');

test('the 25 existing tables, 318 fields and 76 relationships retain their definitions', () => {
  assert.deepEqual(assertNominalParity(before, after), { tableCount:25, fieldCount:318, relationCount:76 });
});

test('a nominal rename cannot loosen the required service or change a native id type', () => {
  const changed = structuredClone(after);
  changed.storage.namespaces.dentistry.entries.table.Appointment.columns.serviceId.nullable = true;
  assert.throws(() => assertNominalParity(before, changed), /Storage changed/);
  const cast = structuredClone(after);
  cast.storage.namespaces.core.entries.table.User.columns.id.nativeType = 'uuid';
  assert.throws(() => assertNominalParity(before, cast), /Storage changed/);
});

test('future column retirements remain present and cannot slip into this migration', () => {
  assert.deepEqual(preservedColumns, ['deleted','serviceId','inventoryItemId','takenAt']);
  const changed = structuredClone(after);
  delete changed.storage.namespaces.dentistry.entries.table.Patient.columns.deleted;
  assert.throws(() => assertNominalParity(before, changed), /Storage changed/);
  assert.ok(after.storage.namespaces.dentistry.entries.table.Appointment.columns.serviceId);
  assert.ok(after.storage.namespaces.dentistry.entries.table.DentalServiceSupply.columns.inventoryItemId);
  assert.ok(after.storage.namespaces.dentistry.entries.table.Radiograph.columns.takenAt);
});

test('foreign-key targets and relationship cardinalities cannot change during renaming', () => {
  const changed = structuredClone(after);
  changed.storage.namespaces.dentistry.entries.table.Appointment.foreignKeys[0].target.tableName = 'Treatment';
  assert.throws(() => assertNominalParity(before, changed), /Storage changed/);
  const cardinality = structuredClone(after);
  cardinality.domain.namespaces.core.models.User.relations.credential.cardinality = '1:N';
  assert.throws(() => assertNominalParity(before, cardinality), /Domain types/);
});

test('the migration contains only metadata renames and cancellation spelling normalization', () => {
  const statements = buildRenameStatements(before, after);
  assert.equal(statements.filter(s => /RENAME TO/.test(s) && s.startsWith('ALTER TABLE')).length, 17);
  assert.equal(statements.filter(s => /RENAME COLUMN/.test(s)).length, 15);
  assert.equal(statements.filter(s => s.startsWith('UPDATE')).length, 1);
  assert.ok(statements.every(s => /^ALTER (TABLE|INDEX) .* RENAME |^UPDATE "dentistry"\."Appointment" SET "status" = 'CANCELED' WHERE "status" = 'CANCELLED';$/.test(s)));
  assert.ok(statements.every(s => !/\b(DROP|CREATE|TRUNCATE|DELETE)\b|ALTER COLUMN/.test(s)));
});

test('execution defaults are preserved, including UUID generation and updatedAt behavior', () => {
  const changed = structuredClone(after);
  changed.execution.mutations.defaults[0].onCreate = {kind:'generator',id:'different'};
  assert.throws(() => assertNominalParity(before, changed), /Execution defaults/);
});

test('the emitted migration starts at the current baseline and contains the reviewed atomic SQL', () => {
  const migrations = new URL('../migrations/app/', import.meta.url);
  const directory = fs.readdirSync(migrations).find(name => name.endsWith('_semantic_standardization'));
  assert.ok(directory);
  const metadata = read(`../migrations/app/${directory}/migration.json`);
  const ops = read(`../migrations/app/${directory}/ops.json`);
  assert.equal(metadata.from, before.storage.storageHash);
  assert.equal(metadata.to, after.storage.storageHash);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].execute.length, 1);
  const sql = ops[0].execute[0].sql;
  assert.ok(sql.startsWith('DO $semantic$\nBEGIN'));
  assert.ok(sql.endsWith('END;\n$semantic$;'));
  for (const statement of buildRenameStatements(before, after)) assert.ok(sql.includes(statement));
  assert.ok(!/\b(DROP|CREATE|TRUNCATE|DELETE)\b|ALTER COLUMN/.test(sql));
});
