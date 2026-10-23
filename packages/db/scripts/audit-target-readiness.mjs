import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = path.resolve(packageRoot, '../..');
const requireDb = createRequire(new URL('../package.json', import.meta.url));
const { Client } = requireDb('pg');
const baselineHash = '826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945';
const readJson = relative => JSON.parse(fs.readFileSync(path.join(packageRoot, relative), 'utf8'));
const baseline = readJson(`migrations/snapshots/${baselineHash}/contract.json`);
const target = readJson('src/prisma/generated/contract.json');
const quote = value => `"${value.replaceAll('"', '""')}"`;
const qualify = (namespace, table) => `${quote(namespace)}.${quote(table)}`;
const entries = contract => Object.entries(contract.storage.namespaces).flatMap(([namespace, space]) =>
  Object.entries(space.entries.table).map(([name, table]) => ({ namespace, name, key: `${namespace}.${name}`, ...table })));
const targetTables = entries(target), baselineTables = entries(baseline);
const targetByKey = new Map(targetTables.map(table => [table.key, table]));
const envFiles = ['packages/db/.env', 'core/backend/.env', 'dentistry/backend/.env'];
const readEnv = relative => {
  const file = path.join(repositoryRoot, relative);
  return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
};
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('QA audit: REPEATABLE READ READ ONLY; metadata and aggregate counts only.\nUsage: npm.cmd --prefix packages/db run audit:qa -- [--output <repository-local JSON file>]');
  process.exit(0);
}
if (args.length !== 0 && !(args.length === 2 && args[0] === '--output' && args[1])) throw new Error('Use --output <local JSON file>');
const defaultName = `qa-readiness-${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date())}.json`;
const output = path.resolve(args[1] ?? path.join(packageRoot, 'docs', defaultName));
if (!output.startsWith(repositoryRoot + path.sep)) throw new Error('Output must stay inside this repository');
const connectionString = process.env.DATABASE_URL ?? readEnv('packages/db/.env').DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not configured');
const connection = new URL(connectionString);
if (decodeURIComponent(connection.pathname.slice(1)) !== 'dev') throw new Error('Refusing inspection: selected database is not dev/QA');
const client = new Client({ connectionString, application_name: 'core-app-target-readiness-readonly', connectionTimeoutMillis: 15_000, query_timeout: 20_000 });
const report = {
  startedAt: new Date().toISOString(), expectedBaselineStorageHash: baselineHash, targetStorageHash: target.storageHash,
  localMigrationReference: readJson('migrations/app/refs/db.json'),
  connection: { host: connection.hostname, database: decodeURIComponent(connection.pathname.slice(1)), source: process.env.DATABASE_URL ? 'process.env.DATABASE_URL' : 'packages/db/.env' },
  configuredConnections: envFiles.map(file => ({ file, configured: !!readEnv(file).DATABASE_URL, matchesSelectedConnection: readEnv(file).DATABASE_URL === connectionString })),
  isolation: 'REPEATABLE READ READ ONLY', dataPolicy: 'schema metadata and aggregate counts only; no patient identities, clinical text, credentials or file keys',
  checks: [], skipped: [], tableProfiles: [], schemaChanges: [], baselineDrift: [],
};
let queryCount = 0;
async function query(sql, parameters = []) {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error('Data inspection only accepts SELECT/WITH');
  const result = await client.query(sql, parameters);
  queryCount++;
  if (queryCount % 30 === 0) console.log(`Read-only audit: ${queryCount} SELECT statements completed`);
  return result.rows;
}
const usedColumns = expression => [...expression.matchAll(/"([^"]+)"/g)].map(match => match[1]);
let actualColumns;
function has(table, columns) { return columns.every(column => actualColumns.get(table.key)?.has(column)); }
function uuidExpression(alias, column, table) {
  const reference = `${alias}.${quote(column)}`;
  return targetByKey.get(table.key)?.columns[column]?.nativeType === 'uuid'
    ? `(CASE WHEN pg_input_is_valid(${reference}::text, 'uuid') THEN ${reference}::text::uuid END)` : reference;
}
async function check(table, name, columns, sql, extra = {}) {
  if (!has(table, columns)) { report.skipped.push({ table: table.key, name, reason: 'columns/table not yet present', ...extra }); return; }
  const result = (await query(sql))[0];
  report.checks.push({ table: table.key, name, ...extra, ...result });
}
async function countWhere(table, name, columns, predicate) {
  return check(table, name, columns, `SELECT count(*)::int AS "affectedRows" FROM ${qualify(table.namespace, table.name)} s WHERE ${predicate}`);
}
const logicalType = type => ({ character: 'bpchar', boolean: 'bool', 'character varying': 'varchar', integer: 'int4', 'timestamp without time zone': 'timestamp', 'timestamp with time zone': 'timestamptz' })[type] ?? type;

async function main() {
  try {
    await client.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SET LOCAL lock_timeout = '2s'");
    report.server = (await query(`SELECT current_database() AS database, current_setting('server_version') AS version,
      current_setting('TimeZone') AS timezone, current_setting('transaction_read_only') AS "transactionReadOnly",
      clock_timestamp() AS "observedAt", r.rolsuper AS "isSuperuser", r.rolbypassrls AS "bypassesRls"
      FROM pg_roles r WHERE r.rolname = current_user`))[0];
    if (report.server.transactionReadOnly !== 'on') throw new Error('Read-only transaction is not active');
    report.marker = await query('SELECT space, core_hash, profile_hash, updated_at FROM prisma_contract.marker ORDER BY space');
    report.migrationLedger = await query(`SELECT space, migration_name, origin_core_hash, destination_core_hash, created_at
      FROM prisma_contract.ledger WHERE space='app' ORDER BY created_at`);
    report.baselineMarkerMatches = report.marker.some(marker => marker.space === 'app' && marker.core_hash === baselineHash);
    report.catalog = {
      tables: await query(`SELECT n.nspname AS namespace, c.relname AS name, c.relrowsecurity AS "rowSecurity", c.relforcerowsecurity AS "forceRowSecurity"
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('core','dentistry') AND c.relkind IN ('r','p') ORDER BY 1,2`),
      columns: await query(`SELECT table_schema AS namespace, table_name AS "tableName", column_name AS name,
        udt_name AS type, is_nullable='YES' AS nullable, character_maximum_length AS length, column_default AS "defaultExpression", datetime_precision AS "datetimePrecision"
        FROM information_schema.columns WHERE table_schema IN ('core','dentistry') ORDER BY 1,2,ordinal_position`),
      constraints: await query(`SELECT n.nspname AS namespace, c.relname AS "tableName", k.conname AS name, k.contype AS type,
        k.convalidated AS validated, pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k
        JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('core','dentistry') ORDER BY 1,2,3`),
      indexes: await query(`SELECT n.nspname AS namespace, c.relname AS "tableName", i.relname AS name,
        x.indisvalid AS valid, x.indisunique AS unique, pg_get_indexdef(i.oid) AS definition
        FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('core','dentistry') ORDER BY 1,2,3`),
      views: await query(`SELECT schemaname AS namespace, viewname AS name FROM pg_views WHERE schemaname IN ('core','dentistry') ORDER BY 1,2`),
      triggers: await query(`SELECT n.nspname AS namespace, c.relname AS "tableName", t.tgname AS name FROM pg_trigger t
        JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('core','dentistry') AND NOT t.tgisinternal ORDER BY 1,2,3`),
    };
    actualColumns = new Map(report.catalog.tables.map(table => [`${table.namespace}.${table.name}`, new Map()]));
    for (const column of report.catalog.columns) actualColumns.get(`${column.namespace}.${column.tableName}`)?.set(column.name, column);
    for (const table of baselineTables) {
      const columns = actualColumns.get(table.key);
      if (!columns) { report.baselineDrift.push({ table: table.key, issue: 'missing table' }); continue; }
      for (const [name, expected] of Object.entries(table.columns)) {
        const column = columns.get(name);
        if (!column) { report.baselineDrift.push({ table: table.key, column: name, issue: 'missing column' }); continue; }
        if (logicalType(expected.nativeType) !== column.type || expected.nullable !== column.nullable ||
          (expected.typeParams?.length !== undefined && expected.typeParams.length !== column.length))
          report.baselineDrift.push({ table: table.key, column: name, issue: 'type/nullability/length mismatch', expected, actual: column });
      }
      for (const name of columns.keys()) if (!table.columns[name]) report.baselineDrift.push({ table: table.key, column: name, issue: 'extra column' });
    }
    for (const actual of report.catalog.tables) if (!baselineTables.some(table => table.key === `${actual.namespace}.${actual.name}`))
      report.baselineDrift.push({ table: `${actual.namespace}.${actual.name}`, issue: 'extra table' });

    for (const table of targetTables) {
      if (!actualColumns.has(table.key)) { report.schemaChanges.push({ table: table.key, kind: 'new table', columns: Object.keys(table.columns).length }); continue; }
      const metrics = [{ name: 'rows', sql: 'count(*)::int' }];
      for (const [name, goal] of Object.entries(table.columns)) {
        const actual = actualColumns.get(table.key).get(name);
        if (!actual) { report.schemaChanges.push({ table: table.key, column: name, kind: 'new column', required: !goal.nullable, hasStorageDefault: !!goal.default }); continue; }
        if (goal.nativeType === 'uuid') {
          metrics.push({ name: `uuidInvalid:${name}`, sql: `count(*) FILTER (WHERE ${quote(name)} IS NOT NULL AND NOT pg_input_is_valid(${quote(name)}::text,'uuid'))::int` });
          metrics.push({ name: `nonNull:${name}`, sql: `count(${quote(name)})::int` });
        }
        if (!goal.nullable) metrics.push({ name: `nullRequired:${name}`, sql: `count(*) FILTER (WHERE ${quote(name)} IS NULL)::int` });
        if (logicalType(goal.nativeType) !== actual.type) {
          report.schemaChanges.push({ table: table.key, column: name, kind: 'type conversion', from: actual.type, to: goal.nativeType });
          if (goal.nativeType === 'timestamptz' || goal.nativeType === 'date') metrics.push({ name: `temporalNonNull:${name}`, sql: `count(${quote(name)})::int` });
        }
      }
      if (has(table, ['deleted','deletedAt'])) {
        metrics.push({ name: 'deletedFlagWithoutDate', sql: 'count(*) FILTER (WHERE "deleted" AND "deletedAt" IS NULL)::int' });
        metrics.push({ name: 'deletedDateWithoutFlag', sql: 'count(*) FILTER (WHERE NOT "deleted" AND "deletedAt" IS NOT NULL)::int' });
      }
      const profile = (await query(`SELECT ${metrics.map(metric => `${metric.sql} AS ${quote(metric.name)}`).join(',')} FROM ${qualify(table.namespace, table.name)}`))[0];
      report.tableProfiles.push({ table: table.key, ...profile });
      for (const name of actualColumns.get(table.key).keys()) if (!table.columns[name]) report.schemaChanges.push({ table: table.key, column: name, kind: 'retired column' });

      for (const rule of table.checks ?? []) await check(table, rule.name, usedColumns(rule.expression),
        `SELECT count(*)::int AS "affectedRows" FROM ${qualify(table.namespace,table.name)} WHERE (${rule.expression}) IS FALSE`, { kind: 'target CHECK' });
      const keys = [{ name: 'primaryKey', ...table.primaryKey }, ...table.uniques.map((key,index) => ({ name: `unique:${index}`, ...key })), ...table.indexes.filter(index => index.unique)];
      for (const key of keys) {
        const columns = [...(key.columns ?? []), ...usedColumns(key.expression ?? ''), ...usedColumns(key.where ?? '')];
        const expressions = key.expression ? [key.expression] : key.columns.map(column => uuidExpression('s',column,table));
        const nonNull = expressions.map(expression => `(${expression}) IS NOT NULL`).join(' AND ');
        await check(table, key.name, columns, `SELECT count(*)::int AS "duplicateGroups", COALESCE(sum(n),0)::int AS "affectedRows" FROM (
          SELECT count(*) n FROM ${qualify(table.namespace,table.name)} s WHERE ${nonNull}${key.where ? ` AND (${key.where})` : ''}
          GROUP BY ${expressions.join(',')} HAVING count(*) > 1) duplicates`, { kind: 'target UNIQUE/PK', columns: key.columns ?? [], normalizedUuid: true });
      }
      for (const [index, key] of (table.foreignKeys ?? []).entries()) {
        const referenced = targetByKey.get(`${key.target.namespaceId}.${key.target.tableName}`);
        if (!has(referenced, key.target.columns)) { report.skipped.push({ table: table.key, name: `fk:${index}`, reason: 'referenced table/columns not yet present' }); continue; }
        const nonNull = key.source.columns.map(column => `s.${quote(column)} IS NOT NULL`).join(' AND ');
        const equality = key.source.columns.map((column,i) => `${uuidExpression('s',column,table)} = ${uuidExpression('r',key.target.columns[i],referenced)}`).join(' AND ');
        await check(table, `fk:${index}`, key.source.columns,
          `SELECT count(*)::int AS "affectedRows" FROM ${qualify(table.namespace,table.name)} s WHERE ${nonNull}
          AND NOT EXISTS (SELECT 1 FROM ${qualify(referenced.namespace,referenced.name)} r WHERE ${equality})`,
          { kind: 'target FK', columns: key.source.columns, target: referenced.key, targetColumns: key.target.columns });
      }
    }

    for (const table of targetTables.filter(table => table.namespace === 'dentistry' && actualColumns.has(table.key))) {
      for (const column of ['organizationId', 'branchId', ...Object.keys(table.columns).filter(name => name.endsWith('MembershipId'))]) {
        if (!has(table,[column])) continue;
        const isOrganization = column === 'organizationId', isBranch = column === 'branchId';
        const referenced = targetByKey.get(`core.${isOrganization ? 'Organization' : isBranch ? 'Branch' : 'OrganizationMembership'}`);
        const tenant = isOrganization ? '' : ` AND ${uuidExpression('r','organizationId',referenced)} = ${uuidExpression('s','organizationId',table)}`;
        await countWhere(table, `core-reference:${column}`, [column,'organizationId'], `s.${quote(column)} IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM ${qualify(referenced.namespace,referenced.name)} r WHERE ${uuidExpression('r','id',referenced)} = ${uuidExpression('s',column,table)}${tenant})`);
      }
    }
    const table = (namespace,name) => targetByKey.get(`${namespace}.${name}`);
    const patient = table('dentistry','Patient');
    await countWhere(patient, 'birthDate:not-midnight', ['birthDate'], 's."birthDate" IS NOT NULL AND s."birthDate"::time <> TIME \'00:00:00\'');
    await countWhere(patient, 'birthDate:future-date', ['birthDate'], 's."birthDate"::date > CURRENT_DATE');
    const appointment = table('dentistry','Appointment'), links = table('dentistry','AppointmentService');
    if (has(appointment,['serviceId'])) {
      await countWhere(appointment,'legacy-service:missing-link',['serviceId','id','organizationId'], `s."serviceId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dentistry."AppointmentService" r
        WHERE r."appointmentId"=s."id" AND r."serviceId"=s."serviceId" AND r."organizationId"=s."organizationId")`);
    }
    await countWhere(links,'legacy-price:currency-required',['priceMinor'], 's."priceMinor" IS NOT NULL');
    await countWhere(table('dentistry','DentalServiceSupply'),'retired-inventory-reference:populated',['inventoryItemId'], 's."inventoryItemId" IS NOT NULL');
    const radiograph = table('dentistry','Radiograph');
    if (has(radiograph,['takenAt','clinicalFileId'])) {
      await check(radiograph,'capture-time:comparison',['takenAt','clinicalFileId'], `SELECT
        count(*) FILTER (WHERE s."takenAt" IS NOT NULL AND f."capturedAt" IS NULL)::int AS "missingFileCaptureTime",
        count(*) FILTER (WHERE s."takenAt" IS NOT NULL AND f."capturedAt" IS NOT NULL AND s."takenAt" IS DISTINCT FROM f."capturedAt")::int AS "conflictingCaptureTime"
        FROM dentistry."Radiograph" s JOIN dentistry."ClinicalFile" f ON f.id=s."clinicalFileId"`);
    }
    const plan = table('core','Plan');
    await check(plan,'entitlements:version-and-shape',['entitlements'], `SELECT
      count(*)::int AS "planRows", count(*) FILTER (WHERE jsonb_typeof("entitlements")<>'object')::int AS "nonObject",
      count(*) FILTER (WHERE NOT ("entitlements" ? 'schemaVersion'))::int AS "missingVersion",
      count(*) FILTER (WHERE "entitlements" ? 'schemaVersion' AND jsonb_typeof("entitlements"->'schemaVersion') IS DISTINCT FROM 'number')::int AS "invalidVersionType",
      count(*) FILTER (WHERE jsonb_typeof("entitlements"->'limits') IS DISTINCT FROM 'object')::int AS "missingLimitsObject",
      count(*) FILTER (WHERE jsonb_typeof("entitlements"->'features') IS DISTINCT FROM 'object')::int AS "missingFeaturesObject"
      FROM core."Plan"`);
    for (const name of ['Organization','Branch']) await countWhere(table('core',name),'timezone:noncanonical-or-unlisted',['timezone'],
      `NOT EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name=s."timezone")`);
    report.temporalEvidence = {
      timezoneLabels: await query(`SELECT 'Organization' AS entity, timezone, count(*)::int AS rows FROM core."Organization" GROUP BY timezone
        UNION ALL SELECT 'Branch', timezone, count(*)::int FROM core."Branch" GROUP BY timezone ORDER BY entity, timezone`),
      birthDateTimes: await query(`SELECT "birthDate"::time::text AS "timeOfDay", count(*)::int AS rows FROM dentistry."Patient"
        WHERE "birthDate" IS NOT NULL GROUP BY "birthDate"::time ORDER BY 1`),
      encounterCompletion: (await query(`SELECT count(*)::int AS rows,
        count(*) FILTER (WHERE "endedAt" IS NOT NULL)::int AS "endedAtPresent",
        count(*) FILTER (WHERE "procedureSummary" IS NOT NULL AND length(btrim("procedureSummary"))>0)::int AS "procedureSummaryPresent",
        count(*) FILTER (WHERE "endedAt" IS NOT NULL AND "procedureSummary" IS NOT NULL AND length(btrim("procedureSummary"))>0)::int AS "endedWithProcedure",
        count(*) FILTER (WHERE "updatedByMembershipId" IS NOT NULL)::int AS "updatedByPresent"
        FROM dentistry."ClinicalEncounter"`))[0],
      clinicalAuditEvents: (await query(`SELECT count(*)::int AS rows FROM core."AuditLog"
        WHERE resource IN ('ClinicalEncounter','clinical_encounters','ClinicalHistory','PatientHealthProfile','clinical_histories','Patient')`))[0].rows,
    };
    report.temporalEvidence.timezoneLabels = report.temporalEvidence.timezoneLabels.map(row => {
      try { return { ...row, acceptedByNodeIntl: true, canonicalLabel: new Intl.DateTimeFormat('en-US', { timeZone:row.timezone }).resolvedOptions().timeZone }; }
      catch { return { ...row, acceptedByNodeIntl: false, canonicalLabel: null }; }
    });
    report.planUsage = await query(`SELECT
      (SELECT count(*)::int FROM core."Branch" b WHERE b."organizationId"=a."organizationId" AND b."deletedAt" IS NULL AND b.status='ACTIVE') AS "activeBranches",
      (SELECT count(*)::int FROM core."OrganizationMembership" m WHERE m."organizationId"=a."organizationId" AND m."deletedAt" IS NULL AND m.status IN ('ACTIVE','INVITED')) AS "activeOrInvitedMemberships",
      (SELECT count(*)::int FROM dentistry."Patient" p WHERE p."organizationId"=a."organizationId" AND p."deletedAt" IS NULL) AS "nonDeletedPatients"
      FROM core."OrganizationPlanAssignment" a WHERE a.vertical='DENTISTRY'`);
    report.commercialEvidence = (await query(`SELECT count(*)::int AS rows,
      count(*) FILTER (WHERE entitlements='{}'::jsonb)::int AS "emptyEntitlements",
      count(*) FILTER (WHERE jsonb_typeof(entitlements->'limits'->'patients')='number')::int AS "patientLimitNumeric",
      count(*) FILTER (WHERE jsonb_typeof(entitlements->'limits'->'branches')='number')::int AS "branchLimitNumeric",
      count(*) FILTER (WHERE jsonb_typeof(entitlements->'limits'->'members')='number')::int AS "memberLimitNumeric"
      FROM core."Plan"`))[0];
    await check(table('core','OrganizationMembershipBranch'),'membership-branch:organization-coherence',['membershipId','branchId'], `SELECT count(*)::int AS "affectedRows"
      FROM core."OrganizationMembershipBranch" s JOIN core."OrganizationMembership" m ON m.id=s."membershipId"
      JOIN core."Branch" b ON b.id=s."branchId" WHERE m."organizationId"<>b."organizationId"`);
    await check(table('core','OrganizationMembershipRole'),'membership-role:organization-coherence',['membershipId','roleId'], `SELECT count(*)::int AS "affectedRows"
      FROM core."OrganizationMembershipRole" s JOIN core."OrganizationMembership" m ON m.id=s."membershipId"
      JOIN core."Role" r ON r.id=s."roleId" WHERE r."organizationId" IS NOT NULL AND m."organizationId"<>r."organizationId"`);
    await check(table('core','AuditLog'),'audit-branch:organization-coherence',['branchId','organizationId'], `SELECT count(*)::int AS "affectedRows"
      FROM core."AuditLog" s JOIN core."Branch" b ON b.id=s."branchId"
      WHERE s."organizationId" IS NOT NULL AND s."organizationId"<>b."organizationId"`);

    // Status values are technical labels only. Unexpected free text is redacted.
    report.statusProfiles = [];
    for (const targetTable of targetTables.filter(item => has(item,['status']))) {
      const states = await query(`SELECT status, count(*)::int AS rows FROM ${qualify(targetTable.namespace,targetTable.name)} GROUP BY status ORDER BY status`);
      report.statusProfiles.push({ table: targetTable.key, states: states.map(state => ({ state: /^[A-Z_]{1,40}$/.test(state.status ?? '') ? state.status : '[non-canonical label]', rows: state.rows })) });
    }
    report.requiredHistoricalFields = report.schemaChanges.filter(change => change.kind === 'new column' && change.required && !change.hasStorageDefault)
      .map(change => ({ ...change, rowsRequiringEvidence: report.tableProfiles.find(profile => profile.table === change.table)?.rows ?? 0 }));
    report.summary = {
      actualTables: report.catalog.tables.length, actualColumns: report.catalog.columns.length, targetTables: targetTables.length,
      targetChecksEvaluated: report.checks.filter(check => check.kind === 'target CHECK').length,
      targetChecksTotal: targetTables.reduce((sum,table)=>sum+(table.checks??[]).length,0),
      targetForeignKeysEvaluated: report.checks.filter(check => check.kind === 'target FK').length,
      targetUniqueKeysEvaluated: report.checks.filter(check => check.kind === 'target UNIQUE/PK').length,
      crossSchemaReferencesEvaluated: report.checks.filter(check => check.name.startsWith('core-reference:')).length,
      checksWithAffectedRows: report.checks.filter(check => (check.affectedRows ?? 0) > 0).length,
      invalidUuidValues: report.tableProfiles.reduce((total,profile) => total+Object.entries(profile).filter(([name])=>name.startsWith('uuidInvalid:')).reduce((n,[,count])=>n+count,0),0),
      softDeleteContradictions: report.tableProfiles.reduce((total,profile) => total+(profile.deletedFlagWithoutDate??0)+(profile.deletedDateWithoutFlag??0),0),
      totalBusinessRows: report.tableProfiles.reduce((total,profile)=>total+profile.rows,0),
      selectStatements: queryCount,
    };
    await client.query('ROLLBACK');
    report.completedAt = new Date().toISOString();
    report.complete = true;
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({ output: path.relative(repositoryRoot,output), baselineMarkerMatches:report.baselineMarkerMatches, baselineColumnDrift:report.baselineDrift.length, summary:report.summary, rows:report.tableProfiles.map(({table,rows})=>({table,rows})) },null,2));
  } finally {
    try { await client.query('ROLLBACK'); } catch { /* Closed or failed connection. */ }
    await client.end();
  }
}
main().catch(error => {
  // Never log pg error detail, row payloads or a connection string.
  console.error(JSON.stringify({ name:error.name, code:error.code, message:String(error.message).replaceAll(connectionString,'[REDACTED CONNECTION]') }));
  process.exitCode=1;
});
