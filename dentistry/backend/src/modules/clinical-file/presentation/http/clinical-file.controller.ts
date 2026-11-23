import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { DentistryPrincipal } from '../../../auth/application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from '../../../auth/presentation/http/decorators/current-principal.decorator.js';
import { RequireModule } from '../../../auth/presentation/http/decorators/require-module.decorator.js';
import { RequirePermission } from '../../../auth/presentation/http/decorators/require-permission.decorator.js';
import { DentistryJwtGuard } from '../../../auth/presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryModuleGuard } from '../../../auth/presentation/http/guards/dentistry-module.guard.js';
import { DentistryPermissionGuard } from '../../../auth/presentation/http/guards/dentistry-permission.guard.js';
import { CompleteClinicalFileUploadUseCase } from '../../application/use-case/complete-clinical-file-upload.use-case.js';
import { DeleteClinicalFileUseCase } from '../../application/use-case/delete-clinical-file.use-case.js';
import { GetClinicalFileAccessUrlUseCase } from '../../application/use-case/get-clinical-file-access-url.use-case.js';
import { ListClinicalFilesUseCase } from '../../application/use-case/list-clinical-files.use-case.js';
import { RequestClinicalFileUploadUseCase } from '../../application/use-case/request-clinical-file-upload.use-case.js';
import { UpdateClinicalFileUseCase } from '../../application/use-case/update-clinical-file.use-case.js';
import {
  ClinicalFileAccessUrlQueryDto,
  ListClinicalFilesQueryDto,
  RequestClinicalFileUploadDto,
  UpdateClinicalFileDto,
} from '../dto/clinical-file.dto.js';
import {
  ClinicalFileResponseDto,
  ClinicalFileUploadResponseDto,
  PresignedRequestResponseDto,
} from '../dto/clinical-file.response.dto.js';

type ClinicalFilePage = {
  items: ClinicalFileResponseDto[];
  pagination: PaginatedResult<unknown>['pagination'];
};

/**
 * Archivos del historial clínico. Leer exige el módulo Paciente; subir, editar
 * y retirar exigen además la función `files` del plan, de modo que un plan
 * vencido o reducido conserva la consulta de lo existente (§7.4).
 */
@Controller('patients/:patientId/clinical-files')
@UseGuards(DentistryJwtGuard, DentistryPermissionGuard, DentistryModuleGuard)
@RequireModule('patients')
export class ClinicalFileController {
  constructor(
    private readonly listUseCase: ListClinicalFilesUseCase,
    private readonly requestUploadUseCase: RequestClinicalFileUploadUseCase,
    private readonly completeUploadUseCase: CompleteClinicalFileUploadUseCase,
    private readonly accessUrlUseCase: GetClinicalFileAccessUrlUseCase,
    private readonly deleteUseCase: DeleteClinicalFileUseCase,
    private readonly updateUseCase: UpdateClinicalFileUseCase,
  ) {}

  @Get()
  @RequirePermission('dentistry:files:read')
  async list(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: ListClinicalFilesQueryDto,
  ): Promise<ClinicalFilePage> {
    const result = await this.listUseCase.execute(
      {
        organizationId: principal.organizationId,
        patientId,
        clinicalEncounterId: query.clinicalEncounterId,
        category: query.category,
        page: query.page,
        pageSize: query.pageSize,
      },
      principal.branchIds,
    );
    return {
      items: result.items.map(ClinicalFileResponseDto.fromEntity),
      pagination: result.pagination,
    };
  }

  @Post('uploads')
  @RequirePermission('dentistry:files:create')
  @RequireModule('files')
  @Header('Cache-Control', 'no-store')
  async requestUpload(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: RequestClinicalFileUploadDto,
  ): Promise<ClinicalFileUploadResponseDto> {
    const { file, upload } = await this.requestUploadUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      authorizedBranchIds: principal.branchIds,
      actorMembershipId: principal.membershipId,
      category: dto.category,
      originalFilename: dto.originalFilename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      clinicalEncounterId: dto.clinicalEncounterId,
      capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : undefined,
      description: dto.description,
    });
    return {
      file: ClinicalFileResponseDto.fromEntity(file),
      upload: PresignedRequestResponseDto.fromRequest(upload),
    };
  }

  @Post(':fileId/complete')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('dentistry:files:create')
  @RequireModule('files')
  async complete(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<ClinicalFileResponseDto> {
    const file = await this.completeUploadUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      fileId,
      actorMembershipId: principal.membershipId,
    });
    return ClinicalFileResponseDto.fromEntity(file);
  }

  @Get(':fileId/access-url')
  @RequirePermission('dentistry:files:read')
  @Header('Cache-Control', 'no-store')
  async accessUrl(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query() query: ClinicalFileAccessUrlQueryDto,
  ): Promise<PresignedRequestResponseDto> {
    const request = await this.accessUrlUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      fileId,
      disposition: query.disposition,
    });
    return PresignedRequestResponseDto.fromRequest(request);
  }

  /** Edita los datos descriptivos; el objeto almacenado no se toca. */
  @Patch(':fileId')
  @RequirePermission('dentistry:files:update')
  @RequireModule('files')
  async update(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() dto: UpdateClinicalFileDto,
  ): Promise<ClinicalFileResponseDto> {
    const file = await this.updateUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      fileId,
      authorizedBranchIds: principal.branchIds,
      actorMembershipId: principal.membershipId,
      expectedUpdatedAt: new Date(dto.expectedUpdatedAt),
      category: dto.category,
      description: dto.description,
      capturedAt: toOptionalDate(dto.capturedAt),
    });
    return ClinicalFileResponseDto.fromEntity(file);
  }

  /** Devuelve el archivo retirado, como el resto de borrados lógicos de la API. */
  @Delete(':fileId')
  @RequirePermission('dentistry:files:delete')
  @RequireModule('files')
  async remove(
    @CurrentPrincipal() principal: DentistryPrincipal,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<ClinicalFileResponseDto> {
    const file = await this.deleteUseCase.execute({
      organizationId: principal.organizationId,
      patientId,
      fileId,
      authorizedBranchIds: principal.branchIds,
      actorMembershipId: principal.membershipId,
    });
    return ClinicalFileResponseDto.fromEntity(file);
  }
}

/** undefined conserva el valor; null lo borra. */
function toOptionalDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(value);
}
