import { Injectable } from '@nestjs/common';
import type { OrganizationUserListScope } from '../../domain/entities/user-list-item.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';

@Injectable()
export class ListOrganizationUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(scope: OrganizationUserListScope) {
    return this.users.listUsersByOrganizationScope(scope);
  }
}
