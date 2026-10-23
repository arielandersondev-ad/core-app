// Read-only comparison of committed QA data with the approved rehearsal receipt.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import postgres from '@prisma/orm-postgres/runtime';
import { fromHash, toHash, migrationName, tablesOf, qualify, retainedProjection, baseEntitlements } from './target-migration-sql.mjs';
const root = new URL('../', import.meta.url);
const read = file => JSON.parse(fs.readFileSync(new URL(file, root)));
const receipt = read('docs/target-schema-rehearsal-2026-10-23.json');
assert.equal(receipt.rolledBack, true);
assert.equal(receipt.fromHash, fromHash);
assert.equal(receipt.toHash, toHash);
const before = read(`migrations/snapshots/${fromHash}/contract.json`);
const after = read(`migrations/snapshots/${toHash}/contract.json`);
const sources = new Map(tablesOf(before).map(t => [t.key, t]));
const connectionString = dotenv.parse(fs.readFileSync(new URL('.env', root))).DATABASE_URL;
if (new URL(connectionString).pathname !== '/dev') throw new Error('Only dev/QA is allowed');
const { Client } = createRequire(new URL('../package.json', import.meta.url))('pg');
const client = new Client({ connectionString, application_name: 'core-app-target-migration-postcheck-readonly', connectionTimeoutMillis: 15000, query_timeout: 20000 });
const report = { startedAt: new Date().toISOString(), migrationName, toHash, mode: 'REPEATABLE READ READ ONLY', tables: [], ormReads: [] };
try {
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await client.query("SET LOCAL statement_timeout='15s'");
  await client.query("SET LOCAL TIME ZONE 'UTC'");
  report.marker = (await client.query("SELECT space,core_hash,profile_hash,updated_at FROM prisma_contract.marker WHERE space='app'")).rows[0];
  assert.equal(report.marker.core_hash, toHash);
  report.ledger = (await client.query('SELECT migration_name,origin_core_hash,destination_core_hash,created_at FROM prisma_contract.ledger WHERE space=\'app\' AND migration_name=$1', [migrationName])).rows;
  assert.equal(report.ledger.length, 1);
  assert.equal(report.ledger[0].destination_core_hash, toHash);
  for (const table of tablesOf(after)) {
    const previous = receipt.tables.find(t => t.table === table.key), source = sources.get(table.key);
    let digestSql = '';
    if (source) digestSql = `,md5(coalesce(string_agg(md5(jsonb_build_array(${retainedProjection(source, table, false)})::text),'' ORDER BY "id"::text::uuid::text),'')) AS digest`;
    const result = (await client.query(`SELECT count(*)::int rows ${digestSql} FROM ${qualify(table.namespace, table.name)}`)).rows[0];
    assert.equal(result.rows, previous.resultingRows, `${table.key} count differs from rehearsal`);
    if (source && table.key !== 'dentistry.AppointmentService') assert.equal(result.digest, previous.retainedFactsDigest, `${table.key} retained facts differ from rehearsal`);
    if (table.key === 'dentistry.AppointmentService') {
      // The audited QA baseline had no existing links; all six are new associations.
      assert.equal(previous.originalRows, 0);
      assert.equal((await client.query('SELECT count(*)::int n FROM dentistry."AppointmentService" s JOIN dentistry."Appointment" a ON a.id=s."appointmentId" JOIN dentistry."DentalService" d ON d.id=s."serviceId" WHERE s."organizationId"=a."organizationId" AND s."organizationId"=d."organizationId" AND s."priceMinor" IS NULL AND s.currency IS NULL AND s."durationMinutes" IS NULL')).rows[0].n, result.rows);
    }
    report.tables.push({ table: table.key, rows: result.rows, retainedFactsMatch: true });
  }
  assert.deepEqual((await client.query('SELECT entitlements FROM core."Plan"')).rows[0].entitlements, baseEntitlements);
  assert.equal((await client.query('SELECT count(*)::int n FROM core."OrganizationPlanAssignment" a JOIN core."Plan" p ON p.id=a."planId" WHERE a."entitlementsSnapshot" IS DISTINCT FROM p.entitlements')).rows[0].n, 0);
  report.clinicalStatuses = (await client.query('SELECT status,count(*)::int rows FROM dentistry."ClinicalEncounter" GROUP BY status ORDER BY status')).rows;
  assert.deepEqual(report.clinicalStatuses, receipt.clinicalStatuses);
  assert.equal((await client.query('SELECT count(*)::int n FROM dentistry."ClinicalEncounter" WHERE status=\'COMPLETED\' AND ("completedAt" IS DISTINCT FROM "endedAt" OR "completedByMembershipId" IS DISTINCT FROM "practitionerMembershipId")')).rows[0].n, 0);
  // Real Prisma compiler/driver reads over the same read-only QA transaction.
  // Read all model shapes once; persist only whether a row existed, never its contents.
  const runtime = postgres({ contractJson: after, binding: { kind: 'pgClient', client } });
  for (const table of tablesOf(after)) {
    const row = await runtime.orm[table.namespace][table.name].first();
    report.ormReads.push({ table: table.key, success: true, hasRow: !!row });
  }
  await client.query('ROLLBACK');
  report.completedAt = new Date().toISOString();
  report.ok = true;
  fs.writeFileSync(new URL('docs/target-schema-applied-2026-10-23.json', root), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'PASS', originalRowsPreserved: receipt.tables.reduce((n, t) => n + t.originalRows, 0), resultingRows: report.tables.reduce((n, t) => n + t.rows, 0), ormModelsRead: report.ormReads.length, report: 'docs/target-schema-applied-2026-10-23.json' }));
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Read-only postcheck failed:', error.message);
  process.exitCode = 1;
} finally { await client.end(); }
