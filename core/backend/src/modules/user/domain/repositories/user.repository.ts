import {
  CreateUserWithAccess,
  UserAuthRecord,
  UserWithMembership,
} from '../entities/user.entity.js';

export abstract class UserRepository {
  abstract emailExists(email: string): Promise<boolean>;

  abstract findAuthRecord(email: string): Promise<UserAuthRecord | null>;

  abstract createUserWithMembership(
    data: CreateUserWithAccess,
  ): Promise<UserWithMembership>;
}
