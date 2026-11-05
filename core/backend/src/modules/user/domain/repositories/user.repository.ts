import {
  CreateUserWithAccess,
  UserAuthRecord,
  UserWithMembership,
} from '../entities/user.entity.js';
import type {
  OrganizationUserListScope,
  UserListItem,
} from '../entities/user-list-item.js';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { ListUsersQueryDto } from '../../presentation/dto/list-users.query.dto.js';

export abstract class UserRepository {
  abstract listUsers(query?: ListUsersQueryDto): Promise<PaginatedResult<UserListItem>>;
  abstract listUsersByOrganizationScope(
    scope: OrganizationUserListScope,
  ): Promise<UserListItem[]>;
  abstract emailExists(email: string): Promise<boolean>;

  abstract findAuthRecord(email: string): Promise<UserAuthRecord | null>;
  abstract findCurrentSession(
    userId: string,
    membershipId: string,
    organizationId: string,
  ): Promise<UserAuthRecord | null>;

  abstract createUserWithMembership(
    data: CreateUserWithAccess,
  ): Promise<UserWithMembership>;
}
