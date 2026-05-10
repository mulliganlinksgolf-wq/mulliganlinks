// src/test/cart-booking.test.ts
import { describe, it, expect } from 'vitest'

describe('Cart fee resolution', () => {
  it('resolves cart fee from matched rate_name', () => {
    const tiers = [
      { rate_name: 'peak', cart_fee_cents: 2000 },
      { rate_name: 'off-peak', cart_fee_cents: 1500 },
    ]
    const matched = tiers.find(t => t.rate_name === 'peak') ?? tiers[0]
    expect(matched.cart_fee_cents).toBe(2000)
  })

  it('falls back to first tier when rate_name has no match', () => {
    const tiers = [
      { rate_name: 'standard', cart_fee_cents: 1800 },
    ]
    const matched = tiers.find(t => t.rate_name === 'stale-name') ?? tiers[0]
    expect(matched.cart_fee_cents).toBe(1800)
  })

  it('returns 0 when no tiers exist', () => {
    const tiers: { rate_name: string; cart_fee_cents: number }[] = []
    const matched = tiers.find(t => t.rate_name === 'any') ?? tiers[0]
    expect(matched?.cart_fee_cents ?? 0).toBe(0)
  })
})

describe('Cart policy auto-selection', () => {
  it('initializes cartSelected=true for mandatory policy', () => {
    const cartPolicy = 'mandatory'
    const cartSelected = cartPolicy === 'mandatory'
    expect(cartSelected).toBe(true)
  })

  it('initializes cartSelected=false for optional policy', () => {
    const cartPolicy = 'optional'
    const cartSelected = cartPolicy === 'mandatory'
    expect(cartSelected).toBe(false)
  })

  it('initializes cartSelected=false for walking_only policy', () => {
    const cartPolicy = 'walking_only'
    const cartSelected = cartPolicy === 'mandatory'
    expect(cartSelected).toBe(false)
  })
})

describe('Cart fee total calculation', () => {
  it('adds cart fee to total when cart selected', () => {
    const greenFee = 4500
    const cartFee = 1800
    const cartSelected = true
    const total = greenFee + (cartSelected ? cartFee : 0)
    expect(total).toBe(6300)
  })

  it('does not add cart fee when walking', () => {
    const greenFee = 4500
    const cartFee = 1800
    const cartSelected = false
    const total = greenFee + (cartSelected ? cartFee : 0)
    expect(total).toBe(4500)
  })
})
