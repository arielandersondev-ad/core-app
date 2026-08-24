import { Body, Controller, Post } from "@nestjs/common";
import { PrismaOrganizationUseCase } from "../../application/use-case/create-organization.use-case.js";
import { CreateOrganizationDto } from "../dto/create-organization.dto.js";

@Controller('organizations')
//@UseGuards(JwtAuthGuard) PARA UNA FUTURA IMPLEMENTACION DE AUTENTICACION
export class OrganizationController {
    constructor(
        private readonly createOrganizationUseCase: PrismaOrganizationUseCase
    ) {}

    @Post()
    async createOrganization(
        @Body() data: CreateOrganizationDto
    ) {
        return await this.createOrganizationUseCase.execute(data)
    }
}