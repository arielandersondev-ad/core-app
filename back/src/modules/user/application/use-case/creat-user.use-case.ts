import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/repositories/user.repository.js";
import { User } from "../../domain/entities/user.entity.js";

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository
  ){}
  execute (data: any): Promise<User> {
    return this.userRepo.createUser(data)
  }
}