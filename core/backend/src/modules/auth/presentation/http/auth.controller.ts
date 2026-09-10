import { Body, Controller, Post } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-case/login.use-case.js';
import { LoginDto } from '../dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.loginUseCase.execute(body);
  }
}
