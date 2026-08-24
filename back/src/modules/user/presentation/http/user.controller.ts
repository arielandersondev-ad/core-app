import { Controller, Param, Post } from "@nestjs/common";
import { CreateUserUseCase } from "../../application/use-case/creat-user.use-case.js";
import { CreateUserDto } from "../dto/create-user.dto.js";

@Controller('users')

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase
  ){}

  @Post()
  async createUser(
    @Param() data: CreateUserDto
  ){
    return await this.createUserUseCase.execute(data)
  }

}