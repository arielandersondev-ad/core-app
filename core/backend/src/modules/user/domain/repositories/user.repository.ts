import {
  CreateUserWithAccess,
  FailedLoginPolicy,
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
  abstract findAuthRecordByUserId(userId: string): Promise<UserAuthRecord | null>;
  abstract registerFailedLogin(userId: string, policy: FailedLoginPolicy): Promise<void>;
  abstract clearFailedLogins(userId: string): Promise<void>;
  abstract findCurrentSession(
    userId: string,
    membershipId: string,
    organizationId: string,
  ): Promise<UserAuthRecord | null>;

  abstract createUserWithMembership(
    data: CreateUserWithAccess,
  ): Promise<UserWithMembership>;
}
