/** El backend arrancó sin configuración STORAGE_*. */
export class FileStorageUnavailableError extends Error {
  constructor() {
    super('El almacenamiento de archivos no está configurado');
    this.name = 'FileStorageUnavailableError';
  }
}

/** El objeto solicitado no existe en el almacenamiento. */
export class StoredObjectNotFoundError extends Error {
  constructor() {
    super('El objeto no existe en el almacenamiento');
    this.name = 'StoredObjectNotFoundError';
  }
}

/** El objeto almacenado supera el tamaño que se permite leer. */
export class StoredObjectTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`El objeto supera ${maxBytes} bytes`);
    this.name = 'StoredObjectTooLargeError';
  }
}

/**
 * Fallo del proveedor. El mensaje es genérico: la causa original puede
 * contener el bucket, la clave del objeto o detalles de la cuenta.
 */
export class FileStorageError extends Error {
  constructor(
    readonly operation: string,
    options?: { cause?: unknown },
  ) {
    super(`Fallo del almacenamiento de archivos (${operation})`, options);
    this.name = 'FileStorageError';
  }
}
