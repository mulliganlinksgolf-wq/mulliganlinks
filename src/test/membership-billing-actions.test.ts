import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDatabase } from './helpers/database'
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/stripe', () => ({ stripe: { subscriptions: { retrieve: vi.fn(), update: vi.fn() } } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { pauseMembership, resumeMembership, cancelMembership } from '@/lib/actions/membership'
let db: ReturnType<typeof mockDatabase>
const sub = { id: 'sub_1', customer: 'cus_1', metadata: { user_id: 'user-1' }, status: 'active', cancel_at_period_end: false, canceled_at: null, pause_collection: null }
beforeEach(() => {
  vi.clearAllMocks()
  db = mockDatabase({ memberships: { tier: 'eagle', stripe_subscription_id: 'sub_1', stripe_customer_id: 'cus_1' } })
  vi.mocked(createClient).mockResolvedValue(db.client as never)
  vi.mocked(createAdminClient).mockReturnValue(db.client as never)
  vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(sub as never)
  vi.mocked(stripe.subscriptions.update).mockImplementation(async (_id, params) => ({ ...sub, ...params }) as never)
})
describe('membership billing', () => {
  it('cancels the actual Stripe renewal before updating the display', async () => {
    await cancelMembership()
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_1', { cancel_at_period_end: true })
    expect(db.writes).toContainEqual({ table: 'memberships', method: 'update', value: expect.objectContaining({ cancel_at_period_end: true }) })
  })
  it('pauses collection with automatic resumption and voided invoices', async () => {
    await pauseMembership(1)
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_1', { pause_collection: { behavior: 'void', resumes_at: expect.any(Number) } })
  })
  it('resumes Stripe collection', async () => {
    await resumeMembership()
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_1', { pause_collection: '' })
  })
  it('does not claim success or update the database when Stripe rejects the change', async () => {
    vi.mocked(stripe.subscriptions.update).mockRejectedValue(new Error('Stripe unavailable'))
    await expect(cancelMembership()).rejects.toThrow('Stripe unavailable')
    expect(db.writes).toHaveLength(0)
  })
  it('rejects forged pause durations before contacting Stripe', async () => {
    await expect(pauseMembership(12 as 1)).rejects.toThrow('one- or two-month')
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled()
  })
  it('rejects a subscription belonging to a different account', async () => {
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({ ...sub, customer: 'other', metadata: { user_id: 'other' } } as never)
    await expect(cancelMembership()).rejects.toThrow('does not belong')
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()
  })
  it('reports a display-sync failure honestly after Stripe succeeds', async () => {
    const original = db.client.from
    vi.mocked(stripe.subscriptions.update).mockImplementation(async () => { db.failures.memberships = { message: 'write failed' }; return { ...sub, cancel_at_period_end: true } as never })
    await expect(cancelMembership()).rejects.toThrow('saved with Stripe')
    expect(original).toHaveBeenCalled()
  })
})
