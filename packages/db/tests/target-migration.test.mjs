import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isolatedPostgres } from './support/isolated-postgres.mjs';
import { fromHash, toHash, migrationName, buildTargetMigration, tablesOf, baseEntitlements, quote, qualify } from '../scripts/target-migration-sql.mjs';
const read = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url)));
const before = read(`../migrations/snapshots/${fromHash}/contract.json`);
const after = read(`../migrations/snapshots/${toHash}/contract.json`);
const sql = fs.readFileSync(new URL(`../migrations/app/${migrationName}/migration.sql`, import.meta.url), 'utf8');
const id = number => `00000000-0000-7000-8000-${String(number).padStart(12, '0')}`;
const oldTables = new Map(tablesOf(before).map(t => [t.key, t]));

async function fixture() {
  const isolated = await isolatedPostgres(before, { getTypeParser: () => value => value });
  const db = isolated.database;
  // PGlite always connects to template1. Emulate only the database-name boundary
  // inside this isolated fixture; execute the emitted migration SQL unchanged.
  await db.exec(`CREATE SCHEMA fixture_boundary;
    CREATE FUNCTION fixture_boundary.current_database() RETURNS name LANGUAGE sql AS $$ SELECT 'dev'::name $$;
    SET search_path=fixture_boundary,pg_catalog,public;
    CREATE SCHEMA prisma_contract; CREATE TABLE prisma_contract.marker(space text,core_hash text);
    INSERT INTO prisma_contract.marker VALUES ('app','${fromHash}'); SET TIME ZONE 'UTC';`);
  async function insert(key, values) {
    const t = oldTables.get(key), row = { createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z', ...values };
    for (const [name, column] of Object.entries(t.columns)) {
      if (name in row || column.nullable || column.default) continue;
      if (name === 'createdAt' || name === 'updatedAt') row[name] = '2026-10-01T12:00:00Z';
      else if (column.nativeType === 'text') row[name] = `test-${name}`;
      else if (column.nativeType === 'int4') row[name] = 1;
      else throw new Error(`Missing fixture value ${key}.${name}`);
    }
    const names = Object.keys(row);
    await db.query(`INSERT INTO ${qualify(t.namespace, t.name)} (${names.map(quote)}) VALUES (${names.map((_, i) => `$${i + 1}`)})`, Object.values(row));
  }
  await insert('core.Organization', { id: id(1), timezone: 'La-Paz' });
  await insert('core.Plan', { id: id(2), vertical: 'DENTISTRY', durationDays: 30, entitlements: {} });
  await insert('core.OrganizationPlanAssignment', { id: id(3), organizationId: id(1), planId: id(2), vertical: 'DENTISTRY', startsAt: '2026-10-01 08:00:00', endsAt: '2026-11-01 08:00:00' });
  await insert('dentistry.Patient', { id: id(4), organizationId: id(1), createdByMembershipId: id(90), birthDate: '2000-04-15 20:00:00' });
  await insert('dentistry.DentalService', { id: id(5), organizationId: id(1), createdByMembershipId: id(90) });
  for (let n = 6; n <= 7; n++) await insert('dentistry.Appointment', { id: id(n), organizationId: id(1), patientId: id(4), serviceId: id(5), branchId: id(91), practitionerMembershipId: id(90), createdByMembershipId: id(90), scheduledStartAt: '2026-10-02 08:00:00', scheduledEndAt: '2026-10-02 09:00:00' });
  await insert('dentistry.AppointmentService', { id: id(8), organizationId: id(1), appointmentId: id(6), serviceId: id(5) });
  for (let n = 10; n <= 12; n++) await insert('dentistry.ClinicalEncounter', { id: id(n), organizationId: id(1), patientId: id(4), branchId: id(91), practitionerMembershipId: id(90), createdByMembershipId: id(90), startedAt: '2026-10-02 08:00:00', endedAt: n === 10 ? '2026-10-02 09:00:00' : null, procedureSummary: 'Test procedure' });
  return { ...isolated, insert };
}

test('emitted operation, readable SQL and pinned snapshots agree', () => {
  assert.equal(sql, buildTargetMigration(before, after));
  const ops = read(`../migrations/app/${migrationName}/ops.json`);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].execute[0].sql, sql);
  assert.doesNotMatch(sql, /DROP TABLE|CASCADE|UPDATE prisma_contract|DELETE FROM|TRUNCATE/i);
});

test('real PostgreSQL migration preserves facts and enforces the target schema', async t => {
  const fixtureDb = await fixture(), db = fixtureDb.database;
  try {
    await db.exec('BEGIN');
    await db.exec(sql);
    const query = async text => (await db.query(text)).rows;
    assert.equal((await query('SELECT count(*)::int n FROM information_schema.tables WHERE table_schema IN (\'core\',\'dentistry\')'))[0].n, 29);
    assert.equal((await query('SELECT count(*)::int n FROM information_schema.columns WHERE table_schema IN (\'core\',\'dentistry\')'))[0].n, 362);
    assert.deepEqual((await query('SELECT "birthDate"::text b FROM dentistry."Patient"'))[0], { b: '2000-04-15' });
    const appointment = (await query('SELECT "scheduledStartAt"::text start,"createdAt"::text created FROM dentistry."Appointment" LIMIT 1'))[0];
    assert.equal(appointment.start, '2026-10-02 12:00:00+00');
    assert.equal(appointment.created, '2026-10-01 12:00:00+00');
    assert.equal((await query('SELECT count(*)::int n FROM dentistry."AppointmentService"'))[0].n, 2);
    assert.equal((await query('SELECT count(*)::int n FROM dentistry."AppointmentService" WHERE "id"=\'' + id(8) + '\''))[0].n, 1);
    assert.deepEqual((await query('SELECT entitlements FROM core."Plan"'))[0].entitlements, baseEntitlements);
    assert.deepEqual((await query('SELECT "entitlementsSnapshot" e FROM core."OrganizationPlanAssignment"'))[0].e, baseEntitlements);
    assert.deepEqual(await query('SELECT "status",count(*)::int n FROM dentistry."ClinicalEncounter" GROUP BY "status" ORDER BY "status"'), [{ status: 'COMPLETED', n: 1 }, { status: 'IN_PROGRESS', n: 2 }]);
    assert.equal((await query('SELECT count(*)::int n FROM dentistry."ClinicalEncounter" WHERE "status"=\'COMPLETED\' AND "completedAt"="endedAt" AND "completedByMembershipId"="practitionerMembershipId"'))[0].n, 1);
    assert.equal((await query('SELECT timezone FROM core."Organization"'))[0].timezone, 'America/La_Paz');
    for (const name of ['core.OrganizationFeatureTrial', 'dentistry.PatientPractitionerAssignment', 'dentistry.PatientBranchAssignment', 'dentistry.BranchSchedulingPolicy']) {
      const [namespace, table] = name.split('.');
      assert.equal((await query(`SELECT count(*)::int n FROM ${qualify(namespace, table)}`))[0].n, 0);
    }
    assert.equal((await query("SELECT count(*)::int n FROM pg_constraint c JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE ns.nspname IN ('core','dentistry') AND c.contype='f'"))[0].n, 43);
    assert.equal((await query("SELECT count(*)::int n FROM pg_constraint c JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE ns.nspname IN ('core','dentistry') AND c.contype='c'"))[0].n, 65);
    await db.exec('ROLLBACK');
    assert.equal((await query('SELECT count(*)::int n FROM dentistry."AppointmentService"'))[0].n, 1);
    assert.equal((await query('SELECT "serviceId"::text s FROM dentistry."Appointment" LIMIT 1'))[0].s, id(5));
    await t.test('new test encounters require review, rather than silently mapping arbitrary rows', async () => {
      await db.exec('BEGIN');
      await db.exec('UPDATE dentistry."ClinicalEncounter" SET "endedAt"=NULL');
      await assert.rejects(db.exec(sql), /cohort changed/);
      await db.exec('ROLLBACK');
    });
    await t.test('late target constraint failure rolls back all casts and backfills', async () => {
      await db.exec('BEGIN');
      await db.exec('UPDATE dentistry."Patient" SET sex=\'UNKNOWN\'');
      await assert.rejects(db.exec(sql), /patient_sex/);
      await db.exec('ROLLBACK');
      assert.equal((await query('SELECT count(*)::int n FROM dentistry."AppointmentService"'))[0].n, 1);
      assert.equal((await query("SELECT data_type FROM information_schema.columns WHERE table_schema='dentistry' AND table_name='Patient' AND column_name='id'"))[0].data_type, 'character');
    });
  } finally { await fixtureDb.close(); }
});
