export function generateSlug(courseName: string): string {
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

  const base = courseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base}-${suffix}`;
}
