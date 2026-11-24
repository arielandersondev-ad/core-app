import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DevTokenExchangeGuard } from './dev-token-exchange.guard.js';
import { DevTokenExchangeUseCase } from './dev-token-exchange.use-case.js';

class DevUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

class DevTokenExchangeDto {
  @IsUUID('all')
  userId: string;
}

/** Solo existe en desarrollo y con el secreto de canje configurado (ver `DevAuthModule`). */
@Controller('dev/auth')
@UseGuards(DevTokenExchangeGuard)
export class DevAuthController {
  constructor(private readonly exchange: DevTokenExchangeUseCase) {}

  @Get('users')
  users(@Query() query: DevUsersQueryDto) {
    return this.exchange.listUsers(query.search);
  }

  @Post('dentistry-token')
  @HttpCode(HttpStatus.OK)
  dentistryToken(@Body() body: DevTokenExchangeDto) {
    return this.exchange.exchange(body.userId);
  }
}
