import { Injectable, Logger } from "@nestjs/common";
import { RoleRepository } from "../../domain/repositories/role.repository.js";
import { Role } from "../../domain/entities/role.entity.js";

@Injectable()
export class ListRolesByOrganizationScopeUseCase {
  private readonly logger = new Logger(ListRolesByOrganizationScopeUseCase.name);

  constructor(
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(organizationId: string): Promise<Role[]> {
    this.logger.log(`Paso 1/2 - Consultando roles disponibles para la organización ${organizationId}`);
    const roles = await this.roleRepository.listByOrganizationScope(organizationId);

    this.logger.log(`Paso 2/2 - ${roles.length} rol(es) encontrados (globales + propios de la organización)`);
    return roles;
  }
}
