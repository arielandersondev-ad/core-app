import {
  CreateUserWithAccess,
  UserAuthRecord,
  UserWithMembership,
} from '../entities/user.entity.js';
import type {
  OrganizationUserListScope,
  UserListItem,
} from '../entities/user-list-item.js';

export abstract class UserRepository {
  abstract listUsers(): Promise<UserListItem[]>;
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
