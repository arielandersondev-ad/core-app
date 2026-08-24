import { Body, Controller, Post } from "@nestjs/common";
import { CreateUserUseCase } from "../../application/use-case/create-user.use-case.js";
import { CreateUserDto } from "../dto/create-user.dto.js";

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase
  ){}

  @Post()
  async createUser(
    @Body() data: CreateUserDto
  ){
    return await this.createUserUseCase.execute(data)
  }
}
