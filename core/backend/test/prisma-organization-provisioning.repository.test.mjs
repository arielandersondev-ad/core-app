import assert from "node:assert/strict";
import test from "node:test";
import { PrismaOrganizationProvisioningRepository } from "../dist/modules/organization/infrastructure/prisma-organization-provisioning.repository.js";

const command = {
  organization: {
    name: "Clínica Central",
    country: "BO",
    timezone: "America/La_Paz",
  },
  roles: [{ name: "Administrador", code: "ADMIN" }],
  branches: [
    {
      name: "Sucursal Central",
      code: "CENTRAL",
      country: "BO",
      timezone: "America/La_Paz",
    },
  ],
};

function createFixture({ failBranch = false } = {}) {
  const calls = [];
  const tx = {
    orm: {
      core: {
        AuditLog: {
          async create(entry) {
            calls.push({ type: "audit", tx, entry });
          },
        },
      },
    },
  };
  const prisma = {
    async transaction(work) {
      calls.push({ type: "transaction" });
      return work(tx);
    },
  };
  const organizationWriter = {
    async createInTransaction(receivedTx, data) {
      calls.push({ type: "organization", tx: receivedTx, data });
      return { id: "org-1", ...data };
    },
  };
  const roleWriter = {
    async createInTransaction(receivedTx, data) {
      calls.push({ type: "role", tx: receivedTx, data });
      return { id: "role-1", ...data };
    },
  };
  const branchWriter = {
    async createInTransaction(receivedTx, data) {
      calls.push({ type: "branch", tx: receivedTx, data });
      if (failBranch) {
        throw new Error("branch failed");
      }
      return { id: "branch-1", ...data };
    },
  };

  return {
    calls,
    tx,
    repository: new PrismaOrganizationProvisioningRepository(
      prisma,
      organizationWriter,
      roleWriter,
      branchWriter,
    ),
  };
}

test("usa el mismo contexto para organización, roles, sucursales y auditoría", async () => {
  const { calls, tx, repository } = createFixture();
  const result = await repository.create(command);

  assert.equal(result.organization.id, "org-1");
  assert.equal(result.roles[0].organizationId, "org-1");
  assert.equal(result.branches[0].organizationId, "org-1");
  assert.deepEqual(
    calls.map(({ type }) => type),
    ["transaction", "organization", "role", "branch", "audit"],
  );
  for (const call of calls.filter(({ tx: receivedTx }) => receivedTx)) {
    assert.equal(call.tx, tx);
  }
});

test("propaga un fallo antes de auditoría para que la transacción haga rollback", async () => {
  const { calls, repository } = createFixture({ failBranch: true });

  await assert.rejects(() => repository.create(command), /branch failed/);
  assert.equal(calls.some(({ type }) => type === "audit"), false);
});
