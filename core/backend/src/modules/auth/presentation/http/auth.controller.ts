import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Ip, Post, UseGuards } from '@nestjs/common';
import { LoginUseCase, type LoginClientContext } from '../../application/use-case/login.use-case.js';
import { RefreshSessionUseCase } from '../../application/use-case/refresh-session.use-case.js';
import { LogoutUseCase } from '../../application/use-case/logout.use-case.js';
import { TOKEN_AUDIENCES } from '../../application/contracts/token-audience.js';
import { LoginDto } from '../dto/login.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { GetCurrentSessionUseCase } from '../../application/use-case/get-current-session.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentPrincipal } from './decorators/current-principal.decorator.js';
import type { AuthenticatedPrincipal } from '../../application/contracts/authenticated-principal.js';

const MAX_USER_AGENT_LENGTH = 512;

function clientContext(ip: string | undefined, userAgent: string | undefined): LoginClientContext {
  return {
    ipAddress: ip?.trim() ? ip.trim().slice(0, 64) : null,
    userAgent: userAgent?.trim() ? userAgent.trim().slice(0, MAX_USER_AGENT_LENGTH) : null,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentSessionUseCase: GetCurrentSessionUseCase,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return await this.getCurrentSessionUseCase.execute(principal);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return await this.loginUseCase.execute(body, TOKEN_AUDIENCES.core, clientContext(ip, userAgent));
  }

  @Post('core/login')
  async loginToCore(@Body() body: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return await this.loginUseCase.execute(body, TOKEN_AUDIENCES.core, clientContext(ip, userAgent));
  }

  @Post('dentistry/login')
  async loginToDentistry(@Body() body: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return await this.loginUseCase.execute(body, TOKEN_AUDIENCES.dentistry, clientContext(ip, userAgent));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto) {
    return await this.refreshSessionUseCase.execute(body.refresh_token, TOKEN_AUDIENCES.core);
  }

  @Post('dentistry/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshDentistry(@Body() body: RefreshTokenDto) {
    return await this.refreshSessionUseCase.execute(body.refresh_token, TOKEN_AUDIENCES.dentistry);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: RefreshTokenDto): Promise<void> {
    await this.logoutUseCase.execute(body.refresh_token);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentPrincipal() principal: AuthenticatedPrincipal): Promise<void> {
    await this.logoutUseCase.executeForUser(principal.sub);
  }
}
