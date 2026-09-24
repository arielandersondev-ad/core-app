import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ReqCreateOrganizationSetupDto } from "../dist/modules/organization/presentation/dto/organization-setup.dto.js";

const validPayload = {
  organization: {
    name: "Clínica Central",
    country: "bo",
    timezone: "America/La_Paz",
  },
  roles: [{ name: "Administrador", code: "admin" }],
  branches: [
    {
      name: "Sucursal Central",
      code: "CENTRAL",
      city: "La Paz",
      country: "bo",
      latitude: "-16.4897",
      longitude: "-68.1193",
      timezone: "America/La_Paz",
    },
  ],
};

test("transforma y valida el payload enviado por el frontend", async () => {
  const dto = plainToInstance(ReqCreateOrganizationSetupDto, validPayload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  assert.deepEqual(errors, []);
  assert.equal(dto.organization.country, "BO");
  assert.equal(dto.roles[0].code, "ADMIN");
  assert.equal(dto.branches[0].country, "BO");
  assert.equal(dto.branches[0].latitude, -16.4897);
});

test("rechaza un payload sin organización", async () => {
  const dto = plainToInstance(ReqCreateOrganizationSetupDto, {
    roles: validPayload.roles,
    branches: validPayload.branches,
  });
  const errors = await validate(dto);

  assert.equal(errors.some(({ property }) => property === "organization"), true);
});

test("no convierte una coordenada vacía en cero", async () => {
  const dto = plainToInstance(ReqCreateOrganizationSetupDto, {
    ...validPayload,
    branches: [
      {
        ...validPayload.branches[0],
        latitude: "",
      },
    ],
  });
  const errors = await validate(dto);

  assert.deepEqual(errors, []);
  assert.equal(dto.branches[0].latitude, undefined);
});
