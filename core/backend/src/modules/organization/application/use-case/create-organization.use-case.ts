import { Injectable, Logger } from "@nestjs/common";
import { OrganizationRepository } from "../../domain/repositories/organization.repository.js";
import {
  CreateOrganizationWithBranches,
  OrganizationWithBranches,
} from "../../domain/repositories/organization.repository.js";
import { CreateOrganizationDto } from "../../presentation/dto/create-organization.dto.js";
import { CreateBranch } from "../../domain/entities/branch.entity.js";

@Injectable()
export class CreateOrganizationUseCase {
  private readonly logger = new Logger(CreateOrganizationUseCase.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(data: CreateOrganizationDto): Promise<OrganizationWithBranches> {
    this.logger.log(`Paso 1/3 - Iniciando registro de organización "${data.name}" (${data.country}, ${data.timezone})`);

    const branches = this.resolveBranches(data);
    const payload: CreateOrganizationWithBranches = {
      organization: {
        name: data.name,
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        website: data.website,
        country: data.country,
        timezone: data.timezone,
      },
      branches,
      branchesAreDefault: !this.hasExplicitBranches(data),
    };

    this.logger.log(
      `Paso 2/3 - Sucursales resueltas: ${branches.length} a insertar` +
        (payload.branchesAreDefault ? " (sucursal por defecto)" : ""),
    );

    this.logger.log("Paso 3/3 - Persistiendo organización y sucursales dentro de una transacción");
    const result = await this.organizationRepository.createOrganization(payload);

    this.logger.log(
      `Registro completado: organizationId=${result.organization.id}, branches=[${result.branches.map((b) => b.id).join(", ")}]`,
    );

    return result;
  }

  private hasExplicitBranches(data: CreateOrganizationDto): boolean {
    return Array.isArray(data.branches) && data.branches.length > 0;
  }

  private resolveBranches(data: CreateOrganizationDto): CreateBranch[] {
    if (!this.hasExplicitBranches(data)) {
      const defaultName = `${data.name} — Casa Matriz`;
      this.logger.warn(`Sin sucursales en el payload: se creará la sucursal por defecto "${defaultName}"`);

      return [
        {
          name: defaultName,
          country: data.country,
          timezone: data.timezone,
        },
      ];
    }

    return data.branches!.map((branch) => ({
      name: branch.name,
      code: branch.code,
      email: branch.email,
      phone: branch.phone,
      addressLine1: branch.addressLine1,
      addressLine2: branch.addressLine2,
      city: branch.city,
      state: branch.state,
      country: branch.country ?? data.country,
      postalCode: branch.postalCode,
      latitude: branch.latitude,
      longitude: branch.longitude,
      timezone: branch.timezone ?? data.timezone,
    }));
  }
}
