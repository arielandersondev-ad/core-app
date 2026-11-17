import test from 'node:test';
import assert from 'node:assert/strict';
import { DEV_PERSONAS } from '../src/features/dev-auth/types/personas.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERMISSION_REGEX = /^dentistry:[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+$/;

test('Dev Personas: verifica que todos los IDs y permisos cumplan estrictamente el contrato de seguridad', () => {
  const personas = Object.values(DEV_PERSONAS);
  assert.equal(personas.length, 3);

  for (const persona of personas) {
    // 1. UUIDs válidos (RFC 4122 / UUIDv7 / UUIDv4 compatible con DentistryTokenVerifier)
    assert.match(persona.sub, UUID_REGEX, `sub inválido para ${persona.id}`);
    assert.match(persona.membershipId, UUID_REGEX, `membershipId inválido para ${persona.id}`);
    assert.match(persona.organizationId, UUID_REGEX, `organizationId inválido para ${persona.id}`);
    assert.ok(persona.branchIds.length > 0, `branchIds vacío para ${persona.id}`);
    for (const bId of persona.branchIds) {
      assert.match(bId, UUID_REGEX, `branchId inválido para ${persona.id}`);
    }

    // 2. Permisos conformes al patrón de Dentistry
    assert.ok(persona.permissions.length > 0, `permissions vacío para ${persona.id}`);
    for (const perm of persona.permissions) {
      assert.match(perm, PERMISSION_REGEX, `permiso con formato inválido '${perm}' en ${persona.id}`);
    }

    // 3. Metadata y títulos legibles
    assert.ok(persona.name.length > 0);
    assert.ok(persona.roleTitle.length > 0);
    assert.ok(persona.badgeLabel.length > 0);
    assert.ok(persona.avatarIcon.length > 0);
  }
});
