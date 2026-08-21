import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { CreateOrganization, Organization } from "../domain/entities/organization.entity.js";

@Injectable()
export class PrismaOrganizationRepository {
    constructor(private prisma: PrismaService) {}

    async createOrganization(data: CreateOrganization): Promise<Organization> {
        const row = await this.prisma.orm.public.Organization.create(data);

        return {
            id: row.id,
            name: row.name,
            legalName: row.legalName,
            taxId: row.taxId,
            email: row.email,
            phone: row.phone,
            website: row.website,
            country: row.country,
            timezone: row.timezone,
            status: row.status,
            deleted: row.deleted,
            deletedAt: row.deletedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}