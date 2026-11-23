import {
  FileStorage,
  type PresignedRequest,
  type StoredObjectInfo,
} from '../../application/ports/file-storage.js';
import { FileStorageUnavailableError } from '../../domain/errors/file-storage.errors.js';

/** Implementación usada cuando el backend arranca sin variables STORAGE_*. */
export class UnavailableFileStorage extends FileStorage {
  readonly provider = 'UNCONFIGURED';
  readonly bucket = '';
  readonly available = false;

  createUploadRequest(): Promise<PresignedRequest> {
    return Promise.reject(new FileStorageUnavailableError());
  }

  createDownloadRequest(): Promise<PresignedRequest> {
    return Promise.reject(new FileStorageUnavailableError());
  }

  getObjectInfo(): Promise<StoredObjectInfo | null> {
    return Promise.reject(new FileStorageUnavailableError());
  }

  readObject(): Promise<Uint8Array> {
    return Promise.reject(new FileStorageUnavailableError());
  }

  deleteObject(): Promise<void> {
    return Promise.reject(new FileStorageUnavailableError());
  }
}
