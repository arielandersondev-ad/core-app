// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;
const PATH_OR_QUOTE = /["\\/]/g;
export const MAX_FILENAME_LENGTH = 200;

/** Nombre aportado por el usuario reducido a un metadato seguro para mostrar. */
export function sanitizeFilename(raw: string): string {
  const cleaned = raw
    .normalize('NFC')
    .replace(CONTROL, '')
    .replace(PATH_OR_QUOTE, '_')
    .trim();
  const limited = Array.from(cleaned).slice(0, MAX_FILENAME_LENGTH).join('');
  return limited || 'archivo';
}
