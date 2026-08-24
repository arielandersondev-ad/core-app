import {
  CreateUserWithAccess,
  UserWithMembership,
} from "../entities/user.entity.js";

export abstract class UserRepository {
  abstract emailExists(email: string): Promise<boolean>;

  abstract createUserWithMembership(
    data: CreateUserWithAccess,
  ): Promise<UserWithMembership>;
}
