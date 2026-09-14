import { randomBytes } from 'node:crypto'

export function generateSlug(courseName: string): string {
  // 3 random bytes = 16.7M values, making collisions negligible at scale
  const suffix = randomBytes(3).toString('hex') // 6 hex chars

  const base = courseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base}-${suffix}`;
}
