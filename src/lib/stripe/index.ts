import Stripe from 'stripe'
import { STRIPE_API_VERSION } from './version'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key.includes('placeholder')) throw new Error('STRIPE_SECRET_KEY not configured')
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION, typescript: true })
  }
  return _stripe
}

// Proxy so callers can do `import { stripe } from '@/lib/stripe'` and get lazy init
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) { return (getStripe() as any)[prop] },
})
