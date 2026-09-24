import assert from "node:assert/strict";
import test from "node:test";
import { ConflictException } from "@nestjs/common";
import { CreateOrganizationSetupUseCase } from "../dist/modules/organization/application/use-case/create-organization-setup.use-case.js";

const request = {
  organization: {
    name: "Clínica Central",
    legalName: "Clínica Central SRL",
    taxId: "123456",
    email: "contacto@clinica.test",
    phone: "+59170000000",
    country: "bo",
    timezone: "America/La_Paz",
  },
  roles: [
    {
      name: "Administrador",
      code: " admin ",
      description: "Administra la organización",
    },
  ],
  branches: [
    {
      name: "Sucursal Central",
      code: " central ",
      city: "La Paz",
      country: "bo",
      timezone: "America/La_Paz",
    },
  ],
};

test("normaliza el comando y delega una sola operación atómica", async () => {
  let received;
  const expected = { organization: { id: "org-1" }, roles: [], branches: [] };
  const repository = {
    async create(command) {
      received = command;
      return expected;
    },
  };

  const useCase = new CreateOrganizationSetupUseCase(repository);
  const result = await useCase.execute(request);

  assert.equal(result, expected);
  assert.equal(received.organization.country, "BO");
  assert.equal(received.roles[0].code, "ADMIN");
  assert.equal(received.branches[0].code, "CENTRAL");
  assert.equal("organizationId" in received.roles[0], false);
  assert.equal("organizationId" in received.branches[0], false);
});

test("rechaza códigos de rol duplicados antes de persistir", async () => {
  let calls = 0;
  const repository = {
    async create() {
      calls += 1;
    },
  };
  const useCase = new CreateOrganizationSetupUseCase(repository);

  await assert.rejects(
    () =>
      useCase.execute({
        ...request,
        roles: [
          { name: "Administrador", code: "admin" },
          { name: "Administrador 2", code: " ADMIN " },
        ],
      }),
    ConflictException,
  );
  assert.equal(calls, 0);
});

test("rechaza códigos de sucursal duplicados antes de persistir", async () => {
  let calls = 0;
  const repository = {
    async create() {
      calls += 1;
    },
  };
  const useCase = new CreateOrganizationSetupUseCase(repository);

  await assert.rejects(
    () =>
      useCase.execute({
        ...request,
        branches: [
          { ...request.branches[0], code: "central" },
          { ...request.branches[0], code: " CENTRAL " },
        ],
      }),
    ConflictException,
  );
  assert.equal(calls, 0);
});
