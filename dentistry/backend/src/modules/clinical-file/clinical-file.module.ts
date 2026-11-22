import { Logger, Module } from '@nestjs/common';
import { env } from '../../config/env.js';
import { FileStorage } from './application/ports/file-storage.js';
import { S3CompatibleFileStorage } from './infrastructure/storage/s3-compatible-file-storage.js';
import { UnavailableFileStorage } from './infrastructure/storage/unavailable-file-storage.js';

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
  providers: [{ provide: FileStorage, useFactory: createFileStorage }],
  exports: [FileStorage],
})
export class ClinicalFileModule {}
