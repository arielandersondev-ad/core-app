import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fromHash, toHash, migrationName, buildTargetMigration } from './target-migration-sql.mjs';
const root = new URL('../', import.meta.url);
const read = hash => JSON.parse(fs.readFileSync(new URL(`migrations/snapshots/${hash}/contract.json`, root)));
const dir = new URL(`migrations/app/${migrationName}/`, root);
// This authoring tool must never rewrite a package already emitted/applied.
if (fs.existsSync(new URL('migration.json', dir))) throw new Error('Migration already emitted; do not rewrite it');
fs.mkdirSync(dir, { recursive: true });
const sql = buildTargetMigration(read(fromHash), read(toHash));
fs.writeFileSync(new URL('migration.sql', dir), sql);
fs.writeFileSync(new URL('migration.ts', dir), `#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/${fromHash}/contract';
import type { Contract as End } from '../../snapshots/${toHash}/contract';
import startContract from '../../snapshots/${fromHash}/contract.json' with { type: 'json' };
import endContract from '../../snapshots/${toHash}/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

/** Coordinated breaking schema change, with explicitly approved QA test-data rules. */
export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;
  override get operations() {
    return [rawSql({
      id: 'target-schema-and-approved-qa-reconciliation',
      label: 'Native types, target relations and approved QA data reconciliation',
      operationClass: 'destructive',
      summary: 'Preserve existing entities and service links; retire reviewed redundant columns; no automatic grants',
      target: { id: 'postgres', details: { schema: 'core', objectType: 'table', name: 'target_schema' } },
      precheck: [],
      execute: [{ description: 'Atomic, guarded SQL; human-readable copy in migration.sql', sql: ${JSON.stringify(sql)} }],
      postcheck: [],
    })];
  }
}
MigrationCLI.run(import.meta.url, M);
`);
console.log(`Prepared ${fileURLToPath(dir)}; self-emit and test before applying.`);
