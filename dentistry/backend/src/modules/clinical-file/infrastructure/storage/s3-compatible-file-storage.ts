import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageConfig } from '../../../../config/storage-env.js';
import {
  FileStorage,
  MAX_PRESIGN_SECONDS,
  type DownloadRequestInput,
  type PresignedRequest,
  type StoredObjectInfo,
  type UploadRequestInput,
} from '../../application/ports/file-storage.js';
import {
  FileStorageError,
  StoredObjectNotFoundError,
  StoredObjectTooLargeError,
} from '../../domain/errors/file-storage.errors.js';
import { buildContentDisposition } from './content-disposition.js';

/** Cabeceras que deben coincidir exactamente en la subida firmada. */
const SIGNED_UPLOAD_HEADERS = new Set(['content-type', 'content-length']);

function assertExpiry(seconds: number): void {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_PRESIGN_SECONDS) {
    throw new RangeError(`La vigencia firmada debe estar entre 1 y ${MAX_PRESIGN_SECONDS} s`);
  }
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, $metadata } = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return name === 'NotFound' || name === 'NoSuchKey' || $metadata?.httpStatusCode === 404;
}

export function createS3Client(config: StorageConfig): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint ?? undefined,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Los proveedores compatibles (B2, R2) no admiten todas las sumas
    // flexibles de AWS y el navegador no puede calcularlas al subir.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    maxAttempts: 3,
  });
}

/** Adaptador para cualquier proveedor con API S3: B2, S3, R2 o MinIO. */
export class S3CompatibleFileStorage extends FileStorage {
  readonly provider: string;
  readonly bucket: string;
  readonly available = true;

  constructor(
    config: StorageConfig,
    private readonly client: S3Client = createS3Client(config),
  ) {
    super();
    this.provider = config.provider;
    this.bucket = config.bucket;
  }

  async createUploadRequest(input: UploadRequestInput): Promise<PresignedRequest> {
    assertExpiry(input.expiresInSeconds);
    if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new RangeError('El tamaño de la subida debe ser un entero positivo');
    }
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });
    const url = await this.sign('presign-upload', command, {
      expiresIn: input.expiresInSeconds,
      signableHeaders: SIGNED_UPLOAD_HEADERS,
    });
    return {
      url,
      method: 'PUT',
      // El navegador fija Content-Length a partir del cuerpo; no se envía a mano.
      headers: { 'Content-Type': input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    };
  }

  async createDownloadRequest(input: DownloadRequestInput): Promise<PresignedRequest> {
    assertExpiry(input.expiresInSeconds);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ResponseContentType: input.contentType,
      ResponseContentDisposition: buildContentDisposition(
        input.disposition,
        input.filename,
      ),
      ResponseCacheControl: 'private, no-store',
    });
    const url = await this.sign('presign-download', command, {
      expiresIn: input.expiresInSeconds,
    });
    return {
      url,
      method: 'GET',
      headers: {},
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    };
  }

  async getObjectInfo(objectKey: string): Promise<StoredObjectInfo | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      return {
        sizeBytes: result.ContentLength ?? 0,
        contentType: result.ContentType ?? null,
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw new FileStorageError('head', { cause: error });
    }
  }

  async readObject(objectKey: string, maxBytes: number): Promise<Uint8Array> {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
      throw new RangeError('maxBytes debe ser un entero positivo');
    }
    let bytes: Uint8Array;
    try {
      // Pide un byte más del límite para detectar objetos mayores sin leerlos enteros.
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Range: `bytes=0-${maxBytes}`,
        }),
      );
      if (!result.Body) throw new StoredObjectNotFoundError();
      bytes = await result.Body.transformToByteArray();
    } catch (error) {
      if (error instanceof StoredObjectNotFoundError || isNotFound(error)) {
        throw new StoredObjectNotFoundError();
      }
      throw new FileStorageError('read', { cause: error });
    }
    if (bytes.byteLength > maxBytes) throw new StoredObjectTooLargeError(maxBytes);
    return bytes;
  }

  async deleteObject(objectKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
    } catch (error) {
      if (isNotFound(error)) return;
      throw new FileStorageError('delete', { cause: error });
    }
  }

  private async sign(
    operation: string,
    command: PutObjectCommand | GetObjectCommand,
    options: { expiresIn: number; signableHeaders?: Set<string> },
  ): Promise<string> {
    try {
      return await getSignedUrl(this.client, command, options);
    } catch (error) {
      throw new FileStorageError(operation, { cause: error });
    }
  }
}
