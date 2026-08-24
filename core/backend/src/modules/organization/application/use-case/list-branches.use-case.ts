import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BranchRepository } from "../../domain/repositories/branch.repository.js";
import { OrganizationRepository } from "../../domain/repositories/organization.repository.js";
import { Branch } from "../../domain/entities/branch.entity.js";

@Injectable()
export class ListBranchesByOrganizationUseCase {
  private readonly logger = new Logger(ListBranchesByOrganizationUseCase.name);

  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(organizationId: string): Promise<Branch[]> {
    this.logger.log(`Paso 1/3 - Validando existencia de la organización ${organizationId}`);
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      this.logger.warn(`Organización ${organizationId} no encontrada`);
      throw new NotFoundException(`La organización ${organizationId} no existe`);
    }

    this.logger.log(`Paso 2/3 - Consultando sucursales de "${organization.name}"`);
    const branches = await this.branchRepository.listByOrganization(organizationId);

    this.logger.log(`Paso 3/3 - ${branches.length} sucursal(es) encontradas`);
    return branches;
  }
}
