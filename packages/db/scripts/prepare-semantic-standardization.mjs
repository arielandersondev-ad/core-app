import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baselineStorageHash, assertNominalParity, buildRenameStatements } from './semantic-standardization-contract.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(packageRoot, file), 'utf8'));
const before = read(`migrations/snapshots/${baselineStorageHash}/contract.json`);
const after = read('src/prisma/generated/contract.json');
const parity = assertNominalParity(before, after);
const statements = buildRenameStatements(before, after);
const candidates = fs.readdirSync(path.join(packageRoot, 'migrations/app')).filter(name => name.endsWith('_semantic_standardization'));
if (candidates.length !== 1) throw new Error('Expected exactly one newly planned semantic_standardization migration');
const dir = path.join(packageRoot, 'migrations/app', candidates[0]);
const targetHash = after.storage.storageHash;
const sql = 'DO $semantic$\nBEGIN\n  PERFORM set_config(\'lock_timeout\', \'10s\', true);\n  ' + statements.join('\n  ') + '\nEND;\n$semantic$;';
const source = `#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/${targetHash}/contract';
import endContract from '../../snapshots/${targetHash}/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/${baselineStorageHash}/contract';
import startContract from '../../snapshots/${baselineStorageHash}/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

/** Nominal-only migration. Requires the exact start contract; no reset/sign. */
export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;
  override get operations() {
    return [rawSql({
      id: 'semantic-standardization-renames',
      label: 'Rename existing Core/Dentistry objects without changing their definitions',
      operationClass: 'widening',
      summary: 'Coordinated breaking identifier change; preserve rows, ids, types, FK and rules',
      target: { id: 'postgres', details: { schema: 'core', objectType: 'table', name: 'semantic_standardization' } },
      precheck: [],
      execute: [{ description: 'Atomic table, column, constraint and index renames; normalize cancellation spelling', sql: ${JSON.stringify(sql)} }],
      postcheck: [],
    })];
  }
}

MigrationCLI.run(import.meta.url, M);
`;
fs.writeFileSync(path.join(dir, 'migration.ts'), source);
console.log(JSON.stringify({migration:candidates[0],from:baselineStorageHash,to:targetHash,statements:statements.length,parity,next:'Self-emit migration.ts with the installed CLI before use. Not applied.'}));
