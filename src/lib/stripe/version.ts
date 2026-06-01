// Single source of truth for the Stripe API version used across server code.
// The ephemeral key created for the mobile Payment Sheet must use this same version.
// If @stripe/stripe-react-native reports a version mismatch at runtime, update this
// to the version the SDK reports and redeploy.

export const STRIPE_API_VERSION = '2026-04-22.dahlia' as const
