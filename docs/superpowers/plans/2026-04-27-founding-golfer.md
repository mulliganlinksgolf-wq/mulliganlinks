# Founding Golfer Offer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Founding Golfer promotion — first 100 Eagle signups get 3 months free via Stripe trial, with a live counter on the membership page and a permanent badge on the profile.

**Architecture:** A new `founding_golfer_counter` table (single row) acts as the authoritative counter; a Postgres function `claim_founding_spot()` uses `SELECT ... FOR UPDATE` to atomically reserve a spot at checkout-creation time. The Stripe checkout session records whether the spot was claimed in metadata so the webhook can mark `profiles.founding_member = true` on payment confirmation. The membership/pricing page fetches the counter server-side and renders a banner component that disappears when spots hit zero.

**Tech Stack:** Next.js App Router (read `node_modules/next/dist/docs/` before writing code), Supabase Postgres, Stripe SDK (`2026-04-22.dahlia`), Vitest + React Testing Library

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/019_founding_golfer.sql` | Table, seed row, RPC, RLS |
| Create | `src/components/FoundingGolferBanner.tsx` | Pure presentational banner + counter |
| Create | `src/test/founding-golfer-banner.test.tsx` | Component tests for banner visibility |
| Modify | `src/app/app/membership/page.tsx` | Fetch counter, render banner above tier cards |
| Modify | `src/app/api/membership/checkout/route.ts` | Call RPC for eagle signups; add trial |
| Modify | `src/app/api/membership/webhook/route.ts` | Mark `founding_member = true` on payment |
| Modify | `src/app/app/profile/page.tsx` | Fetch `founding_member` from profiles |
| Modify | `src/components/ProfileForm.tsx` | Accept + render Founding Member badge |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/019_founding_golfer.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/019_founding_golfer.sql

-- Founding golfer counter (enforces single-row via CHECK)
CREATE TABLE public.founding_golfer_counter (
  id      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  claimed INTEGER NOT NULL DEFAULT 0,
  "limit" INTEGER NOT NULL DEFAULT 100
);

INSERT INTO public.founding_golfer_counter (id, claimed, "limit")
VALUES (1, 0, 100);

-- RLS: read-only for everyone (public counter display)
ALTER TABLE public.founding_golfer_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read founding counter"
  ON public.founding_golfer_counter
  FOR SELECT
  TO public
  USING (true);

-- Add founding_member flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founding_member BOOLEAN NOT NULL DEFAULT FALSE;

-- Atomic claim function; returns true if a spot was reserved, false if sold out
CREATE OR REPLACE FUNCTION public.claim_founding_spot()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claimed integer;
  v_limit   integer;
BEGIN
  SELECT claimed, "limit"
    INTO v_claimed, v_limit
    FROM public.founding_golfer_counter
   WHERE id = 1
     FOR UPDATE;

  IF v_claimed < v_limit THEN
    UPDATE public.founding_golfer_counter
       SET claimed = claimed + 1
     WHERE id = 1;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push --project-ref raqarpvbcdpgojcrmpyh
```

Expected: migration runs without error; `founding_golfer_counter` table exists with one row `(1, 0, 100)`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/019_founding_golfer.sql
git commit -m "feat: add founding_golfer_counter table, founding_member column, claim_founding_spot() RPC"
```

---

## Task 2: FoundingGolferBanner Component + Tests

**Files:**
- Create: `src/components/FoundingGolferBanner.tsx`
- Create: `src/test/founding-golfer-banner.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/founding-golfer-banner.test.tsx
import { render, screen } from '@testing-library/react'
import { FoundingGolferBanner } from '@/components/FoundingGolferBanner'

test('shows banner text and counter when spots remain', () => {
  render(<FoundingGolferBanner spotsRemaining={47} />)
  expect(screen.getByText(/Founding Golfer Offer/)).toBeInTheDocument()
  expect(screen.getByText(/47 of 100 spots remaining/)).toBeInTheDocument()
})

test('renders nothing when no spots remain', () => {
  const { container } = render(<FoundingGolferBanner spotsRemaining={0} />)
  expect(container.firstChild).toBeNull()
})

test('renders nothing when spotsRemaining is negative', () => {
  const { container } = render(<FoundingGolferBanner spotsRemaining={-1} />)
  expect(container.firstChild).toBeNull()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/founding-golfer-banner.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/FoundingGolferBanner'`

- [ ] **Step 3: Write the component**

```typescript
// src/components/FoundingGolferBanner.tsx

interface Props {
  spotsRemaining: number
}

export function FoundingGolferBanner({ spotsRemaining }: Props) {
  if (spotsRemaining <= 0) return null

  return (
    <div className="rounded-xl bg-[#E0A800]/10 border border-[#E0A800]/40 p-4 space-y-1">
      <p className="font-semibold text-[#1A1A1A] text-sm">
        Founding Golfer Offer — First 100 members get 3 months of Eagle free at launch.
        Then $79/yr. Cancel anytime before.
      </p>
      <p className="text-sm text-[#6B7770]">
        {spotsRemaining} of 100 spots remaining.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/founding-golfer-banner.test.tsx
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FoundingGolferBanner.tsx src/test/founding-golfer-banner.test.tsx
git commit -m "feat: add FoundingGolferBanner component with tests"
```

---

## Task 3: Membership Page — Add Banner

**Files:**
- Modify: `src/app/app/membership/page.tsx`

- [ ] **Step 1: Read the current file**

Read `src/app/app/membership/page.tsx` before editing. (Already done in planning — confirm it matches the version in this plan.)

- [ ] **Step 2: Apply the edit**

Add the counter query after the existing membership query, and render the banner before the tier grid. The final file should look like this:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FoundingGolferBanner } from '@/components/FoundingGolferBanner'

export const metadata: Metadata = { title: 'Upgrade Membership' }

const TIERS = [
  {
    id: 'eagle',
    name: 'Eagle',
    price: 79,
    priceMonthly: 7.99,
    color: 'ring-[#E0A800]/50',
    badge: 'Most Popular',
    badgeColor: 'bg-[#E0A800] text-[#1A1A1A]',
    features: [
      '$15/mo in tee time credits ($180/yr)',
      '2 free rounds per year',
      'Zero booking fees, always',
      '2× Fairway Points on every dollar',
      '48hr priority booking window',
      '12 guest passes per year',
      '10% green fee discount',
      '$25 birthday credit',
      'Unlimited free cancellation (1hr)',
    ],
  },
  {
    id: 'ace',
    name: 'Ace',
    price: 149,
    priceMonthly: 12.42,
    color: 'ring-[#1B4332]/50',
    badge: null,
    badgeColor: '',
    features: [
      '$25/mo in tee time credits ($300/yr)',
      '4 free rounds per year',
      'Zero booking fees, always',
      '3× Fairway Points on every dollar',
      '72hr priority booking window',
      'Unlimited guest passes',
      '15% green fee discount',
      '$50 birthday credit',
      'Unlimited free cancellation (1hr)',
      '2 in-person lessons per year',
      'Dedicated concierge booking line',
      'Physical Ace member card (coming soon)',
    ],
  },
]

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .single()

  const { data: counter } = await supabase
    .from('founding_golfer_counter')
    .select('claimed, limit')
    .eq('id', 1)
    .single()

  const currentTier = membership?.tier ?? 'fairway'
  const { tier: preselected } = await searchParams
  const spotsRemaining = counter ? (counter as { claimed: number; limit: number }).limit - counter.claimed : 0

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Upgrade your membership</h1>
        <p className="text-[#6B7770] text-sm mt-1">
          You&apos;re currently on <span className="font-medium text-[#1A1A1A] capitalize">{currentTier}</span>.
          Upgrade to earn more points, get credits, and unlock priority access.
        </p>
      </div>

      <FoundingGolferBanner spotsRemaining={spotsRemaining} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id
          return (
            <div key={tier.id} className={`bg-white rounded-xl ring-2 ${tier.color} p-6 space-y-5 relative`}>
              {tier.badge && (
                <div className="absolute -top-3 left-6">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${tier.badgeColor}`}>
                    {tier.badge}
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">{tier.name}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#1A1A1A]">${tier.price}</span>
                  <span className="text-[#6B7770] ml-1">/yr</span>
                  <span className="block text-xs text-[#6B7770] mt-0.5">~${tier.priceMonthly}/mo</span>
                </div>
              </div>

              <ul className="space-y-2">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                    <span className="text-[#1B4332] font-bold mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-2.5 rounded-lg bg-[#FAF7F2] text-sm font-semibold text-[#6B7770]">
                  Current plan
                </div>
              ) : (
                <form action={`/api/membership/checkout`} method="POST">
                  <input type="hidden" name="tier" value={tier.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#1B4332] py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
                  >
                    Upgrade to {tier.name} — ${tier.price}/yr
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>

      <Link href="/app" className="inline-flex text-sm text-[#6B7770] hover:text-[#1A1A1A]">
        ← Back to dashboard
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Run existing tests to confirm nothing is broken**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/app/membership/page.tsx
git commit -m "feat: show FoundingGolferBanner with live spot counter on membership page"
```

---

## Task 4: Checkout Route — Founding Spot Logic

**Files:**
- Modify: `src/app/api/membership/checkout/route.ts`

- [ ] **Step 1: Read the file before editing**

Read `src/app/api/membership/checkout/route.ts` to confirm current state.

- [ ] **Step 2: Apply the edit**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

const PRICE_IDS: Record<string, string> = {
  eagle: process.env.STRIPE_PRICE_EAGLE!,
  ace:   process.env.STRIPE_PRICE_ACE!,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const tier = formData.get('tier') as string
  const priceId = PRICE_IDS[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // For Eagle signups, atomically try to claim a founding spot
  let isFoundingGolfer = false
  if (tier === 'eagle') {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('claim_founding_spot')
    if (!error && data === true) {
      isFoundingGolfer = true
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email ?? profile?.email ?? undefined,
    metadata: { user_id: user.id, tier, founding_golfer: isFoundingGolfer ? 'true' : 'false' },
    subscription_data: {
      metadata: { user_id: user.id, tier },
      ...(isFoundingGolfer ? { trial_period_days: 90 } : {}),
    },
    success_url: `${baseUrl}/app/membership?success=1&tier=${tier}`,
    cancel_url: `${baseUrl}/app/membership`,
  })

  return NextResponse.redirect(session.url!, 303)
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/api/membership/checkout/route.ts
git commit -m "feat: claim founding spot atomically at Eagle checkout; add 90-day Stripe trial"
```

---

## Task 5: Webhook Route — Mark founding_member on Payment

**Files:**
- Modify: `src/app/api/membership/webhook/route.ts`

- [ ] **Step 1: Read the file before editing**

Read `src/app/api/membership/webhook/route.ts` to confirm current state.

- [ ] **Step 2: Apply the edit**

Replace the `checkout.session.completed` handler block. The full file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== 'subscription') return NextResponse.json({ ok: true })

    const userId = session.metadata?.user_id
    const tier = session.metadata?.tier
    if (!userId || !tier) return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })

    const sub = session.subscription as string
    const stripeSubscription = await stripe.subscriptions.retrieve(sub) as any
    const periodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString()

    await admin.from('memberships').upsert({
      user_id: userId,
      tier,
      status: 'active',
      stripe_subscription_id: sub,
      current_period_end: periodEnd,
    }, { onConflict: 'user_id' })

    // Mark founding_member permanently on the profile when payment is confirmed
    if (session.metadata?.founding_golfer === 'true') {
      await admin.from('profiles')
        .update({ founding_member: true })
        .eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    await admin.from('memberships')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/app/api/membership/webhook/route.ts
git commit -m "feat: set founding_member=true on profiles when founding golfer checkout completes"
```

---

## Task 6: Profile Page + ProfileForm — Founding Member Badge

**Files:**
- Modify: `src/app/app/profile/page.tsx`
- Modify: `src/components/ProfileForm.tsx`

- [ ] **Step 1: Read both files before editing**

Read `src/app/app/profile/page.tsx` and `src/components/ProfileForm.tsx`.

- [ ] **Step 2: Edit profile page to fetch founding_member**

Replace the profiles query and component call. Full file:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, founding_member')
    .eq('id', user.id)
    .single()

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">My Profile</h1>
      <ProfileForm
        userId={user.id}
        email={user.email ?? ''}
        initialName={profile?.full_name ?? ''}
        initialPhone={profile?.phone ?? ''}
        membership={membership ?? null}
        isFoundingMember={profile?.founding_member ?? false}
      />
    </div>
  )
}
```

- [ ] **Step 3: Edit ProfileForm to accept isFoundingMember and render the badge**

Full file replacement:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  userId: string
  email: string
  initialName: string
  initialPhone: string
  membership: { tier: string; status: string; current_period_end: string | null } | null
  isFoundingMember: boolean
}

const tierLabels: Record<string, string> = { free: 'Fairway', eagle: 'Eagle', ace: 'Ace' }

export function ProfileForm({ userId, email, initialName, initialPhone, membership, isFoundingMember }: Props) {
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false); setError(null)
    startTransition(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', userId)
      if (error) setError(error.message)
      else setSaved(true)
    })
  }

  const tier = membership?.tier ?? 'free'

  return (
    <div className="space-y-4">
      {isFoundingMember && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E0A800]/10 border border-[#E0A800]/40 w-fit">
          <span className="text-[#E0A800]">★</span>
          <span className="text-sm font-semibold text-[#1A1A1A]">Founding Member</span>
        </div>
      )}

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Account details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-gray-50 text-[#6B7770]" />
              <p className="text-xs text-[#6B7770]">Email cannot be changed.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-[#1B4332]">Profile saved.</p>}
            <Button type="submit" disabled={isPending} className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Membership</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7770]">Plan</span>
            <span className="font-semibold text-[#1A1A1A]">{tierLabels[tier] ?? 'Fairway'}</span>
          </div>
          {membership?.current_period_end && (
            <div className="flex justify-between">
              <span className="text-[#6B7770]">Renews</span>
              <span className="text-[#1A1A1A]">{new Date(membership.current_period_end).toLocaleDateString()}</span>
            </div>
          )}
          {tier === 'free' && (
            <a href="/signup?tier=eagle" className="inline-block mt-3 px-4 py-2 bg-[#E0A800] text-[#1A1A1A] rounded text-sm font-semibold hover:bg-[#E0A800]/90">
              Upgrade to Eagle
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/app/profile/page.tsx src/components/ProfileForm.tsx
git commit -m "feat: show Founding Member badge on profile when founding_member=true"
```

---

## Task 7: Full Test Run + Type Check

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass (including the 3 new banner tests)

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are type errors, fix them before proceeding.

---

## Task 8: Deploy to Production

- [ ] **Step 1: Push to main**

```bash
git push origin main
```

Expected: CI runs, Vercel deploys to production. Confirm deploy succeeds in Vercel dashboard before reporting complete.

---

## Implementation Notes

- **Abandoned checkouts consume a spot.** When `claim_founding_spot()` is called at checkout creation, the counter increments immediately. If a user abandons Stripe checkout, the spot is consumed but `founding_member` won't be set (since the webhook never fires). For 100 spots at launch this is an acceptable trade-off vs. the complexity of a reservation + expiry system.
- **`founding_member` is permanent.** The webhook marks it `true` but nothing in this plan ever sets it back to `false`. This matches the spec: "badge should persist permanently regardless of membership tier changes."
- **Counter display is server-rendered.** There's no real-time subscription on the counter — it reflects the value at page load. This is sufficient for a launch promotion.
