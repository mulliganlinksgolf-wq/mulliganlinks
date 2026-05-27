# Guest Passes + Member Benefits Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guest passes (1/yr Eagle, 2/yr Ace — $15 booking credit each), birthday credit ($10/$20 issued on birthday, valid 1 year), birthday field on signup, and a `/app/benefits` page showing every benefit with usage tracking and total savings.

**Architecture:** New DB migration adds `profiles.birthday`, `bookings.discount_cents`, `bookings.guest_pass_id`, and a `guest_passes` table. Two new server-action files handle issuance. Guest pass checkbox wired into both booking form paths. Benefits page fetches all benefit data server-side and computes savings inline.

**Tech Stack:** Next.js App Router, Supabase (server + admin client), TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-05-05-guest-passes-benefits-page-design.md`

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/057_guest_passes_birthday.sql`

- [ ] **Step 1: Write migration**

```sql
-- profiles: add birthday
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday date;

-- bookings: add discount tracking columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guest_pass_id uuid;

-- guest_passes table
CREATE TABLE IF NOT EXISTS public.guest_passes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  redeemed_at timestamptz,
  booking_id  uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read own guest passes"
  ON public.guest_passes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role manage guest passes"
  ON public.guest_passes FOR ALL
  USING (true);

-- Update handle_new_user to capture birthday from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, birthday)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    CASE
      WHEN new.raw_user_meta_data->>'birthday' IS NOT NULL
      THEN (new.raw_user_meta_data->>'birthday')::date
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: migration applies cleanly with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/057_guest_passes_birthday.sql
git commit -m "feat(db): add guest_passes table, birthday on profiles, discount_cents on bookings"
```

---

### Task 2: Guest pass + birthday credit server actions

**Files:**
- Create: `src/app/actions/guestPasses.ts`
- Create: `src/app/actions/birthdayCredit.ts`

- [ ] **Step 1: Write `guestPasses.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const PASSES_BY_TIER: Record<string, number> = { eagle: 1, ace: 2 }

export async function issueGuestPasses(userId: string, tier: string): Promise<void> {
  const count = PASSES_BY_TIER[tier] ?? 0
  if (count === 0) return

  const admin = createAdminClient()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const passes = Array.from({ length: count }, () => ({
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  }))

  await admin.from('guest_passes').insert(passes)
}

export async function getAvailablePasses(userId: string): Promise<{ id: string; expires_at: string }[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('guest_passes')
    .select('id, expires_at')
    .eq('user_id', userId)
    .is('redeemed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at')

  return data ?? []
}
```

- [ ] **Step 2: Write `birthdayCredit.ts`**

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const BIRTHDAY_CREDIT_CENTS: Record<string, number> = { eagle: 1000, ace: 2000 }

export async function issueIfBirthdayToday(userId: string, tier: string): Promise<void> {
  const amount = BIRTHDAY_CREDIT_CENTS[tier] ?? 0
  if (amount === 0) return

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('birthday')
    .eq('id', userId)
    .single()

  if (!profile?.birthday) return

  const today = new Date()
  const bday = new Date(profile.birthday)
  if (bday.getMonth() !== today.getMonth() || bday.getDate() !== today.getDate()) return

  const period = today.toISOString().split('T')[0] // YYYY-MM-DD
  const expiresAt = new Date(today)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  await admin.from('member_credits').upsert(
    {
      user_id: userId,
      type: 'birthday',
      amount_cents: amount,
      period,
      status: 'available',
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'user_id,type,period', ignoreDuplicates: true },
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/guestPasses.ts src/app/actions/birthdayCredit.ts
git commit -m "feat(actions): add guest pass issuance and birthday credit actions"
```

---

### Task 3: Add birthday field to signup

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Add birthday state and field**

Replace the entire `SignupPage` component content with this updated version:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, birthday } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      fetch('/api/auth/signup-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      }).catch(() => {})
      setDone(true)
    }
  }

  if (done) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <div className="text-4xl">⛳️</div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Check your email</h2>
          <p className="text-[#6B7770] text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#1A1A1A]">Create your account</CardTitle>
        <CardDescription className="text-[#6B7770]">Start with Fairway — free forever. Upgrade anytime.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jordan Smith" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthday">Date of birth</Label>
            <Input id="birthday" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters" minLength={8} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2]">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-[#6B7770] mt-4">
          Already have an account? <Link href="/login" className="text-[#1B4332] font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-xs text-[#6B7770] mt-3">
          By signing up, you agree to our <Link href="/terms" className="hover:underline">Terms</Link> and <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/signup/page.tsx
git commit -m "feat(signup): add required date of birth field"
```

---

### Task 4: Issue guest passes on membership activation

**Files:**
- Modify: `src/app/api/membership/webhook/route.ts`

- [ ] **Step 1: Import and call `issueGuestPasses` after membership upsert**

Add the import at the top of the file (after the existing imports):

```ts
import { issueGuestPasses } from '@/app/actions/guestPasses'
```

Then, inside the `checkout.session.completed` handler, directly after the `upsertError` check block (after the `if (upsertError) { ... return }` block), add:

```ts
    // Issue guest passes for the new membership tier
    await issueGuestPasses(userId, tier)
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/membership/webhook/route.ts
git commit -m "feat(membership): issue guest passes on membership activation"
```

---

### Task 5: Wire guest pass into booking actions

**Files:**
- Modify: `src/app/actions/booking.ts`

- [ ] **Step 1: Update `createPendingBooking` to accept and process guest pass**

Add `guestPassId?: string` to the parameter type and handle it:

Replace the `createPendingBooking` function signature and body with:

```ts
export async function createPendingBooking({
  teeTimeId,
  players,
  tier,
  guestPassId,
}: {
  teeTimeId: string
  players: number
  tier: string
  guestPassId?: string
}): Promise<{ bookingId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { data: teeTime } = await admin
    .from('tee_times')
    .select('id, available_players, status, base_price, course_id')
    .eq('id', teeTimeId)
    .single()

  if (!teeTime || teeTime.status !== 'open' || teeTime.available_players < players) {
    return { error: 'This tee time is no longer available.' }
  }

  // Validate guest pass server-side before applying
  let verifiedPassId: string | null = null
  if (guestPassId) {
    const { data: pass } = await admin
      .from('guest_passes')
      .select('id')
      .eq('id', guestPassId)
      .eq('user_id', user.id)
      .is('redeemed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
    verifiedPassId = pass?.id ?? null
  }

  const discountCents = verifiedPassId ? 1500 : 0
  const greenFeeCents = Math.round((teeTime.base_price as number) * players * 100)
  const appFeeCents = platformFeeCents(tier)
  const totalCents = greenFeeCents + appFeeCents - discountCents

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      tee_time_id: teeTimeId,
      user_id: user.id,
      players,
      total_paid: totalCents / 100,
      status: 'pending_payment',
      payment_status: 'pending',
      green_fee_cents: greenFeeCents,
      platform_fee_cents: appFeeCents,
      total_charged_cents: totalCents,
      points_awarded: 0,
      discount_cents: discountCents,
      guest_pass_id: verifiedPassId,
    })
    .select('id')
    .single()

  if (error || !booking) return { error: 'Failed to create booking.' }

  // Mark pass redeemed immediately (tied to this booking)
  if (verifiedPassId) {
    await admin
      .from('guest_passes')
      .update({ redeemed_at: new Date().toISOString(), booking_id: booking.id })
      .eq('id', verifiedPassId)
  }

  return { bookingId: booking.id }
}
```

- [ ] **Step 2: Update `confirmBooking` to accept and process guest pass**

Add `guestPassId?: string` to `confirmBooking`'s parameter type (after `tier`):

```ts
  guestPassId?: string
```

Then after the `// Create booking` comment, update the insert to include discount fields. Replace the booking insert inside `confirmBooking` with:

```ts
  // Validate guest pass server-side
  const adminClient = createAdminClient()
  let verifiedPassId: string | null = null
  if (guestPassId) {
    const { data: pass } = await adminClient
      .from('guest_passes')
      .select('id')
      .eq('id', guestPassId)
      .eq('user_id', userId)
      .is('redeemed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
    verifiedPassId = pass?.id ?? null
  }

  const discountCents = verifiedPassId ? 1500 : 0
  const adjustedTotal = total - discountCents / 100

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tee_time_id: teeTimeId,
      user_id: userId,
      players,
      total_paid: adjustedTotal,
      status: 'confirmed',
      points_awarded: pointsEarned,
      discount_cents: discountCents,
      guest_pass_id: verifiedPassId,
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    return { error: 'Failed to create booking. Please try again.' }
  }

  // Mark guest pass redeemed
  if (verifiedPassId) {
    await adminClient
      .from('guest_passes')
      .update({ redeemed_at: new Date().toISOString(), booking_id: booking.id })
      .eq('id', verifiedPassId)
  }
```

Note: remove the `const adminClient = createAdminClient()` line that appears later in the existing `confirmBooking` function (it declares adminClient a second time — rename the later one to `adminClient2` or reuse the one declared above).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/booking.ts
git commit -m "feat(booking): accept guest pass id, apply \$15 discount and mark redeemed"
```

---

### Task 6: Guest pass checkbox in booking forms

**Files:**
- Modify: `src/components/BookingPaymentForm.tsx`
- Modify: `src/components/BookingForm.tsx`

- [ ] **Step 1: Update `BookingPaymentForm.tsx`**

Add `availablePasses` prop and guest pass checkbox to the outer form. The component needs to:
1. Accept `availablePasses` prop
2. Add `useGuestPass` state
3. Subtract $15 from total when checked
4. Pass `guestPassId` to `createPendingBooking`

Replace the `BookingPaymentForm` export (the outer component, not `CheckoutForm`) with:

```tsx
export function BookingPaymentForm({
  teeTime,
  tier,
  userId,
  availablePasses = [],
}: {
  teeTime: TeeTime
  tier: string
  userId: string
  availablePasses?: { id: string; expires_at: string }[]
}) {
  const [players, setPlayers] = useState(1)
  const [useGuestPass, setUseGuestPass] = useState(false)
  const [step, setStep] = useState<'select' | 'pay'>('select')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const multiplier = MULTIPLIER[tier] ?? 1
  const baseSubtotal = teeTime.base_price * players
  const guestDiscount = useGuestPass ? 15 : 0
  const appFee = platformFeeCents(tier) / 100
  const total = baseSubtotal - guestDiscount + appFee
  const pointsEarned = Math.floor(baseSubtotal * multiplier)
  const selectedPass = availablePasses[0] ?? null

  function handleProceed() {
    setError(null)
    startTransition(async () => {
      const result = await createPendingBooking({
        teeTimeId: teeTime.id,
        players,
        tier,
        guestPassId: useGuestPass && selectedPass ? selectedPass.id : undefined,
      })
      if (result.error || !result.bookingId) {
        setError(result.error ?? 'Failed to create booking')
        return
      }

      const res = await fetch(`/api/bookings/${result.bookingId}/payment-intent`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.client_secret) {
        setError(data.error ?? 'Failed to initialize payment')
        return
      }

      setBookingId(result.bookingId)
      setClientSecret(data.client_secret)
      setStep('pay')
    })
  }

  if (step === 'pay' && clientSecret && bookingId) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#1B4332', borderRadius: '8px' },
          },
        }}
      >
        <CheckoutForm
          bookingId={bookingId}
          total={total}
          greenFee={baseSubtotal}
          appFee={platformFeeCents(tier)}
          pointsEarned={pointsEarned}
          tier={tier}
          guestDiscount={guestDiscount}
        />
      </Elements>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Number of players</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => { setPlayers(n); if (n <= 1) setUseGuestPass(false) }}
                disabled={n > teeTime.available_players}
                className={`w-12 h-12 rounded-lg border text-sm font-semibold transition-colors ${
                  players === n
                    ? 'bg-[#1B4332] text-[#FAF7F2] border-[#1B4332]'
                    : n > teeTime.available_players
                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1B4332]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-2 text-sm">
          <div className="flex justify-between text-[#6B7770]">
            <span>${teeTime.base_price.toFixed(2)} × {players} player{players !== 1 ? 's' : ''}</span>
            <span>${baseSubtotal.toFixed(2)}</span>
          </div>
          {selectedPass && players > 1 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                onClick={() => setUseGuestPass(v => !v)}
                className="flex items-center gap-2 text-[#6B7770] hover:text-[#1A1A1A]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${useGuestPass ? 'bg-[#1B4332] border-[#1B4332]' : 'border-gray-300'}`}>
                  {useGuestPass && <span className="text-white text-xs">✓</span>}
                </div>
                Use a guest pass — save $15 ({availablePasses.length} remaining)
              </button>
              {useGuestPass && <span className="text-[#1B4332] font-medium">−$15.00</span>}
            </div>
          )}
          {appFee > 0 ? (
            <div className="flex justify-between text-[#6B7770]">
              <span>Booking fee</span>
              <span>${appFee.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-[#1B4332]">
              <span>Booking fee</span>
              <span>Free</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#1A1A1A] pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-[#6B7770]">+{pointsEarned} Fairway Points earned</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleProceed}
        disabled={isPending}
        className="w-full rounded-lg bg-[#1B4332] py-3.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Loading...' : `Continue to Payment · $${total.toFixed(2)}`}
      </button>
      <p className="text-xs text-center text-[#6B7770]">Free cancellation up to 1 hour before tee time</p>
    </div>
  )
}
```

Also update `CheckoutForm` to accept and display `guestDiscount`:

Replace the `CheckoutForm` props interface and the discount display:

```tsx
function CheckoutForm({
  bookingId,
  total,
  greenFee,
  appFee,
  pointsEarned,
  tier,
  guestDiscount,
}: {
  bookingId: string
  total: number
  greenFee: number
  appFee: number
  pointsEarned: number
  tier: string
  guestDiscount: number
}) {
```

And inside the price breakdown in `CheckoutForm`, after the green fee row, add:

```tsx
          {guestDiscount > 0 && (
            <div className="flex justify-between text-[#1B4332]">
              <span>Guest pass</span>
              <span>−$15.00</span>
            </div>
          )}
```

- [ ] **Step 2: Update `BookingForm.tsx`**

Add `availablePasses` prop and guest pass checkbox. The non-Stripe booking form uses `confirmBooking`.

Add `availablePasses` to the props interface:

```tsx
  availablePasses?: { id: string; expires_at: string }[]
```

Add `useGuestPass` state after the existing state declarations:

```tsx
  const [useGuestPass, setUseGuestPass] = useState(false)
```

Update the calculation block (after `const multiplier`):

```tsx
  const multiplier = MULTIPLIER[tier] ?? 1
  const subtotal = teeTime.base_price * players
  const guestDiscount = useGuestPass ? 15 : 0
  const creditsValue = useCredits ? Math.min(creditBalanceCents / 100, subtotal - guestDiscount) : 0
  const afterCredits = subtotal - guestDiscount - creditsValue
```

Update `handleSubmit` to pass `guestPassId`:

```tsx
      const result = await confirmBooking({
        teeTimeId: teeTime.id,
        userId,
        players,
        subtotal,
        discount: 0,
        pointsRedeemed: usePoints ? Math.round(pointsValue * 100) : 0,
        creditsRedeemedCents: useCredits ? Math.round(creditsValue * 100) : 0,
        rainCheckId: rainCheck?.id,
        total,
        pointsEarned,
        tier,
        guestPassId: useGuestPass && availablePasses?.[0] ? availablePasses[0].id : undefined,
      })
```

Add the guest pass checkbox inside the price breakdown card, after the subtotal row and before the credits row:

```tsx
          {availablePasses && availablePasses.length > 0 && players > 1 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <button
                onClick={() => setUseGuestPass(v => !v)}
                className="flex items-center gap-2 text-[#6B7770] hover:text-[#1A1A1A]"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${useGuestPass ? 'bg-[#1B4332] border-[#1B4332]' : 'border-gray-300'}`}>
                  {useGuestPass && <span className="text-white text-xs">✓</span>}
                </div>
                Use a guest pass — save $15 ({availablePasses.length} remaining)
              </button>
              {useGuestPass && <span className="text-[#1B4332] font-medium">−$15.00</span>}
            </div>
          )}
```

- [ ] **Step 3: Pass `availablePasses` from the booking page**

The booking page at `src/app/app/book/[teeTimeId]/page.tsx` renders the booking form. Read this file and update it to:
1. Import `getAvailablePasses` from `@/app/actions/guestPasses`
2. Fetch `availablePasses` for the current user in parallel with other data
3. Pass `availablePasses` to `BookingForm` or `BookingPaymentForm`

The pattern will match how `creditBalanceCents` is already fetched and passed.

- [ ] **Step 4: Commit**

```bash
git add src/components/BookingPaymentForm.tsx src/components/BookingForm.tsx
git commit -m "feat(booking): add guest pass checkbox — saves \$15 when redeemed"
```

---

### Task 7: Benefits page + nav

**Files:**
- Create: `src/app/app/benefits/page.tsx`
- Modify: `src/lib/nav.ts`

- [ ] **Step 1: Add Benefits to sidebar nav**

In `src/lib/nav.ts`, add after the Points entry in `SIDEBAR_NAV_ITEMS`:

```ts
  { href: '/app/benefits', label: 'Benefits', icon: '🎁' },
```

Do NOT add to `BOTTOM_NAV_ITEMS` (already at 5 items).

- [ ] **Step 2: Create `src/app/app/benefits/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { issueIfBirthdayToday } from '@/app/actions/birthdayCredit'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Benefits' }

const BOOKING_FEE = 1.49
const FREE_ROUND_VALUE = 45 // estimated average green fee

function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, (used / total) * 100)
  return (
    <div className="w-full h-1.5 rounded-full bg-[#0f2d1d] mt-2">
      <div className="h-1.5 rounded-full bg-[#8FA889] transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function BenefitCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-3" style={{ background: '#163d2a' }}>
      <p className="text-[9px] uppercase tracking-[0.2em] font-sans" style={{ color: '#8FA889' }}>{title}</p>
      {children}
    </div>
  )
}

export default async function BenefitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = membership?.tier ?? 'fairway'
  const isPaid = tier === 'eagle' || tier === 'ace'

  // Issue birthday credit if today is the member's birthday
  if (isPaid) await issueIfBirthdayToday(user.id, tier)

  const [
    { data: bookings },
    { data: points },
    { data: credits },
    { data: passes },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, platform_fee_cents, discount_cents, status, created_at')
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'completed']),
    supabase
      .from('fairway_points')
      .select('amount')
      .eq('user_id', user.id)
      .gt('amount', 0),
    supabase
      .from('member_credits')
      .select('type, amount_cents, status, expires_at, created_at')
      .eq('user_id', user.id),
    supabase
      .from('guest_passes')
      .select('id, issued_at, expires_at, redeemed_at, booking_id')
      .eq('user_id', user.id)
      .order('issued_at'),
  ])

  const allBookings = bookings ?? []
  const allCredits = credits ?? []
  const allPasses = passes ?? []

  // --- Savings calculations ---
  const bookingFeeSaved = isPaid ? allBookings.length * BOOKING_FEE : 0

  const guestPassSaved = allPasses
    .filter(p => p.redeemed_at)
    .reduce((s) => s + 15, 0)

  const freeRoundsUsed = allCredits.filter(c => c.type === 'free_round' && c.status === 'used').length
  const freeRoundsSaved = freeRoundsUsed * FREE_ROUND_VALUE

  const birthdayCreditUsed = allCredits
    .filter(c => c.type === 'birthday' && c.status === 'used')
    .reduce((s, c) => s + c.amount_cents / 100, 0)

  const pointsValue = (points ?? []).reduce((s, p) => s + p.amount, 0) / 100

  const monthlyCreditsTotal = allCredits
    .filter(c => c.type === 'monthly')
    .reduce((s, c) => s + c.amount_cents / 100, 0)

  const totalSaved = bookingFeeSaved + guestPassSaved + freeRoundsSaved + birthdayCreditUsed + pointsValue + monthlyCreditsTotal

  // --- Guest pass data ---
  const passesAllotment = tier === 'ace' ? 2 : tier === 'eagle' ? 1 : 0
  const passesUsed = allPasses.filter(p => p.redeemed_at).length
  const passesAvailable = allPasses.filter(p => !p.redeemed_at && new Date(p.expires_at) > new Date())

  // --- Complimentary rounds ---
  const roundsAllotment = tier === 'ace' ? 2 : tier === 'eagle' ? 1 : 0
  const freeRoundCredits = allCredits.filter(c => c.type === 'free_round')
  const roundsUsedCount = freeRoundCredits.filter(c => c.status === 'used').length

  // --- Birthday credit ---
  const birthdayCredit = allCredits.find(c => c.type === 'birthday' && new Date(c.expires_at) > new Date())
  const birthdayAmount = tier === 'ace' ? 20 : tier === 'eagle' ? 10 : 0

  // --- Member since ---
  const memberSince = membership?.created_at
    ? new Date(membership.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#aaa] font-sans mb-1">Benefits</p>
        <h1 className="text-2xl font-bold font-serif text-white italic">Your benefits.</h1>
        <p className="text-[11px] font-sans mt-1 text-[#8FA889]">Since {memberSince}</p>
      </div>

      {/* Hero savings */}
      <div className="rounded-xl p-6 mb-6" style={{ background: '#1B4332' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] font-sans mb-1" style={{ color: '#8FA889' }}>Total saved with TeeAhead</p>
        <p className="text-4xl font-bold font-serif text-white">${totalSaved.toFixed(2)}</p>
      </div>

      {!isPaid && (
        <div className="rounded-xl p-5 mb-6 text-center" style={{ background: '#163d2a' }}>
          <p className="text-sm font-sans text-[#8FA889]">Upgrade to Eagle or Ace to unlock guest passes, birthday credits, and more.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Booking fee waivers */}
        <BenefitCard title="Booking Fee Waivers">
          <p className="text-2xl font-bold font-serif text-white">${bookingFeeSaved.toFixed(2)}</p>
          <p className="text-xs font-sans text-[#8FA889]">saved across {allBookings.length} round{allBookings.length !== 1 ? 's' : ''}</p>
          <p className="text-xs font-sans" style={{ color: '#555' }}>Never pay a booking fee</p>
        </BenefitCard>

        {/* Guest passes */}
        {isPaid && (
          <BenefitCard title="Guest Passes">
            <p className="text-2xl font-bold font-serif text-white">{passesUsed} <span className="text-base font-sans text-[#8FA889]">of {passesAllotment} used</span></p>
            <ProgressBar used={passesUsed} total={passesAllotment} />
            <div className="space-y-2 mt-2">
              {allPasses.map(p => (
                <div key={p.id} className={`flex items-center gap-2 text-xs font-sans ${p.redeemed_at ? 'opacity-40' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.redeemed_at ? 'bg-[#555]' : 'bg-[#8FA889]'}`} />
                  <span className={p.redeemed_at ? 'line-through text-[#555]' : 'text-[#ddd]'}>
                    Guest Pass
                  </span>
                  <span className="text-[#555] ml-auto">
                    {p.redeemed_at
                      ? `Used ${new Date(p.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : `Expires ${new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  </span>
                </div>
              ))}
            </div>
            {passesAvailable.length > 0 && (
              <p className="text-xs font-semibold font-sans mt-1" style={{ color: '#E0A800' }}>
                {passesAvailable.length} unused pass{passesAvailable.length !== 1 ? 'es' : ''}
              </p>
            )}
          </BenefitCard>
        )}

        {/* Complimentary rounds */}
        {isPaid && (
          <BenefitCard title="Complimentary Rounds">
            <p className="text-2xl font-bold font-serif text-white">{roundsUsedCount} <span className="text-base font-sans text-[#8FA889]">of {roundsAllotment} used</span></p>
            <ProgressBar used={roundsUsedCount} total={roundsAllotment} />
            <div className="space-y-2 mt-2">
              {freeRoundCredits.map((c, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs font-sans ${c.status === 'used' ? 'opacity-40' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.status === 'used' ? 'bg-[#555]' : 'bg-[#8FA889]'}`} />
                  <span className={c.status === 'used' ? 'line-through text-[#555]' : 'text-[#ddd]'}>
                    Complimentary Round
                  </span>
                  <span className="text-[#555] ml-auto">
                    {c.status === 'used'
                      ? 'Used'
                      : `Expires ${new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  </span>
                </div>
              ))}
              {freeRoundCredits.length === 0 && (
                <p className="text-xs text-[#555]">Credited at the course — contact staff to redeem.</p>
              )}
            </div>
          </BenefitCard>
        )}

        {/* Birthday credit */}
        {isPaid && (
          <BenefitCard title="Birthday Credit">
            <p className="text-2xl font-bold font-serif text-white">${birthdayAmount}</p>
            {birthdayCredit ? (
              birthdayCredit.status === 'used' ? (
                <p className="text-xs font-sans text-[#555]">Used this year</p>
              ) : (
                <>
                  <p className="text-xs font-sans" style={{ color: '#8FA889' }}>
                    Available · expires {new Date(birthdayCredit.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-semibold font-sans" style={{ color: '#E0A800' }}>Ready to use</p>
                </>
              )
            ) : (
              <p className="text-xs font-sans text-[#555]">Issued automatically on your birthday each year.</p>
            )}
          </BenefitCard>
        )}

        {/* Fairway Points */}
        <BenefitCard title="Fairway Points">
          <p className="text-2xl font-bold font-serif text-white">${pointsValue.toFixed(2)}</p>
          <p className="text-xs font-sans text-[#8FA889]">earned lifetime</p>
          <p className="text-xs font-sans text-[#555]">100 pts = $1 toward future rounds</p>
        </BenefitCard>

        {/* Monthly credits */}
        {isPaid && (
          <BenefitCard title="Monthly Credits">
            <p className="text-2xl font-bold font-serif text-white">${monthlyCreditsTotal.toFixed(2)}</p>
            <p className="text-xs font-sans text-[#8FA889]">issued lifetime</p>
            <p className="text-xs font-sans text-[#555]">${tier === 'ace' ? 20 : 10}/mo toward tee times</p>
          </BenefitCard>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/app/benefits/page.tsx src/lib/nav.ts
git commit -m "feat(benefits): add member benefits page with savings tracker"
```

---

### Task 8: Copy fixes — remove "(at participating courses)" from guest pass

**Files:**
- Modify: `src/app/app/membership/page.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/waitlist/golfer/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Fix all four files**

In each file, find `'1 guest pass per year (at participating courses)'` and replace with `'1 guest pass per year'`.

Find `'2 guest passes per year (at participating courses)'` and replace with `'2 guest passes per year'`.

Run:
```bash
grep -rn "at participating courses" src/app --include="*.tsx"
```
Expected: shows the lines to fix. After editing, re-run — expected: no output.

- [ ] **Step 2: Commit**

```bash
git add src/app/app/membership/page.tsx src/app/pricing/page.tsx src/app/waitlist/golfer/page.tsx src/app/page.tsx
git commit -m "fix(copy): remove stale 'at participating courses' qualifier from guest pass copy"
```

---

### Task 9: Push to production

- [ ] **Step 1: Push**

```bash
git push origin main
```

Expected: Vercel deploy triggered.

---

## Self-Review Notes

- Task 6 Step 3 requires reading `src/app/app/book/[teeTimeId]/page.tsx` before editing — content unknown at plan-write time; follow the existing pattern for `creditBalanceCents`.
- `confirmBooking` in Task 5 declares `adminClient` — the existing function also declares it later. The later declaration must be renamed `adminClient2` to avoid a duplicate variable error.
- Guest pass checkbox only shows when `players > 1` AND passes are available — this is enforced in both form components.
- Birthday credit unique constraint is `(user_id, type, period)` where `period` = `YYYY-MM-DD` of birthday — safe to call `issueIfBirthdayToday` on every page load.
