import test from "node:test";
import { NestFactory } from "@nestjs/core";
import { PrismaModule } from "../dist/common/infrastructure/prisma.module.js";
import { OrganizationModule } from "../dist/modules/organization/organization.module.js";
import { Module } from "@nestjs/common";

class TestAppModule {}
Module({ imports: [PrismaModule, OrganizationModule] })(TestAppModule);

test("resuelve el grafo de dependencias del módulo de organización", async () => {
  const app = await NestFactory.createApplicationContext(TestAppModule, {
    logger: false,
  });

  await app.close();
});
