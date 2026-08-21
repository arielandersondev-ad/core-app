import { Injectable } from "@nestjs/common";
import { OrganizationRepository } from "../../domain/repositories/organization.repository.js";
import { CreateOrganizationDto } from "../../presentation/dto/create-organization.dto.js";
import { Organization } from "../../domain/entities/organization.entity.js";

@Injectable()
export class PrismaOrganizationUseCase {
    constructor(
        private readonly OrgRepo: OrganizationRepository
    ) {}

    execute(data: CreateOrganizationDto): Promise<Organization> {
        return this.OrgRepo.createOrganization(data);
    }
}