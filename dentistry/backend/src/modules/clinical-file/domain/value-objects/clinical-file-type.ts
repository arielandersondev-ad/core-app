/** Tamaño máximo por archivo; independiente del cupo del plan. */
export const MAX_CLINICAL_FILE_BYTES = 10 * 1024 * 1024;

export const CLINICAL_FILE_CATEGORIES = ['RADIOGRAPH', 'PHOTO', 'DOCUMENT', 'OTHER'] as const;
export type ClinicalFileCategory = (typeof CLINICAL_FILE_CATEGORIES)[number];

type FileType = {
  extension: string;
  /** Firma de bytes iniciales; el tipo declarado no basta. */
  matches: (bytes: Uint8Array) => boolean;
};

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  bytes.length >= offset + signature.length &&
  signature.every((byte, index) => bytes[offset + index] === byte);

/** Tipos admitidos. SVG, HTML y otros tipos activos quedan fuera a propósito. */
const FILE_TYPES = {
  'image/jpeg': {
    extension: 'jpg',
    matches: (bytes) => startsWith(bytes, [0xff, 0xd8, 0xff]),
  },
  'image/png': {
    extension: 'png',
    matches: (bytes) => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  'application/pdf': {
    extension: 'pdf',
    // %PDF-
    matches: (bytes) => startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  },
} as const satisfies Record<string, FileType>;

export type ClinicalFileMimeType = keyof typeof FILE_TYPES;
export const CLINICAL_FILE_MIME_TYPES = Object.keys(FILE_TYPES) as ClinicalFileMimeType[];

export function isClinicalFileMimeType(value: string): value is ClinicalFileMimeType {
  return Object.hasOwn(FILE_TYPES, value);
}

export function extensionFor(mimeType: ClinicalFileMimeType): string {
  return FILE_TYPES[mimeType].extension;
}

/** True si los bytes iniciales corresponden al tipo declarado. */
export function contentMatchesMimeType(
  mimeType: ClinicalFileMimeType,
  bytes: Uint8Array,
): boolean {
  return FILE_TYPES[mimeType].matches(bytes);
}
