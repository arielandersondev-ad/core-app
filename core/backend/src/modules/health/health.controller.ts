import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.healthService.check();
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unavailable',
      });
    }
  }
}