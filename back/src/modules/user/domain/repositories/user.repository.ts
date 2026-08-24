import { CreateUser, User } from "../entities/user.entity.js";

export abstract class UserRepository {
  abstract createUser(data: CreateUser): Promise<User>;
}