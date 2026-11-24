import { Injectable } from '@nestjs/common';
import { pickTimeZone } from '../time/zoned-time.js';
import { PrismaService } from './prisma.service.js';

/**
 * Zona horaria con la que se leen y escriben fechas de calendario: la de la
 * sucursal y, si no tiene una válida, la de la organización (Core, por id).
 */
@Injectable()
export class TimeZoneResolver {
  constructor(private readonly prisma: PrismaService) {}

  async forOrganization(organizationId: string): Promise<string> {
    const organization = await this.prisma.orm.core.Organization.first({
      id: organizationId,
    });
    return pickTimeZone(organization?.timezone);
  }

  async forBranch(organizationId: string, branchId: string): Promise<string> {
    const [branch, organization] = await Promise.all([
      this.prisma.orm.core.Branch.first({ id: branchId, organizationId }),
      this.prisma.orm.core.Organization.first({ id: organizationId }),
    ]);
    return pickTimeZone(branch?.timezone, organization?.timezone);
  }

  /** Zona de cada sucursal de la organización (con la de la organización como respaldo). */
  async forBranches(
    organizationId: string,
    branchIds: readonly string[],
  ): Promise<{ organization: string; branches: Map<string, string> }> {
    const ids = [...new Set(branchIds)];
    const [organization, rows] = await Promise.all([
      this.prisma.orm.core.Organization.first({ id: organizationId }),
      ids.length
        ? this.prisma.orm.core.Branch.where({ organizationId })
            .where((branch) => branch.id.in(ids))
            .all()
        : null,
    ]);
    const organizationZone = pickTimeZone(organization?.timezone);
    const branches = new Map<string, string>();
    for (const id of ids) {
      const row = rows?.find((candidate) => candidate.id === id);
      branches.set(id, pickTimeZone(row?.timezone, organizationZone));
    }
    return { organization: organizationZone, branches };
  }

  /** Zona de la sucursal de una atención clínica. */
  async forEncounter(organizationId: string, encounterId: string): Promise<string> {
    const encounter = await this.prisma.orm.dentistry.ClinicalEncounter.first({
      id: encounterId,
      organizationId,
    });
    return encounter
      ? this.forBranch(organizationId, encounter.branchId)
      : this.forOrganization(organizationId);
  }
}
