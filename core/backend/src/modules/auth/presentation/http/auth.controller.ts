import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-case/login.use-case.js';
import { TOKEN_AUDIENCES } from '../../application/contracts/token-audience.js';
import { LoginDto } from '../dto/login.dto.js';
import { GetCurrentSessionUseCase } from '../../application/use-case/get-current-session.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentPrincipal } from './decorators/current-principal.decorator.js';
import type { AuthenticatedPrincipal } from '../../application/contracts/authenticated-principal.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentSessionUseCase: GetCurrentSessionUseCase,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return await this.getCurrentSessionUseCase.execute(principal);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.loginUseCase.execute(body, TOKEN_AUDIENCES.core);
  }

  @Post('core/login')
  async loginToCore(@Body() body: LoginDto) {
    return await this.loginUseCase.execute(body, TOKEN_AUDIENCES.core);
  }

  @Post('dentistry/login')
  async loginToDentistry(@Body() body: LoginDto) {
    return await this.loginUseCase.execute(body, TOKEN_AUDIENCES.dentistry);
  }
}
