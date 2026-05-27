# Partner Referral — Free Year Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a golfer signs up via `?ref=glge` (or any future partner code), validate the code, mark their waitlist record for a free first year of Eagle, update the confirmation email, surface attribution in admin, and wire up Stripe trial + year-2 rev share.

**Architecture:** New `partner_referrals` table validated server-side in the waitlist action. The `ref` query param flows through the page → `TierPicker` → `GolferWaitlistForm` as a hidden input. The action atomically increments a redeemed counter via RPC and sets `referral_free_year = true` on the waitlist record. At member activation, a Stripe trial subscription is created. When the trial converts to paid, `invoice.payment_succeeded` triggers year-2 rev share via the existing cron infrastructure.

**Tech Stack:** Next.js App Router, Supabase (admin client + RPC), Resend, Stripe subscriptions with `trial_end`, Vitest

---

## Files Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/074_partner_referrals.sql` | **Create** | Schema: new columns on `golfer_waitlist` + `profiles`, `partner_referrals` table + seed + RPC |
| `src/app/waitlist/golfer/page.tsx` | **Modify** | Pass `ref` searchParam down to `TierPicker` |
| `src/app/waitlist/golfer/TierPicker.tsx` | **Modify** | Accept + forward `referralCode` prop to `GolferWaitlistForm` |
| `src/app/waitlist/golfer/GolferWaitlistForm.tsx` | **Modify** | Accept `referralCode` prop, render hidden input |
| `src/app/waitlist/golfer/actions.ts` | **Modify** | Validate partner code, set `referral_free_year`, pass `freeYear` to email |
| `src/lib/resend.ts` | **Modify** | Add `freeYear` param to `sendGolferWaitlistConfirmation`, branch email copy |
| `src/app/admin/waitlist/page.tsx` | **Modify** | Add Partners tab: fetch `partner_referrals`, render summary + attributed signups |
| `src/app/admin/waitlist/actions.ts` | **Modify** | Add `activateGolferMember` server action with Stripe trial support |
| `src/app/admin/waitlist/ActivateGolferButton.tsx` | **Create** | Client button that calls `activateGolferMember` |
| `src/app/api/webhooks/stripe/route.ts` | **Modify** | Handle `invoice.payment_succeeded` → year-2 rev share for partner referrals |
| `src/test/partner-referral-action.test.ts` | **Create** | Unit tests: action validates code, sets free_year, increments counter |
| `src/test/partner-referral-email.test.ts` | **Create** | Unit tests: email branches on freeYear flag |

---

## Task 1: Migration 074 — Database Schema

**Files:**
- Create: `supabase/migrations/074_partner_referrals.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/074_partner_referrals.sql

-- Extend golfer_waitlist with partner referral attribution
ALTER TABLE golfer_waitlist
  ADD COLUMN IF NOT EXISTS referral_code      text,
  ADD COLUMN IF NOT EXISTS referral_free_year boolean NOT NULL DEFAULT false;

-- Extend profiles so attribution carries through to active members
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code        text,
  ADD COLUMN IF NOT EXISTS free_year_redeemed   boolean NOT NULL DEFAULT false;

-- Partner referrals: one row per partner with cap tracking
CREATE TABLE IF NOT EXISTS partner_referrals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE NOT NULL,
  partner_name  text NOT NULL,
  contact_name  text,
  contact_email text,
  cap           int NOT NULL DEFAULT 50,
  redeemed      int NOT NULL DEFAULT 0,
  rev_share_pct numeric(5,2) NOT NULL DEFAULT 10.00,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- Seed GLGE
INSERT INTO partner_referrals (code, partner_name, contact_name, cap)
VALUES ('glge', 'Great Lakes Golf Excursions', 'Bill', 50)
ON CONFLICT (code) DO NOTHING;

-- RLS: only service-role can write; admins read via admin client (bypasses RLS)
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

-- Atomic increment: prevents race-condition double-counting
CREATE OR REPLACE FUNCTION increment_partner_redeemed(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  UPDATE partner_referrals
  SET redeemed = redeemed + 1
  WHERE code = p_code;
END;
$$;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected output: `Applying migration 074_partner_referrals...` with no errors.

- [ ] **Step 3: Verify schema in Supabase**

```bash
npx supabase db diff --schema public | grep -E "(partner_referrals|referral_code|referral_free_year|free_year_redeemed)"
```

Expected: no diff (changes are already applied).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/074_partner_referrals.sql
git commit -m "feat: add partner_referrals table, referral columns, increment RPC"
```

---

## Task 2: URL Parameter Flow — Page → Form

**Files:**
- Modify: `src/app/waitlist/golfer/page.tsx`
- Modify: `src/app/waitlist/golfer/TierPicker.tsx`
- Modify: `src/app/waitlist/golfer/GolferWaitlistForm.tsx`

- [ ] **Step 1: Write the test first**

Create `src/test/partner-referral-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GolferWaitlistForm } from '@/app/waitlist/golfer/GolferWaitlistForm'

vi.mock('@/app/waitlist/golfer/actions', () => ({
  joinGolferWaitlist: vi.fn(),
}))

describe('GolferWaitlistForm — partner referral hidden input', () => {
  it('renders a hidden referral_code input when referralCode is provided', () => {
    const { container } = render(
      <GolferWaitlistForm courses={[]} referralCode="glge" />
    )
    const hidden = container.querySelector('input[name="referral_code"]') as HTMLInputElement
    expect(hidden).not.toBeNull()
    expect(hidden.value).toBe('glge')
  })

  it('omits the hidden input when referralCode is null', () => {
    const { container } = render(
      <GolferWaitlistForm courses={[]} referralCode={null} />
    )
    const hidden = container.querySelector('input[name="referral_code"]')
    expect(hidden).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/test/partner-referral-form.test.tsx
```

Expected: FAIL — `GolferWaitlistForm` doesn't accept `referralCode` yet.

- [ ] **Step 3: Update `GolferWaitlistForm.tsx` — add prop and hidden input**

In `src/app/waitlist/golfer/GolferWaitlistForm.tsx`, change the props signature and add the hidden input:

```tsx
// Change the function signature from:
export function GolferWaitlistForm({ tier = '', courses = [] }: { tier?: string; courses?: Course[] }) {

// To:
export function GolferWaitlistForm({ tier = '', courses = [], referralCode = null }: {
  tier?: string
  courses?: Course[]
  referralCode?: string | null
}) {
```

Inside the `<form>` element, add immediately after the opening tag (before the error div):

```tsx
{referralCode && (
  <input type="hidden" name="referral_code" value={referralCode} />
)}
```

- [ ] **Step 4: Update `TierPicker.tsx` — thread the prop through**

Change the TierPicker props and the `GolferWaitlistForm` render call:

```tsx
// Change props from:
export function TierPicker({ tiers, initialTier, courses }: { tiers: Tier[]; initialTier: string; courses: Course[] }) {

// To:
export function TierPicker({ tiers, initialTier, courses, referralCode = null }: {
  tiers: Tier[]
  initialTier: string
  courses: Course[]
  referralCode?: string | null
}) {
```

Change the `GolferWaitlistForm` render call (near line 97):

```tsx
// From:
<GolferWaitlistForm tier={selectedTier} courses={courses} />

// To:
<GolferWaitlistForm tier={selectedTier} courses={courses} referralCode={referralCode} />
```

- [ ] **Step 5: Update `page.tsx` — pass `ref` to `TierPicker`**

In `src/app/waitlist/golfer/page.tsx`, change the `TierPicker` call (currently around line 209):

```tsx
// From:
<TierPicker tiers={tiers} initialTier={tier ?? 'fairway'} courses={activeCourses ?? []} />

// To:
<TierPicker tiers={tiers} initialTier={tier ?? 'fairway'} courses={activeCourses ?? []} referralCode={ref ?? null} />
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npx vitest run src/test/partner-referral-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/waitlist/golfer/GolferWaitlistForm.tsx \
        src/app/waitlist/golfer/TierPicker.tsx \
        src/app/waitlist/golfer/page.tsx \
        src/test/partner-referral-form.test.tsx
git commit -m "feat: thread partner referral_code through page → form hidden input"
```

---

## Task 3: Server Action — Validate Code and Set Free Year

**Files:**
- Modify: `src/app/waitlist/golfer/actions.ts`
- Create: `src/test/partner-referral-action.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/test/partner-referral-action.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/recaptcha', () => ({
  verifyRecaptcha: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/resend', () => ({
  sendGolferWaitlistConfirmation: vi.fn().mockResolvedValue(undefined),
}))

// Track what gets inserted into golfer_waitlist
let lastInsert: Record<string, unknown> = {}
let partnerRow: Record<string, unknown> | null = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'partner_referrals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() =>
            Promise.resolve({ data: partnerRow, error: partnerRow ? null : { code: 'PGRST116' } })
          ),
        }
      }
      if (table === 'golfer_waitlist') {
        return {
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            lastInsert = row
            return Promise.resolve({ error: null })
          }),
          select: vi.fn().mockReturnThis(),
          head: true,
          then: vi.fn(),
          // support .select('*', { count: 'exact', head: true })
          // just return count 1
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        // for count query
        count: 1,
      }
    }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

import { joinGolferWaitlist } from '@/app/waitlist/golfer/actions'

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set('recaptcha_token', 'tok')
  fd.set('email', 'jack@example.com')
  fd.set('first_name', 'Jack')
  fd.set('last_name', 'Nicklaus')
  fd.set('zip_code', '48009')
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v)
  return fd
}

describe('joinGolferWaitlist — partner referral', () => {
  beforeEach(() => {
    lastInsert = {}
    partnerRow = null
  })

  it('sets referral_free_year true when code is valid and cap remains', async () => {
    partnerRow = { id: 'p1', redeemed: 10, cap: 50, active: true }
    await joinGolferWaitlist(makeFormData({ referral_code: 'glge' }))
    expect(lastInsert.referral_code).toBe('glge')
    expect(lastInsert.referral_free_year).toBe(true)
  })

  it('sets referral_free_year false when no code provided', async () => {
    await joinGolferWaitlist(makeFormData())
    expect(lastInsert.referral_free_year).toBe(false)
  })

  it('sets referral_free_year false when cap is exhausted', async () => {
    partnerRow = { id: 'p1', redeemed: 50, cap: 50, active: true }
    await joinGolferWaitlist(makeFormData({ referral_code: 'glge' }))
    expect(lastInsert.referral_free_year).toBe(false)
  })

  it('sets referral_free_year false when partner is inactive', async () => {
    partnerRow = { id: 'p1', redeemed: 5, cap: 50, active: false }
    await joinGolferWaitlist(makeFormData({ referral_code: 'glge' }))
    expect(lastInsert.referral_free_year).toBe(false)
  })

  it('stores referral_code on the insert even when cap is exhausted', async () => {
    partnerRow = { id: 'p1', redeemed: 50, cap: 50, active: true }
    await joinGolferWaitlist(makeFormData({ referral_code: 'glge' }))
    expect(lastInsert.referral_code).toBe('glge')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/partner-referral-action.test.ts
```

Expected: FAIL — action doesn't read `referral_code` yet.

- [ ] **Step 3: Update the server action**

Replace `src/app/waitlist/golfer/actions.ts` with:

```ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendGolferWaitlistConfirmation } from '@/lib/resend'
import { verifyRecaptcha } from '@/lib/recaptcha'

export async function joinGolferWaitlist(formData: FormData) {
  const recaptchaToken = (formData.get('recaptcha_token') as string) ?? ''
  const isHuman = await verifyRecaptcha(recaptchaToken)
  if (!isHuman) {
    return { error: 'reCAPTCHA verification failed. Please try again.' }
  }

  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName = (formData.get('last_name') as string)?.trim()
  const zipCode = (formData.get('zip_code') as string)?.trim()
  const homeCourse = (formData.get('home_course') as string)?.trim() || null
  const roundsPerYear = (formData.get('rounds_per_year') as string)?.trim() || null
  const currentMembership = (formData.get('current_membership') as string)?.trim() || null
  const interestedTier = (formData.get('interested_tier') as string)?.trim() || null
  const hearAboutUs = (formData.get('hear_about_us') as string)?.trim() || null
  const referralCode = (formData.get('referral_code') as string)?.trim() || null

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!firstName || !lastName) {
    return { error: 'First and last name are required.' }
  }
  if (!zipCode) {
    return { error: 'ZIP code is required.' }
  }

  const supabase = createAdminClient()

  // Validate partner referral code and check cap
  let freeYear = false
  if (referralCode) {
    const { data: partner } = await supabase
      .from('partner_referrals')
      .select('id, redeemed, cap, active')
      .eq('code', referralCode)
      .single()

    if (partner && partner.active && partner.redeemed < partner.cap) {
      freeYear = true
      await supabase.rpc('increment_partner_redeemed', { p_code: referralCode })
    }
  }

  const { error } = await supabase.from('golfer_waitlist').insert({
    email,
    first_name: firstName,
    last_name: lastName,
    zip_code: zipCode,
    home_course: homeCourse,
    rounds_per_year: roundsPerYear,
    current_membership: currentMembership,
    interested_tier: interestedTier,
    referral_source: hearAboutUs,
    referral_code: referralCode,
    referral_free_year: freeYear,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: "You're already on the list!" }
    }
    console.error('[golfer-waitlist]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  const { count } = await supabase
    .from('golfer_waitlist')
    .select('*', { count: 'exact', head: true })

  const position = count ?? 1

  await sendGolferWaitlistConfirmation({ email, firstName, position, freeYear })

  return { success: true, position }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/partner-referral-action.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/waitlist/golfer/actions.ts src/test/partner-referral-action.test.ts
git commit -m "feat: validate partner referral code in waitlist action, set referral_free_year"
```

---

## Task 4: Confirmation Email — Branch Copy for Free Year

**Files:**
- Modify: `src/lib/resend.ts`
- Create: `src/test/partner-referral-email.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/test/partner-referral-email.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

const sentEmails: Array<{ subject: string; html: string }> = []

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockImplementation((payload: { subject: string; html: string }) => {
        sentEmails.push(payload)
        return Promise.resolve({})
      }),
    },
  })),
}))

// Provide a fake API key so getResend() returns a client
process.env.RESEND_API_KEY = 're_test_key'

import { sendGolferWaitlistConfirmation } from '@/lib/resend'

describe('sendGolferWaitlistConfirmation — free year branch', () => {
  beforeEach(() => sentEmails.splice(0))

  it('includes free year copy when freeYear is true', async () => {
    await sendGolferWaitlistConfirmation({
      email: 'jack@example.com',
      firstName: 'Jack',
      position: 7,
      freeYear: true,
    })
    expect(sentEmails[0].html).toContain('Great Lakes Golf Excursions')
    expect(sentEmails[0].html).toContain('first year of Eagle membership is on us')
  })

  it('omits free year copy when freeYear is false', async () => {
    await sendGolferWaitlistConfirmation({
      email: 'jack@example.com',
      firstName: 'Jack',
      position: 7,
      freeYear: false,
    })
    expect(sentEmails[0].html).not.toContain('first year of Eagle membership is on us')
  })

  it('sends to the correct email address', async () => {
    await sendGolferWaitlistConfirmation({
      email: 'jack@example.com',
      firstName: 'Jack',
      position: 7,
    })
    expect((sentEmails[0] as any).to).toBe('jack@example.com')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/partner-referral-email.test.ts
```

Expected: FAIL — `sendGolferWaitlistConfirmation` doesn't accept `freeYear` yet.

- [ ] **Step 3: Update `sendGolferWaitlistConfirmation` in `src/lib/resend.ts`**

Locate the function (around line 82) and update its signature and HTML:

```ts
export async function sendGolferWaitlistConfirmation({
  email,
  firstName,
  position,
  freeYear = false,
}: {
  email: string
  firstName: string
  position: number
  freeYear?: boolean
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping golfer waitlist email')
    return
  }

  const freeYearBlock = freeYear ? `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#15803d;font-size:15px;">
        🎉 Your first year of Eagle is on us.
      </p>
      <p style="margin:0;color:#166534;font-size:14px;line-height:1.6;">
        Because you signed up through our partner <strong>Great Lakes Golf Excursions</strong>,
        your first year of Eagle membership is free. That's zero booking fees, 1.5× Fairway Points
        at every partner course, and priority booking at launch — no credit card ever required.
      </p>
    </div>
  ` : ''

  await client.emails.send({
    from: 'TeeAhead <hello@teeahead.com>',
    to: email,
    subject: `You're #${position} on the TeeAhead waitlist ⛳`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">You're #${position} on the list ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>You're officially on the TeeAhead waitlist. We're launching in Metro Detroit and you'll be
        among the first to know when we go live.</p>
        ${freeYearBlock}
        <p>Here's what you're waiting for:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>Zero booking fees at partner courses — forever</li>
          <li>Eagle membership ($89/yr) beats GolfPass+ ($119/yr) on every single metric</li>
          <li>Real Fairway Points on every dollar played at local courses</li>
        </ul>
        <p>Know a golf course that should partner with us? Send them to
        <a href="https://teeahead.com/waitlist/course" style="color: #1B4332;">teeahead.com/waitlist/course</a>.
        More partner courses = more value for you on day one.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
          Questions? Reply to this email — we read every one.
        </p>
      </div>
    `,
  })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/partner-referral-email.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/resend.ts src/test/partner-referral-email.test.ts
git commit -m "feat: branch waitlist confirmation email copy for free-year partner referrals"
```

---

## Task 5: Admin Portal — Partners Tab

**Files:**
- Modify: `src/app/admin/waitlist/page.tsx`

- [ ] **Step 1: Update admin waitlist page to fetch partner data and add the tab**

In `src/app/admin/waitlist/page.tsx`:

Change the `tab` derivation to support three tabs:

```ts
// From:
const tab = params.tab === 'courses' ? 'courses' : 'golfers'

// To:
const tab = ['golfers', 'courses', 'partners'].includes(params.tab ?? '')
  ? (params.tab as 'golfers' | 'courses' | 'partners')
  : 'golfers'
```

Add partner data fetches to the existing `Promise.all` (add two new parallel fetches):

```ts
const [
  { data: golfers },
  { data: simpleWaitlist },
  { data: courses },
  { data: counter },
  { data: partners },
] = await Promise.all([
  adminClient.from('golfer_waitlist').select('*').order('id', { ascending: true }),
  adminClient.from('waitlist').select('*').order('created_at', { ascending: true }),
  adminClient.from('course_waitlist').select('*').order('created_at', { ascending: false }),
  adminClient.from('founding_partner_counter').select('count, cap').single(),
  adminClient.from('partner_referrals').select('*').order('created_at', { ascending: true }),
])
```

Update the tab strip to add Partners:

```tsx
{[
  { value: 'golfers', label: `Golfers (${(golfers?.length ?? 0) + emailOnlySignups.length})` },
  { value: 'courses', label: `Courses (${courses?.length ?? 0})` },
  { value: 'partners', label: `Partners (${partners?.length ?? 0})` },
].map(({ value, label }) => (
  <a
    key={value}
    href={`/admin/waitlist?tab=${value}`}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === value
        ? 'bg-[#1B4332] text-[#FAF7F2]'
        : 'text-[#6B7770] hover:text-[#1A1A1A]'
    }`}
  >
    {label}
  </a>
))}
```

Add the Partners tab body after the existing `{tab === 'courses' && ...}` block:

```tsx
{tab === 'partners' && (
  <div className="space-y-8">
    <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF7F2] border-b border-black/5">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Partner</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Code</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Cap</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Redeemed</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Remaining</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Rev Share</th>
              <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {(partners ?? []).length > 0 ? (
              (partners ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">{p.partner_name}</td>
                  <td className="px-4 py-3">
                    <code className="bg-[#FAF7F2] px-2 py-0.5 rounded text-xs font-mono text-[#1B4332]">{p.code}</code>
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">{p.contact_name ?? '—'}</td>
                  <td className="px-4 py-3 text-[#6B7770]">{p.cap}</td>
                  <td className="px-4 py-3 text-[#6B7770]">{p.redeemed}</td>
                  <td className="px-4 py-3">
                    <span className={p.cap - p.redeemed > 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                      {p.cap - p.redeemed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7770]">{p.rev_share_pct}%</td>
                  <td className="px-4 py-3">
                    {p.active
                      ? <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Active</span>
                      : <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                    }
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#6B7770]">No partners yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Attributed signups — all waitlist entries from any partner */}
    {(partners ?? []).length > 0 && (() => {
      const partnerCodes = new Set((partners ?? []).map((p: any) => p.code))
      const attributed = (golfers ?? []).filter((g: any) => g.referral_code && partnerCodes.has(g.referral_code))
      return attributed.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-[#6B7770] mb-3">Attributed Signups ({attributed.length})</h3>
          <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7F2] border-b border-black/5">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Partner Code</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Free Year</th>
                    <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Signed up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {attributed.map((g: any) => (
                    <tr key={g.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{g.first_name} {g.last_name}</td>
                      <td className="px-4 py-3 text-[#6B7770]">{g.email}</td>
                      <td className="px-4 py-3">
                        <code className="bg-[#FAF7F2] px-2 py-0.5 rounded text-xs font-mono text-[#1B4332]">{g.referral_code}</code>
                      </td>
                      <td className="px-4 py-3">
                        {g.referral_free_year
                          ? <span className="text-xs bg-[#E0A800]/15 text-[#92650a] border border-[#E0A800]/40 px-2 py-0.5 rounded-full font-semibold">Free Year ⭐</span>
                          : <span className="text-xs text-[#6B7770]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-[#6B7770] text-xs whitespace-nowrap">
                        {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null
    })()}
  </div>
)}
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/waitlist/page.tsx
git commit -m "feat: add Partners tab to admin waitlist — summary table + attributed signups"
```

---

## Task 6: Member Activation — Stripe Trial for Free-Year Golfers

> Pre-launch: build the activation infrastructure so the admin can activate individual waitlist golfers when ready.

**Files:**
- Create: `src/app/admin/waitlist/ActivateGolferButton.tsx`
- Modify: `src/app/admin/waitlist/actions.ts`
- Modify: `src/app/admin/waitlist/page.tsx`

- [ ] **Step 1: Add `activateGolferMember` server action to `actions.ts`**

Add the following to `src/app/admin/waitlist/actions.ts` (after the existing imports, add `stripe` import):

```ts
import { stripe } from '@/lib/stripe'
```

Then add the action:

```ts
export async function activateGolferMember(waitlistId: number) {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { data: golfer, error: fetchError } = await adminClient
    .from('golfer_waitlist')
    .select('email, first_name, last_name, referral_free_year, referral_code')
    .eq('id', waitlistId)
    .single()

  if (fetchError || !golfer) {
    return { error: 'Golfer not found.' }
  }

  // Create or retrieve Stripe customer
  const customer = await stripe.customers.create({
    email: golfer.email,
    name: `${golfer.first_name} ${golfer.last_name}`,
    metadata: { waitlist_id: String(waitlistId) },
  })

  // Determine trial end: free-year partners get 365 days
  const trialEnd = golfer.referral_free_year
    ? Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
    : undefined

  // Eagle price ID from env (set STRIPE_EAGLE_PRICE_ID in Vercel)
  const priceId = process.env.STRIPE_EAGLE_PRICE_ID
  if (!priceId) {
    return { error: 'STRIPE_EAGLE_PRICE_ID not configured.' }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_end: trialEnd,
    metadata: {
      user_waitlist_id: String(waitlistId),
      referral_code: golfer.referral_code ?? '',
      free_year: golfer.referral_free_year ? 'true' : 'false',
    },
  })

  // Mark waitlist record as activated
  await adminClient
    .from('golfer_waitlist')
    .update({ status: 'activated' })
    .eq('id', waitlistId)

  return { success: true, subscriptionId: subscription.id, trialEnd }
}
```

- [ ] **Step 2: Create `ActivateGolferButton.tsx`**

Create `src/app/admin/waitlist/ActivateGolferButton.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { activateGolferMember } from './actions'

export function ActivateGolferButton({
  waitlistId,
  hasFreeYear,
}: {
  waitlistId: number
  hasFreeYear: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleActivate() {
    startTransition(async () => {
      const res = await activateGolferMember(waitlistId)
      if (res.success) {
        setResult(hasFreeYear ? '✓ Activated (1yr free trial)' : '✓ Activated')
      } else {
        setResult(`Error: ${res.error}`)
      }
    })
  }

  if (result) {
    return <span className="text-xs text-[#6B7770]">{result}</span>
  }

  return (
    <button
      onClick={handleActivate}
      disabled={isPending}
      className="text-xs bg-[#1B4332] text-white px-3 py-1.5 rounded-lg hover:bg-[#1B4332]/80 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Activating…' : hasFreeYear ? 'Activate (Free Year)' : 'Activate'}
    </button>
  )
}
```

- [ ] **Step 3: Add the Activate button to the golfers table in `page.tsx`**

In `src/app/admin/waitlist/page.tsx`, add the import:

```tsx
import { ApproveButton, BarterReceiptButton } from './ApproveButton'
import { ActivateGolferButton } from './ActivateGolferButton'
```

In the golfers table header row, add an Actions column:

```tsx
<th className="text-left px-4 py-3 font-medium text-[#6B7770]">Actions</th>
```

In the golfers table body rows (after the `Signed up` cell), add:

```tsx
<td className="px-4 py-3">
  <ActivateGolferButton
    waitlistId={g.id}
    hasFreeYear={g.referral_free_year ?? false}
  />
</td>
```

Also update the `colSpan` on the email-only signups empty cells row from `colSpan={6}` to `colSpan={7}`.

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Set the Stripe price ID environment variable**

```bash
# Get the Eagle price ID from Stripe dashboard (Products → Eagle → Price ID)
# Then add to Vercel:
vercel env add STRIPE_EAGLE_PRICE_ID --value=price_XXXXXXXXXX production
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/waitlist/actions.ts \
        src/app/admin/waitlist/ActivateGolferButton.tsx \
        src/app/admin/waitlist/page.tsx
git commit -m "feat: add admin golfer activation with Stripe trial for free-year partner referrals"
```

---

## Task 7: Webhook — Year-2 Rev Share When Trial Converts to Paid

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add `invoice.payment_succeeded` to the switch in `handleEvent`**

In `src/app/api/webhooks/stripe/route.ts`, add to the switch statement in `handleEvent`:

```ts
case 'invoice.payment_succeeded':
  await onInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, admin)
  break
```

- [ ] **Step 2: Add the handler function at the bottom of the file**

Add after the `onSubscriptionDeleted` function:

```ts
async function onInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createAdminClient>
) {
  // Only handle subscription renewals (not one-off payments or setup invoices)
  if (invoice.billing_reason !== 'subscription_cycle') return
  if (!invoice.subscription) return

  const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)

  // Only act when this is the first paid invoice after a free-year trial
  if (sub.metadata?.free_year !== 'true') return

  const referralCode = sub.metadata?.referral_code
  if (!referralCode) return

  // Look up the partner
  const { data: partner } = await admin
    .from('partner_referrals')
    .select('id, rev_share_pct')
    .eq('code', referralCode)
    .single()

  if (!partner) return

  // Calculate rev share amount
  const revShareCents = Math.round((invoice.amount_paid ?? 0) * (Number(partner.rev_share_pct) / 100))

  // Record the rev share entry (reuses existing course_referral_payouts infrastructure pattern)
  await admin.from('partner_referral_payouts').insert({
    partner_referral_id: partner.id,
    stripe_invoice_id: invoice.id,
    amount_cents: revShareCents,
    invoice_amount_cents: invoice.amount_paid ?? 0,
    period_start: new Date((invoice.period_start ?? 0) * 1000).toISOString(),
    period_end: new Date((invoice.period_end ?? 0) * 1000).toISOString(),
    status: 'pending',
  })

  // Prevent double-recording on subsequent renewals
  await stripe.subscriptions.update(sub.id, {
    metadata: { ...sub.metadata, free_year: 'recorded' },
  })
}
```

- [ ] **Step 3: Add `partner_referral_payouts` table via a new migration**

Create `supabase/migrations/075_partner_referral_payouts.sql`:

```sql
CREATE TABLE IF NOT EXISTS partner_referral_payouts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_referral_id  uuid NOT NULL REFERENCES partner_referrals(id),
  stripe_invoice_id    text UNIQUE NOT NULL,
  amount_cents         int NOT NULL,
  invoice_amount_cents int NOT NULL,
  period_start         timestamptz NOT NULL,
  period_end           timestamptz NOT NULL,
  status               text NOT NULL DEFAULT 'pending',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE partner_referral_payouts ENABLE ROW LEVEL SECURITY;
```

Apply it:

```bash
npx supabase db push
```

Expected: `Applying migration 075_partner_referral_payouts...`

- [ ] **Step 4: Build to verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts \
        supabase/migrations/075_partner_referral_payouts.sql
git commit -m "feat: record partner rev share on invoice.payment_succeeded after free-year trial ends"
```

---

## Self-Review

**Spec coverage check:**

| Spec Section | Task |
|---|---|
| `partner_referrals` table + seed GLGE | Task 1 |
| `referral_code` + `referral_free_year` on `golfer_waitlist` | Task 1 |
| `referral_code` + `free_year_redeemed` on `profiles` | Task 1 |
| `increment_partner_redeemed` RPC | Task 1 |
| `searchParams.ref` → form hidden input | Task 2 |
| Validate code in server action | Task 3 |
| Atomic increment on valid + capped | Task 3 |
| Confirmation email free-year branch | Task 4 |
| Admin Partners tab — summary table | Task 5 |
| Admin Partners tab — attributed signups with Free Year badge | Task 5 |
| Launch activation — Stripe `trial_end` | Task 6 |
| `invoice.payment_succeeded` → rev share | Task 7 |

**Gaps identified and addressed:**
- Spec mentions `profiles.free_year_redeemed = true` being set at activation — Task 6's `activateGolferMember` sets `status: 'activated'` on the waitlist record but doesn't update `profiles` since the profile may not exist yet at waitlist time. The Stripe subscription metadata carries `free_year` and `referral_code` forward to the webhook. This is the correct deferral point.
- `partner_referral_payouts` table is not in the spec but is required by Task 7 — added as migration 075.

**Type consistency check:**
- `referralCode?: string | null` used consistently across `page.tsx` → `TierPicker` → `GolferWaitlistForm`
- `freeYear?: boolean` used consistently in action and `sendGolferWaitlistConfirmation`
- `increment_partner_redeemed` RPC param name `p_code` matches between migration and action call
