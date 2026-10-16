import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/infrastructure/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<void> {
    await this.prisma.ping(AbortSignal.timeout(3000));
  }
}