import { Injectable, Logger } from "@nestjs/common";
import { OrganizationRepository } from "../../domain/repositories/organization.repository.js";
import { Organization } from "../../domain/entities/organization.entity.js";

@Injectable()
export class ListOrganizationsUseCase {
  private readonly logger = new Logger(ListOrganizationsUseCase.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(): Promise<Organization[]> {
    this.logger.log("Paso 1/2 - Consultando organizaciones activas");
    const organizations = await this.organizationRepository.findAll();
    this.logger.log(`Paso 2/2 - ${organizations.length} organización(es) encontradas`);

    return organizations;
  }
}
