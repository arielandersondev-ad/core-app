import { ConflictException, Injectable } from '@nestjs/common';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import type { Role } from '../../domain/entities/role.entity.js';
import type { CreateRoleDto } from '../../presentation/dto/create-role.dto.js';
import { normalizeRoleCode } from '../../domain/value-objects/role-code.js';
import { RoleCodeAlreadyExistsError } from '../../domain/errors/role-code-already-exists.error.js';

@Injectable()
export class CreateRoleUseCase {
  constructor(private readonly roleRepo: RoleRepository) {}
  async execute(data: CreateRoleDto): Promise<Role> {
    const organizationId = data.organizationId ?? null;
    const code = normalizeRoleCode(data.code);

    if (await this.roleRepo.existsByCodeInScope(code, organizationId)) {
      throw new ConflictException(
        `Ya existe un rol con el código ${code} en el alcance indicado`,
      );
    }

    try {
      return await this.roleRepo.create({
        organizationId,
        name: data.name,
        code,
        description: data.description,
      });
    } catch (error) {
      if (error instanceof RoleCodeAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
