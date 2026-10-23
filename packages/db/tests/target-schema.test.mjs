import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = relative => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'));
const contract = read('../src/prisma/generated/contract.json');
const baseline = read('../migrations/snapshots/826ded8772e9b65bde90c34fca480644ba91128c6488fb4760219a138a807945/contract.json');
const tables = Object.fromEntries(Object.entries(contract.storage.namespaces).flatMap(([ns, value]) => Object.entries(value.entries.table).map(([name, table]) => [name, { ns, ...table }])));
const expected = {
  core: ['User', 'UserCredential', 'AuthSession', 'Organization', 'Branch', 'OrganizationMembership', 'OrganizationMembershipBranch', 'Role', 'Permission', 'RolePermission', 'OrganizationMembershipRole', 'Plan', 'OrganizationPlanAssignment', 'OrganizationFeatureTrial', 'AuditLog'],
  dentistry: ['Patient', 'PatientHealthProfile', 'PatientPractitionerAssignment', 'PatientBranchAssignment', 'BranchSchedulingPolicy', 'Appointment', 'ClinicalEncounter', 'DentalService', 'DentalServiceSupply', 'AppointmentService', 'Treatment', 'Payment', 'ClinicalFile', 'Radiograph'],
};

test('the target has exactly the 29 canonical tables, with no aliases or duplicate roots', () => {
  for (const [ns, names] of Object.entries(expected)) {
    assert.deepEqual(Object.keys(contract.storage.namespaces[ns].entries.table).sort(), [...names].sort());
    assert.deepEqual(Object.keys(contract.domain.namespaces[ns].models).sort(), [...names].sort());
  }
  assert.equal(Object.keys(contract.roots).length, 29);
  for (const [name, table] of Object.entries(tables)) {
    assert.match(name, /^[A-Z][A-Za-z]+$/);
    for (const column of Object.keys(table.columns)) assert.match(column, /^[a-z][A-Za-z0-9]*$/);
  }
});

test('every documented target column exists exactly once and no undocumented column was added', () => {
  const markdown = fs.readFileSync(new URL('../docs/target-schema-dictionary.md', import.meta.url), 'utf8');
  const documented = new Map();
  let model;
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith('## ')) model = undefined;
    const heading = line.match(/^### [345]\.\d+ (\w+)$/);
    if (heading) {
      model = tables[heading[1]] ? heading[1] : undefined;
      if (model) documented.set(model, new Set());
    }
    if (!model) continue;
    if (line.startsWith('Campos comunes:')) {
      for (const match of line.split(';')[0].matchAll(/`([^`]+)`/g)) documented.get(model).add(match[1]);
    }
    if (line.startsWith('| `') && !line.includes('M — retirar')) {
      const cell = line.split('|')[1];
      for (const match of cell.matchAll(/`([^`]+)`/g)) documented.get(model).add(match[1].split('→').at(-1).trim());
    }
  }
  assert.equal(documented.size, 29);
  for (const [name, columns] of documented) assert.deepEqual(Object.keys(tables[name].columns).sort(), [...columns].sort(), name);
});

test('only the 14 documented legacy columns are retired; all existing tables remain', () => {
  const retired = [];
  for (const [ns, namespace] of Object.entries(baseline.storage.namespaces)) {
    for (const [name, table] of Object.entries(namespace.entries.table)) {
      assert.ok(tables[name], `Missing ${ns}.${name}`);
      for (const field of Object.keys(table.columns)) if (!tables[name].columns[field]) retired.push(`${name}.${field}`);
    }
  }
  assert.equal(retired.length, 14);
  assert.equal(retired.filter(name => name.endsWith('.deleted')).length, 11);
  assert.deepEqual(retired.filter(name => !name.endsWith('.deleted')).sort(), ['Appointment.serviceId', 'DentalServiceSupply.inventoryItemId', 'Radiograph.takenAt']);
  assert.ok(tables.AppointmentService.columns.serviceId);
  assert.ok(tables.ClinicalFile.columns.capturedAt);
  assert.ok(tables.AppointmentService.uniques.length || tables.AppointmentService.indexes.some(i => i.unique && i.columns.join(',') === 'appointmentId,serviceId'));
});

test('UUIDs and instants use native types, while birthDate is a civil date', () => {
  for (const [name, table] of Object.entries(tables)) {
    assert.equal(table.columns.id.nativeType, 'uuid', name);
    for (const [field, column] of Object.entries(table.columns)) {
      if (field.endsWith('Id') && field !== 'resourceId' && field !== 'taxId') assert.equal(column.nativeType, 'uuid', `${name}.${field}`);
      if (field.endsWith('At')) assert.equal(column.nativeType, 'timestamptz', `${name}.${field}`);
    }
  }
  assert.equal(tables.Patient.columns.birthDate.nativeType, 'date');
  assert.equal(tables.Treatment.columns.startedAt.nullable, true);
});

test('all physical FKs stay within their schema and clinical references enforce tenant and patient', () => {
  for (const [name, table] of Object.entries(tables)) for (const fk of table.foreignKeys ?? []) {
    assert.equal(fk.source.namespaceId, fk.target.namespaceId, name);
    assert.ok(fk.onDelete === undefined || ['restrict', 'noAction'].includes(fk.onDelete), `${name} must preserve historical rows`);
    const target = tables[fk.target.tableName];
    assert.ok(target);
    assert.equal(fk.source.columns.length, fk.target.columns.length);
    fk.source.columns.forEach((column, i) => assert.equal(table.columns[column].nativeType, target.columns[fk.target.columns[i]].nativeType));
    const keys = [target.primaryKey, ...target.uniques, ...target.indexes.filter(i => i.unique && !i.where)];
    assert.ok(keys.some(key => key.columns.join(',') === fk.target.columns.join(',')), `${name} target is not unique`);
    if (table.ns === 'dentistry') {
      assert.equal(fk.source.columns[0], 'organizationId', name);
      if (['Appointment', 'Treatment', 'ClinicalEncounter'].includes(fk.target.tableName) && ['Payment', 'ClinicalFile', 'ClinicalEncounter', 'Appointment'].includes(name)) assert.ok(fk.source.columns.includes('patientId'), name);
    }
  }
});

test('assignment and trial uniqueness prevent duplicate active grants and repeated offers', () => {
  const clinical = tables.PatientPractitionerAssignment.indexes.find(i => i.unique && i.where === '"revokedAt" IS NULL');
  assert.deepEqual(clinical.columns, ['organizationId', 'patientId', 'practitionerMembershipId']);
  assert.ok(tables.PatientBranchAssignment.indexes.some(i => i.unique && i.columns.join(',') === 'organizationId,patientId,branchId'));
  assert.ok(tables.OrganizationFeatureTrial.indexes.some(i => i.unique && i.columns.join(',') === 'organizationId,vertical,trialCode'));
  assert.ok(tables.BranchSchedulingPolicy.uniques.some(i => i.columns.join(',') === 'branchId'));
  assert.ok(!tables.Patient.columns.branchId && !tables.Patient.columns.practitionerMembershipId);
});

test('new historical facts and commercial snapshots require explicit data, without fabricated defaults', () => {
  for (const [name, field] of [['ClinicalEncounter', 'status'], ['ClinicalFile', 'uploadStatus'], ['OrganizationPlanAssignment', 'entitlementsSnapshot']]) {
    assert.equal(tables[name].columns[field].nullable, false);
    assert.equal(tables[name].columns[field].default, undefined);
  }
  for (const name of ['PatientHealthProfile', 'Appointment', 'ClinicalEncounter', 'BranchSchedulingPolicy']) assert.deepEqual(tables[name].columns.rowVersion.default, { kind: 'literal', value: 1 });
  const revocation = tables.PatientPractitionerAssignment.checks.find(c => c.prefix === 'patient_assignment_revocation');
  assert.ok(revocation.expression.includes('"revokedAt" IS NOT NULL'), 'CHECK must reject a revoker without a revokedAt, rather than accepting SQL UNKNOWN');
  assert.ok(tables.OrganizationFeatureTrial.checks.some(c => c.expression.includes("interval '336 hours'")));
});

test('the authored schema has no repeated physical index or constraint definitions', () => {
  for (const [name, table] of Object.entries(tables)) {
    const indexes = table.indexes.map(({ name: ignored, prefix, ...shape }) => JSON.stringify(shape));
    assert.equal(new Set(indexes).size, indexes.length, `${name} has duplicate indexes`);
    const constraints = [...(table.checks ?? []), ...table.indexes].map(item => item.name);
    assert.equal(new Set(constraints).size, constraints.length, `${name} repeats SQL object names`);
  }
});
