import { Injectable, Logger } from '@nestjs/common';
import { PatientRepository } from '../../patient/domain/repositories/patient.repository.js';
import type { ClinicalFile } from '../domain/entities/clinical-file.entity.js';
import {
  FileStorageError,
  FileStorageUnavailableError,
} from '../domain/errors/file-storage.errors.js';
import {
  ClinicalFileRepository,
  type ClinicalFileScope,
} from '../domain/repositories/clinical-file.repository.js';
import { FileStorage } from './ports/file-storage.js';
import { ClinicalFileErrors } from './clinical-file.errors.js';

/** Comprobaciones comunes a los casos de uso de archivos clínicos. */
@Injectable()
export class ClinicalFileAccess {
  private readonly logger = new Logger('ClinicalFiles');

  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly fileRepository: ClinicalFileRepository,
    readonly storage: FileStorage,
  ) {}

  assertStorageAvailable(): void {
    if (!this.storage.available) throw ClinicalFileErrors.storageUnavailable();
  }

  /** 404 si el paciente no existe, está eliminado o es de otra organización. */
  async assertPatient(scope: ClinicalFileScope): Promise<void> {
    const patient = await this.patientRepository.findById(
      scope.patientId,
      scope.organizationId,
    );
    if (!patient || patient.deletedAt !== null) {
      throw ClinicalFileErrors.patientNotFound();
    }
  }

  /** Paciente accesible + archivo no eliminado del paciente. */
  async loadFile(scope: ClinicalFileScope, fileId: string): Promise<ClinicalFile> {
    await this.assertPatient(scope);
    const file = await this.fileRepository.findById(scope, fileId);
    if (!file) throw ClinicalFileErrors.fileNotFound();
    return file;
  }

  /** Traduce fallos del proveedor a 503 sin exponer su causa al cliente. */
  async callStorage<T>(operation: string, call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof FileStorageUnavailableError) {
        throw ClinicalFileErrors.storageUnavailable();
      }
      if (error instanceof FileStorageError) {
        this.logger.error(`Fallo del almacenamiento (${operation})`, describeCause(error.cause));
        throw ClinicalFileErrors.storageUnavailable();
      }
      throw error;
    }
  }

  /** Limpieza que no debe ocultar el error principal. */
  async discardObject(objectKey: string): Promise<void> {
    try {
      await this.storage.deleteObject(objectKey);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar un objeto rechazado: ${describeCause(error)}`,
      );
    }
  }
}

function describeCause(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}
