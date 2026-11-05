import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import type { ListUsersQueryDto } from '../../presentation/dto/list-users.query.dto.js';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { UserListItem } from '../../domain/entities/user-list-item.js';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(query?: ListUsersQueryDto): Promise<PaginatedResult<UserListItem>> {
    return this.users.listUsers(query);
  }
}
