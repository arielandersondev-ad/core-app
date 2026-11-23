import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequireModule } from '../../../auth/presentation/http/decorators/require-module.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryModuleGuard } from '../../../auth/presentation/http/guards/dentistry-module.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { FileStorage } from '../../application/ports/file-storage.js';
import {
  GetClinicalFileQuotaUseCase,
  type ClinicalFileQuotaView,
} from '../../application/use-case/get-clinical-file-quota.use-case.js';

/** Uso y límites de archivos de la organización, para mostrar antes de subir. */
@Controller('clinical-files')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard, DentistryModuleGuard)
@RequireModule('patients')
export class ClinicalFileQuotaController {
  constructor(
    private readonly quotaUseCase: GetClinicalFileQuotaUseCase,
    private readonly storage: FileStorage,
  ) {}

  @Get('quota')
  @RequirePermission('dentistry:files:read')
  quota(@CurrentPrincipal() principal: DentistryPrincipal): Promise<ClinicalFileQuotaView> {
    return this.quotaUseCase.execute(principal.organizationId, this.storage.available);
  }
}
