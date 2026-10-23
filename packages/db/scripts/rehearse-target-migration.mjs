// Uses the configured QA connection. Always rolls back DDL and data changes.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import assert from 'node:assert/strict';
import { fromHash, toHash, migrationName, tablesOf, qualify, retainedProjection } from './target-migration-sql.mjs';
const root = new URL('../', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, root)));
const before = read(`migrations/snapshots/${fromHash}/contract.json`);
const after = read(`migrations/snapshots/${toHash}/contract.json`);
const sql = fs.readFileSync(new URL(`migrations/app/${migrationName}/migration.sql`, root), 'utf8');
const connectionString = dotenv.parse(fs.readFileSync(new URL('.env', root))).DATABASE_URL;
const connection = new URL(connectionString);
if (decodeURIComponent(connection.pathname.slice(1)) !== 'dev') throw new Error('Only dev/QA is allowed');
const { Client } = createRequire(new URL('../package.json', import.meta.url))('pg');
const client = new Client({ connectionString, application_name: 'core-app-target-migration-rollback-rehearsal', connectionTimeoutMillis: 15000, query_timeout: 60000 });
const report = { startedAt: new Date().toISOString(), fromHash, toHash, migrationName,
  database: 'dev', mode: 'DDL and data rehearsal, mandatory ROLLBACK', tables: [], checks: [] };
const sourceTables = tablesOf(before), targetTables = tablesOf(after);
const targets = new Map(targetTables.map(t => [t.key, t]));
async function fingerprint(table, source, ids) {
  const result = await client.query(`SELECT count(*)::int AS rows,
    md5(coalesce(string_agg(md5(jsonb_build_array(${retainedProjection(table, targets.get(table.key), source)})::text),'' ORDER BY "id"::text::uuid::text),'')) AS digest,
    array_agg("id"::text::uuid::text ORDER BY "id"::text::uuid::text) AS ids
    FROM ${qualify(table.namespace, table.name)} ${ids ? 'WHERE "id"::text::uuid = ANY($1::uuid[])' : ''}`, ids ? [ids] : []);
  return result.rows[0];
}
let rolledBack = false;
try {
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await client.query("SET LOCAL statement_timeout='60s'");
  await client.query("SET LOCAL lock_timeout='10s'");
  await client.query("SET LOCAL TIME ZONE 'UTC'");
  await client.query(`LOCK TABLE ${sourceTables.map(t => qualify(t.namespace, t.name)).join(', ')} IN ACCESS EXCLUSIVE MODE`);
  const markerBefore = (await client.query("SELECT core_hash FROM prisma_contract.marker WHERE space='app'")).rows[0].core_hash;
  assert.equal(markerBefore, fromHash);
  const original = new Map();
  for (const table of sourceTables) original.set(table.key, await fingerprint(table, true));
  console.log('Source facts fingerprinted inside the locked transaction; executing emitted SQL.');
  await client.query(sql);
  console.log('SQL completed; checking retained values, relations, constraints and approved mappings.');
  for (const table of sourceTables) {
    const initial = original.get(table.key), final = await fingerprint(table, false, initial.ids ?? []);
    assert.equal(final.rows, initial.rows, `Original rows lost: ${table.key}`);
    assert.equal(final.digest, initial.digest, `Retained facts changed unexpectedly: ${table.key}`);
    const count = (await client.query(`SELECT count(*)::int n FROM ${qualify(table.namespace, table.name)}`)).rows[0].n;
    if (table.key !== 'dentistry.AppointmentService') assert.equal(count, initial.rows, `Unexpected new rows: ${table.key}`);
    report.tables.push({ table: table.key, originalRows: initial.rows, resultingRows: count, retainedFactsDigest: final.digest, retainedFactsMatch: true });
  }
  for (const table of targetTables.filter(t => !original.has(t.key))) {
    const count = (await client.query(`SELECT count(*)::int n FROM ${qualify(table.namespace, table.name)}`)).rows[0].n;
    assert.equal(count, 0, `Unexpected automatic grants/configuration in ${table.key}`);
    report.tables.push({ table: table.key, originalRows: 0, resultingRows: count });
  }
  const columns = (await client.query("SELECT table_schema,table_name,column_name,udt_name,is_nullable FROM information_schema.columns WHERE table_schema IN ('core','dentistry')")).rows;
  assert.equal(columns.length, 362);
  for (const t of targetTables) for (const [name, c] of Object.entries(t.columns)) {
    const actual = columns.find(x => x.table_schema === t.namespace && x.table_name === t.name && x.column_name === name);
    assert.ok(actual, `Missing ${t.key}.${name}`);
    assert.equal(actual.udt_name, c.nativeType, `${t.key}.${name} type`);
    assert.equal(actual.is_nullable === 'YES', c.nullable, `${t.key}.${name} nullable`);
  }
  const constraints = (await client.query("SELECT contype,count(*)::int n FROM pg_constraint c JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE ns.nspname IN ('core','dentistry') GROUP BY contype")).rows;
  assert.equal(constraints.find(c => c.contype === 'f').n, 43);
  assert.equal(constraints.find(c => c.contype === 'c').n, 65);
  assert.equal(constraints.find(c => c.contype === 'p').n, 29);
  assert.equal((await client.query("SELECT count(*)::int n FROM pg_constraint c JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE ns.nspname IN ('core','dentistry') AND NOT c.convalidated")).rows[0].n, 0);
  assert.equal((await client.query('SELECT count(*)::int n FROM core."OrganizationPlanAssignment" a JOIN core."Plan" p ON p.id=a."planId" WHERE a."entitlementsSnapshot" IS DISTINCT FROM p.entitlements')).rows[0].n, 0);
  report.clinicalStatuses = (await client.query('SELECT status,count(*)::int rows FROM dentistry."ClinicalEncounter" GROUP BY status ORDER BY status')).rows;
  assert.deepEqual(report.clinicalStatuses, [{ status: 'COMPLETED', rows: 1 }, { status: 'IN_PROGRESS', rows: 2 }]);
  assert.equal((await client.query('SELECT count(*)::int n FROM dentistry."ClinicalEncounter" WHERE status=\'COMPLETED\' AND ("completedAt" IS DISTINCT FROM "endedAt" OR "completedByMembershipId" IS DISTINCT FROM "practitionerMembershipId")')).rows[0].n, 0);
  assert.equal((await client.query("SELECT core_hash FROM prisma_contract.marker WHERE space='app'")).rows[0].core_hash, fromHash);
  report.checks = ['all retained values match approved projections', '29 tables / 362 columns / 43 validated FK / 65 validated CHECK', 'all original entities preserved', 'no automatic access or plan grants', 'clinical and entitlement mappings match approvals', 'marker unchanged by SQL'];
  await client.query('ROLLBACK');
  rolledBack = true;
  assert.equal((await client.query("SELECT count(*)::int n FROM information_schema.columns WHERE table_schema IN ('core','dentistry')")).rows[0].n, 318);
  assert.equal((await client.query("SELECT core_hash FROM prisma_contract.marker WHERE space='app'")).rows[0].core_hash, fromHash);
  report.rolledBack = true;
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(new URL('docs/target-schema-rehearsal-2026-10-23.json', root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'PASS; ROLLBACK confirmed', tables: report.tables.length, checks: report.checks, report: 'docs/target-schema-rehearsal-2026-10-23.json' }));
} catch (error) {
  if (!rolledBack) await client.query('ROLLBACK').catch(() => {});
  console.error('Rehearsal failed; transaction rolled back:', error.message);
  process.exitCode = 1;
} finally { await client.end(); }
