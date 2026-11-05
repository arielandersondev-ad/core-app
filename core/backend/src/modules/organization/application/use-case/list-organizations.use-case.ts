import { Injectable, Logger } from "@nestjs/common";
import { OrganizationRepository } from "../../domain/repositories/organization.repository.js";
import type { Organization } from "../../domain/entities/organization.entity.js";
import type { PaginatedResult } from "../../../../common/pagination/pagination.js";
import type { ListOrganizationsQueryDto } from "../../presentation/dto/list-organizations.query.dto.js";

@Injectable()
export class ListOrganizationsUseCase {
  private readonly logger = new Logger(ListOrganizationsUseCase.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    query?: ListOrganizationsQueryDto,
  ): Promise<PaginatedResult<Organization>> {
    this.logger.log("Consultando organizaciones con paginación");
    return this.organizationRepository.listOrganizations(query);
  }
}
