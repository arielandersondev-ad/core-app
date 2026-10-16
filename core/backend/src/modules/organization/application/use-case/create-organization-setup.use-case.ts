import { ConflictException, Injectable } from '@nestjs/common';
import { RoleCodeAlreadyExistsError } from '../../../role/domain/errors/role-code-already-exists.error.js';
import { normalizeRoleCode } from '../../../role/domain/value-objects/role-code.js';
import type { CreateOrganizationSetup, OrganizationSetup } from '../../domain/entities/organization-setup.entity.js';
import { OrganizationProvisioningRepository } from '../../domain/repositories/organization-provisioning.repository.js';
import type { ReqCreateOrganizationSetupDto } from '../../presentation/dto/organization-setup.dto.js';

@Injectable()
export class CreateOrganizationSetupUseCase {
  constructor(
    private readonly provisioningRepository: OrganizationProvisioningRepository,
  ) {}

  async execute( data: ReqCreateOrganizationSetupDto ): Promise<OrganizationSetup> {
    const command = this.toCommand(data);
    this.ensureUniqueCodes(command);

    try {
      return await this.provisioningRepository.create(command);
    } catch (error) {
      if (error instanceof RoleCodeAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  private toCommand( data: ReqCreateOrganizationSetupDto ): CreateOrganizationSetup {
    return {
      organization: {
        name: data.organization.name,
        legalName: data.organization.legalName,
        taxId: data.organization.taxId,
        email: data.organization.email,
        phone: data.organization.phone,
        website: data.organization.website,
        country: data.organization.country.toUpperCase(),
        timezone: data.organization.timezone,
      },
      roles: data.roles.map((role) => ({
        name: role.name,
        code: normalizeRoleCode(role.code),
        description: role.description,
      })),
      branches: data.branches.map((branch) => ({
        name: branch.name,
        code: branch.code?.trim().toUpperCase(),
        email: branch.email,
        phone: branch.phone,
        addressLine1: branch.addressLine1,
        addressLine2: branch.addressLine2,
        city: branch.city,
        state: branch.state,
        country: branch.country.toUpperCase(),
        postalCode: branch.postalCode,
        latitude: branch.latitude,
        longitude: branch.longitude,
        timezone: branch.timezone,
      })),
    };
  }

  private ensureUniqueCodes(data: CreateOrganizationSetup): void {
    const roleCodes = new Set<string>();
    for (const role of data.roles) {
      if (roleCodes.has(role.code)) {
        throw new ConflictException(
          `El código de rol ${role.code} está repetido en el payload`,
        );
      }
      roleCodes.add(role.code);
    }

    const branchCodes = new Set<string>();
    for (const branch of data.branches) {
      if (!branch.code) {
        continue;
      }
      if (branchCodes.has(branch.code)) {
        throw new ConflictException(
          `El código de sucursal ${branch.code} está repetido en el payload`,
        );
      }
      branchCodes.add(branch.code);
    }
  }
}
