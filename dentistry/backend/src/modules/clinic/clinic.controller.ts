import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../common/infrastructure/prisma-uuid.js';

export interface ProfessionalDto {
  id: string; // membershipId
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#0284c7', // Sky
  '#16a34a', // Emerald
  '#d97706', // Amber
  '#9333ea', // Purple
  '#e11d48', // Rose
  '#0d9488', // Teal
];

@Controller('clinic')
export class ClinicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('professionals')
  async listProfessionals(
    @Query('organizationId') organizationId: string,
  ): Promise<ProfessionalDto[]> {
    if (!organizationId) return [];

    const memberships = (await this.prisma.orm.core.Membership.where({
      organizationId: toUuid36(organizationId),
      deleted: false,
    }).all()) as any[];

    if (!memberships || memberships.length === 0) return [];

    const userIds = memberships.map((m) => toUuid36(m.userId));
    const users = (await this.prisma.orm.core.User.where({
      deleted: false,
    }).all()) as any[];

    const userMap = new Map<string, any>();
    for (const u of users) {
      userMap.set(u.id, u);
    }

    return memberships.map((m, index) => {
      const user = userMap.get(m.userId);
      const name = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : 'Profesional';
      const email = user?.email ?? '';
      const phone = user?.phone ?? null;
      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      return {
        id: m.id,
        userId: m.userId,
        name,
        email,
        phone,
        specialty: 'Odontología General',
        color,
      };
    });
  }
}
