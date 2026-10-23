// Pure, pinned migration compiler. No connection, marker writes or inferred grants.
import { createHash } from 'node:crypto';
export const fromHash = '826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945';
export const toHash = 'a2da18a1e42ff8ae6f0d46751f9a5a2e83a412042830e84417c6b6cec115f99b';
export const migrationName = '20261023T1300_target_schema';
export const baseEntitlements = {
  schemaVersion: 1,
  limits: { patients: 300, branches: 1, members: 2 },
  features: { clinicalHistory: true, appointments: true, procedureNotes: true,
    customForms: false, payments: false, treatments: false, odontogram: false,
    files: false, patientSelfService: false },
};
export const quote = value => `"${value.replaceAll('"', '""')}"`;
export const qualify = (namespace, name) => `${quote(namespace)}.${quote(name)}`;
export const tablesOf = contract => Object.entries(contract.storage.namespaces).flatMap(([namespace, space]) =>
  Object.entries(space.entries.table).map(([name, table]) => ({ namespace, name, key: `${namespace}.${name}`, ...table })));
const literal = value => typeof value === 'string' ? `'${value.replaceAll("'", "''")}'` : JSON.stringify(value);
export const nativeType = column => column.nativeType + (column.typeParams?.length ? `(${column.typeParams.length})` : '');
// Project the retained facts identically before/after conversion, for rehearsal receipts.
export function retainedProjection(table, target, source) {
  return Object.keys(table.columns).filter(name => target.columns[name]).map(name => {
    const goal = target.columns[name], old = table.columns[name], value = quote(name);
    if (source && goal.nativeType === 'uuid') return `${value}::text::uuid`;
    if (source && old.nativeType === 'timestamp' && goal.nativeType === 'timestamptz') return `${value} AT TIME ZONE 'America/La_Paz'`;
    if (source && old.nativeType === 'timestamp' && goal.nativeType === 'date') return `${value}::date`;
    if (source && table.key === 'core.Plan' && name === 'entitlements') return `'${JSON.stringify(baseEntitlements)}'::jsonb`;
    if (source && ['core.Organization', 'core.Branch'].includes(table.key) && name === 'timezone') return `CASE WHEN ${value} IN ('La-Paz','America/La_paz') THEN 'America/La_Paz' ELSE ${value} END`;
    return value;
  }).join(',');
}
const defaultSql = column => column.default ? column.default.kind === 'function' ? column.default.expression : literal(column.default.value) : null;
const columnsSql = columns => columns.map(quote).join(', ');
const constraintName = (table, columns, suffix) => {
  const full = `${table}_${columns.join('_')}_${suffix}`;
  return full.length <= 63 ? full : `${full.slice(0, 54)}_${createHash('sha256').update(full).digest('hex').slice(0, 8)}`;
};

export function buildTargetMigration(before, after) {
  if (before.storage.storageHash !== fromHash || after.storage.storageHash !== toHash)
    throw new Error('Migration only accepts the reviewed baseline and target snapshots');
  const oldTables = tablesOf(before), tables = tablesOf(after);
  const oldByKey = new Map(oldTables.map(table => [table.key, table]));
  const sql = [];
  const add = line => sql.push(`  ${line}`);
  const guard = (condition, message) => add(`IF ${condition} THEN RAISE EXCEPTION ${literal(message)}; END IF;`);
  add("PERFORM set_config('lock_timeout', '10s', true);");
  guard("current_database() <> 'dev'", 'This data reconciliation is restricted to dev/QA');
  guard(`NOT EXISTS (SELECT 1 FROM prisma_contract.marker WHERE space = 'app' AND core_hash = '${fromHash}')`, 'Unexpected app baseline marker; do not sign or reset');
  add(`LOCK TABLE ${oldTables.map(t => qualify(t.namespace, t.name)).join(', ')} IN ACCESS EXCLUSIVE MODE;`);
  guard("(SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('core','dentistry') AND table_type = 'BASE TABLE') <> 25 OR (SELECT count(*) FROM information_schema.columns WHERE table_schema IN ('core','dentistry')) <> 318", 'Unexpected source structure; repeat readiness audit');
  // These approvals concern the three audited test encounters, not arbitrary clinical history.
  guard('(SELECT count(*) FROM dentistry."ClinicalEncounter") <> 3 OR (SELECT count(*) FROM dentistry."ClinicalEncounter" WHERE "endedAt" IS NOT NULL) <> 1', 'Test encounter cohort changed; completion mapping needs review');
  guard("(SELECT count(*) FROM core.\"Plan\") <> 1 OR EXISTS (SELECT 1 FROM core.\"Plan\" WHERE entitlements <> '{}'::jsonb OR vertical <> 'DENTISTRY')", 'Test base plan changed; entitlement mapping needs review');
  for (const name of ['ClinicalFile', 'Radiograph', 'DentalServiceSupply'])
    guard(`EXISTS (SELECT 1 FROM dentistry.${quote(name)})`, `${name} contains data requiring a separate preservation mapping`);
  guard('EXISTS (SELECT 1 FROM dentistry."AppointmentService" WHERE "priceMinor" IS NOT NULL)', 'Existing service prices need an explicit historical currency');
  for (const table of oldTables.filter(t => 'deleted' in t.columns))
    guard(`EXISTS (SELECT 1 FROM ${qualify(table.namespace, table.name)} WHERE "deleted" IS DISTINCT FROM ("deletedAt" IS NOT NULL))`, `Contradictory soft deletion in ${table.key}`);
  // Never drop tables, primary keys or rows. Remove dependent secondary objects before casts.
  add(`FOR item IN SELECT n.nspname, c.relname, k.conname FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('core','dentistry') AND k.contype='f' ORDER BY n.nspname,c.relname,k.conname LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', item.nspname,item.relname,item.conname);
  END LOOP;`);
  add(`FOR item IN SELECT n.nspname,c.relname,k.conname FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('core','dentistry') AND k.contype IN ('u','c') ORDER BY n.nspname,c.relname,k.conname LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',item.nspname,item.relname,item.conname);
  END LOOP;`);
  add(`FOR item IN SELECT n.nspname,i.relname FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_namespace n ON n.oid=i.relnamespace WHERE n.nspname IN ('core','dentistry') AND NOT x.indisprimary ORDER BY n.nspname,i.relname LOOP
    EXECUTE format('DROP INDEX %I.%I',item.nspname,item.relname);
  END LOOP;`);
  for (const table of tables) {
    const old = oldByKey.get(table.key), tableSql = qualify(table.namespace, table.name);
    if (!old) {
      const definitions = Object.entries(table.columns).map(([name, column]) =>
        `${quote(name)} ${nativeType(column)}${column.nullable ? '' : ' NOT NULL'}${defaultSql(column) === null ? '' : ` DEFAULT ${defaultSql(column)}`}`);
      definitions.push(`PRIMARY KEY (${columnsSql(table.primaryKey.columns)})`);
      add(`CREATE TABLE ${tableSql} (${definitions.join(', ')});`);
      continue;
    }
    for (const [name, column] of Object.entries(table.columns)) {
      const previous = old.columns[name], columnSql = quote(name);
      if (!previous) {
        // Required historical facts are backfilled explicitly before SET NOT NULL.
        add(`ALTER TABLE ${tableSql} ADD COLUMN ${columnSql} ${nativeType(column)}${defaultSql(column) === null ? '' : ` DEFAULT ${defaultSql(column)}`};`);
        continue;
      }
      if (nativeType(previous) !== nativeType(column)) {
        let expression;
        if (column.nativeType === 'uuid') expression = `${columnSql}::text::uuid`;
        else if (previous.nativeType === 'timestamp' && column.nativeType === 'timestamptz') expression = `${columnSql} AT TIME ZONE 'America/La_Paz'`;
        else if (previous.nativeType === 'timestamp' && column.nativeType === 'date') expression = `${columnSql}::date`;
        else throw new Error(`Unreviewed conversion: ${table.key}.${name}`);
        add(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} TYPE ${nativeType(column)} USING (${expression});`);
      }
      if (JSON.stringify(previous.default) !== JSON.stringify(column.default))
        add(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} ${defaultSql(column) === null ? 'DROP DEFAULT' : `SET DEFAULT ${defaultSql(column)}`};`);
      if (previous.nullable !== column.nullable)
        add(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} ${column.nullable ? 'DROP' : 'SET'} NOT NULL;`);
    }
  }
  // Original timestamps remain unchanged. New association timestamps record migration time,
  // rather than claiming the service had been recorded at the original appointment's creation.
  add(`INSERT INTO dentistry."AppointmentService" ("id","organizationId","appointmentId","serviceId","createdAt","updatedAt")
    SELECT gen_random_uuid(),a."organizationId",a."id",a."serviceId"::text::uuid,transaction_timestamp(),transaction_timestamp()
    FROM dentistry."Appointment" a WHERE NOT EXISTS (SELECT 1 FROM dentistry."AppointmentService" s WHERE s."appointmentId"=a."id" AND s."serviceId"=a."serviceId"::text::uuid);`);
  guard('EXISTS (SELECT 1 FROM dentistry."Appointment" a WHERE NOT EXISTS (SELECT 1 FROM dentistry."AppointmentService" s WHERE s."appointmentId"=a."id" AND s."serviceId"=a."serviceId"::text::uuid AND s."organizationId"=a."organizationId"))', 'Legacy appointment service was not preserved');
  add(`UPDATE dentistry."ClinicalEncounter" SET "status"=CASE WHEN "endedAt" IS NOT NULL THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
    "completedAt"="endedAt", "completedByMembershipId"=CASE WHEN "endedAt" IS NOT NULL THEN "practitionerMembershipId" ELSE NULL END;`);
  add(`UPDATE core."Plan" SET "entitlements"=${literal(JSON.stringify(baseEntitlements))}::jsonb WHERE "entitlements"='{}'::jsonb;`);
  add('UPDATE core."OrganizationPlanAssignment" a SET "entitlementsSnapshot"=p."entitlements" FROM core."Plan" p WHERE p."id"=a."planId";');
  for (const name of ['Organization', 'Branch'])
    add(`UPDATE core.${quote(name)} SET "timezone"='America/La_Paz' WHERE "timezone" IN ('La-Paz','America/La_paz');`);
  for (const table of tables) {
    const old = oldByKey.get(table.key);
    if (!old) continue;
    for (const [name, column] of Object.entries(table.columns))
      if (!old.columns[name] && !column.nullable)
        add(`ALTER TABLE ${qualify(table.namespace, table.name)} ALTER COLUMN ${quote(name)} SET NOT NULL;`);
    for (const name of Object.keys(old.columns).filter(name => !table.columns[name]))
      add(`ALTER TABLE ${qualify(table.namespace, table.name)} DROP COLUMN ${quote(name)};`);
  }
  // All target uniqueness/checks are validated against the preserved data before any commit.
  for (const table of tables) {
    const name = qualify(table.namespace, table.name);
    for (const unique of table.uniques)
      add(`ALTER TABLE ${name} ADD CONSTRAINT ${quote(constraintName(table.name, unique.columns, 'key'))} UNIQUE (${columnsSql(unique.columns)});`);
    for (const check of table.checks ?? [])
      add(`ALTER TABLE ${name} ADD CONSTRAINT ${quote(check.name)} CHECK (${check.expression});`);
    for (const index of table.indexes)
      add(`CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${quote(index.name)} ON ${name} (${index.expression ?? columnsSql(index.columns)})${index.where ? ` WHERE ${index.where}` : ''};`);
  }
  for (const table of tables)
    for (const fk of table.foreignKeys ?? []) {
      if (fk.target.namespaceId !== table.namespace) throw new Error('Cross-schema physical FK is forbidden');
      add(`ALTER TABLE ${qualify(table.namespace, table.name)} ADD CONSTRAINT ${quote(constraintName(table.name, fk.source.columns, 'fkey'))} FOREIGN KEY (${columnsSql(fk.source.columns)}) REFERENCES ${qualify(fk.target.namespaceId, fk.target.tableName)} (${columnsSql(fk.target.columns)})${fk.onDelete ? ` ON DELETE ${fk.onDelete.toUpperCase()}` : ''}${fk.onUpdate ? ` ON UPDATE ${fk.onUpdate.toUpperCase()}` : ''};`);
    }
  return `-- Approved QA test-data reconciliation; see docs/target-schema-migration.md.\nDO $target$\nDECLARE item record;\nBEGIN\n${sql.join('\n')}\nEND;\n$target$;\n`;
}
