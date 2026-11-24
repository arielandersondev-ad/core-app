import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import {
  SessionProfileReader,
  type SessionProfile,
} from '../application/ports/session-profile.reader.js';

/** Solo lectura de Core: usuario y organización del token (sin FK cruzadas). */
@Injectable()
export class PrismaSessionProfileReader extends SessionProfileReader {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async read(userId: string, organizationId: string): Promise<SessionProfile> {
    const [user, organization] = await Promise.all([
      this.prisma.orm.core.User.first({ id: userId }),
      this.prisma.orm.core.Organization.first({ id: organizationId }),
    ]);
    return {
      user: user ? { firstName: user.firstName, lastName: user.lastName } : null,
      organizationName: organization?.name ?? null,
    };
  }
}
