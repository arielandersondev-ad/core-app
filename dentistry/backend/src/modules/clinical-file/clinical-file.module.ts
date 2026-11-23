import { Logger, Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { env } from '../../config/env.js';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { ClinicalFileAccess } from './application/clinical-file-access.js';
import { FileStorage } from './application/ports/file-storage.js';
import { CompleteClinicalFileUploadUseCase } from './application/use-case/complete-clinical-file-upload.use-case.js';
import { DeleteClinicalFileUseCase } from './application/use-case/delete-clinical-file.use-case.js';
import { GetClinicalFileAccessUrlUseCase } from './application/use-case/get-clinical-file-access-url.use-case.js';
import { GetClinicalFileQuotaUseCase } from './application/use-case/get-clinical-file-quota.use-case.js';
import { ListClinicalFilesUseCase } from './application/use-case/list-clinical-files.use-case.js';
import { RequestClinicalFileUploadUseCase } from './application/use-case/request-clinical-file-upload.use-case.js';
import { ClinicalFileRepository } from './domain/repositories/clinical-file.repository.js';
import { PrismaClinicalFileRepository } from './infrastructure/prisma-clinical-file.repository.js';
import { S3CompatibleFileStorage } from './infrastructure/storage/s3-compatible-file-storage.js';
import { UnavailableFileStorage } from './infrastructure/storage/unavailable-file-storage.js';
import { ClinicalFileQuotaController } from './presentation/http/clinical-file-quota.controller.js';
import { ClinicalFileController } from './presentation/http/clinical-file.controller.js';

function createFileStorage(): FileStorage {
  const logger = new Logger('ClinicalFileModule');
  if (!env.storage) {
    logger.warn('Almacenamiento de archivos no configurado (STORAGE_*): adjuntos deshabilitados');
    return new UnavailableFileStorage();
  }
  logger.log(`Almacenamiento de archivos: ${env.storage.provider}`);
  return new S3CompatibleFileStorage(env.storage);
}

@Module({
  imports: [PrismaModule, DentistryAuthModule, PatientModule],
  controllers: [ClinicalFileQuotaController, ClinicalFileController],
  providers: [
    { provide: FileStorage, useFactory: createFileStorage },
    { provide: ClinicalFileRepository, useClass: PrismaClinicalFileRepository },
    ClinicalFileAccess,
    ListClinicalFilesUseCase,
    RequestClinicalFileUploadUseCase,
    CompleteClinicalFileUploadUseCase,
    GetClinicalFileAccessUrlUseCase,
    DeleteClinicalFileUseCase,
    GetClinicalFileQuotaUseCase,
  ],
  exports: [FileStorage],
})
export class ClinicalFileModule {}
