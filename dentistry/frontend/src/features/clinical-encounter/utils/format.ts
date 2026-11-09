export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    const label = kilobytes.toFixed(1);
    if (Number(label) < 1024) return `${label} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
