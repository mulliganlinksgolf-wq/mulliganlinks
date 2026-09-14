/** Normalize a to-one PostgREST relation when inferred metadata allows an array. */
export function related<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined
}
