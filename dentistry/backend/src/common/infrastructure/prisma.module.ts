import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { TimeZoneResolver } from './time-zone.resolver.js';

@Global()
@Module({
  providers: [PrismaService, TimeZoneResolver],
  exports: [PrismaService, TimeZoneResolver],
})
export class PrismaModule {}
