import { ConflictException, Injectable } from '@nestjs/common';
import { PermissionRepository } from '../../domain/repositories/permission.repository.js';
import type { Permission } from '../../domain/entities/permission.entity.js';
import type { CreatePermissionDto } from '../../presentation/dto/create-permission.dto.js';

@Injectable()
export class CreatePermissionUseCase {
  constructor(private readonly permissions: PermissionRepository) {}

  async execute(data: CreatePermissionDto): Promise<Permission> {
    if (await this.permissions.findByCode(data.code)) {
      throw new ConflictException(`Ya existe el permiso ${data.code}`);
    }
    try {
      return await this.permissions.create({
        code: data.code,
        name: data.name,
        description: data.description ?? null,
      });
    } catch (error) {
      if (await this.permissions.findByCode(data.code)) {
        throw new ConflictException(`Ya existe el permiso ${data.code}`);
      }
      throw error;
    }
  }
}
