import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CreateUserUseCase } from "../../application/use-case/create-user.use-case.js";
import { CreateUserDto } from "../dto/create-user.dto.js";
import { ListUsersUseCase } from '../../application/use-case/list-users.use-case.js';
import { RequireCoreAccess } from "../../../auth/presentation/http/decorators/require-core-access.decorator.js";
import { JwtAuthGuard } from '../../../auth/presentation/http/guards/jwt-auth.guard.js';
import { CoreAccessGuard } from '../../../auth/presentation/http/guards/core-access.guard.js';

@Controller('users')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ){}

  @Get()
  @RequireCoreAccess('users:read')
  listUsers() {
    return this.listUsersUseCase.execute();
  }

  @Post()
  @RequireCoreAccess('users:create')
  async createUser(@Body() data: CreateUserDto) {
    return this.createUserUseCase.execute(data);
  }
}
