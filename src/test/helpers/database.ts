import { vi } from 'vitest'

export function mockDatabase(rows: Record<string, unknown> = {}, user: { id: string } | null = { id: 'user-1' }) {
  const writes: { table: string; method: string; value: unknown }[] = []
  const filters: { table: string; key: string; value: unknown }[] = []
  const failures: Record<string, { message: string; code?: string }> = {}
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    rpc: vi.fn().mockResolvedValue({ data: 'booking-1', error: null }),
    from: vi.fn((table: string) => {
      const result = () => ({ data: rows[table] ?? null, error: failures[table] ?? null })
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn((key: string, value: unknown) => { filters.push({ table, key, value }); return chain }),
        is: vi.fn(() => chain), gt: vi.fn(() => chain), lt: vi.fn(() => chain), gte: vi.fn(() => chain),
        not: vi.fn(() => chain), in: vi.fn(() => chain), order: vi.fn(() => chain), limit: vi.fn(() => chain),
        single: vi.fn(async () => result()), maybeSingle: vi.fn(async () => result()),
        insert: vi.fn((value: unknown) => { writes.push({ table, method: 'insert', value }); return chain }),
        upsert: vi.fn((value: unknown) => { writes.push({ table, method: 'upsert', value }); return chain }),
        update: vi.fn((value: unknown) => { writes.push({ table, method: 'update', value }); return chain }),
        throwOnError: vi.fn(async () => { if (failures[table]) throw failures[table]; return result() }),
        then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result()).then(resolve),
      }
      return chain
    }),
  }
  return { client, writes, filters, failures, rows }
}
