/**
 * Almacenamiento privado de objetos para los binarios de ClinicalFile.
 *
 * PostgreSQL solo guarda metadatos (packages/db target-schema-dictionary §5.6):
 * el navegador sube y descarga directamente contra el proveedor con
 * solicitudes firmadas de corta duración emitidas por este puerto.
 */

/** Vigencia máxima de una solicitud firmada emitida por el backend. */
export const MAX_PRESIGN_SECONDS = 3600;

export type PresignedRequest = {
  url: string;
  method: 'PUT' | 'GET';
  /** Cabeceras que el cliente debe enviar tal cual; forman parte de la firma. */
  headers: Record<string, string>;
  expiresAt: Date;
};

export type UploadRequestInput = {
  objectKey: string;
  contentType: string;
  /** Tamaño exacto declarado; el proveedor rechaza un cuerpo distinto. */
  sizeBytes: number;
  expiresInSeconds: number;
};

export type DownloadRequestInput = {
  objectKey: string;
  contentType: string;
  /** Nombre aportado por el usuario; se sanea antes de usarse en cabeceras. */
  filename: string;
  disposition: 'inline' | 'attachment';
  expiresInSeconds: number;
};

export type StoredObjectInfo = {
  sizeBytes: number;
  contentType: string | null;
};

export abstract class FileStorage {
  /** Valor persistido en `ClinicalFile.storageProvider`. */
  abstract readonly provider: string;
  /** Valor persistido en `ClinicalFile.bucket`. */
  abstract readonly bucket: string;

  /** False cuando el backend arrancó sin configuración de almacenamiento. */
  abstract readonly available: boolean;

  abstract createUploadRequest(input: UploadRequestInput): Promise<PresignedRequest>;

  abstract createDownloadRequest(input: DownloadRequestInput): Promise<PresignedRequest>;

  /** Metadatos del objeto almacenado; null si no existe. */
  abstract getObjectInfo(objectKey: string): Promise<StoredObjectInfo | null>;

  /** Lee el objeto completo; falla si supera `maxBytes` o no existe. */
  abstract readObject(objectKey: string, maxBytes: number): Promise<Uint8Array>;

  /** Idempotente: eliminar un objeto inexistente no es un error. */
  abstract deleteObject(objectKey: string): Promise<void>;
}
