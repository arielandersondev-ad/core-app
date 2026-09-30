import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleRepository } from '../../domain/repositories/role.repository.js';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';

@Injectable()
export class ReplaceRolePermissionsUseCase {
  constructor(private readonly roles: RoleRepository) {}

  execute(roleId: string, permissionIds: string[]) {
    if (!UUID_PATTERN.test(roleId)) {
      throw new BadRequestException('roleId debe ser un UUID válido');
    }
    const uniqueIds = [...new Set(permissionIds)].sort();
    return this.roles.replacePermissions(roleId, uniqueIds);
  }
}
