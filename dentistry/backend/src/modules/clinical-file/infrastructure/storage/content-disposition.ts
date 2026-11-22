// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;
const PATH_OR_QUOTE = /["\\/]/g;
const MAX_FILENAME_LENGTH = 200;

/** Nombre aportado por el usuario reducido a un valor seguro para mostrar. */
export function sanitizeFilename(raw: string): string {
  const cleaned = raw
    .normalize('NFC')
    .replace(CONTROL, '')
    .replace(PATH_OR_QUOTE, '_')
    .trim();
  const limited = Array.from(cleaned).slice(0, MAX_FILENAME_LENGTH).join('');
  return limited || 'archivo';
}

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
