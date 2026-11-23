import { sanitizeFilename } from '../../domain/value-objects/filename.js';

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Cabecera Content-Disposition con respaldo ASCII y nombre UTF-8 (RFC 6266).
 */
export function buildContentDisposition(
  disposition: 'inline' | 'attachment',
  filename: string,
): string {
  const safe = sanitizeFilename(filename);
  const ascii = safe.replace(/[^\x20-\x7e]/g, '_');
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeRfc5987(safe)}`;
}
