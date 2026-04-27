# Waitlist System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-track waitlist (golfers + courses) with a live Founding Partner counter, Resend emails, and an admin approval panel — all on top of the existing Supabase/Next.js 16 stack.

**Architecture:** New Supabase tables for `golfer_waitlist`, `course_waitlist`, and `founding_partner_counter`; server actions for inserts; a Postgres RPC function for the atomic Founding Partner approval transaction. The landing page fetches the live counter via a server component. The existing Supabase-auth-protected `/admin` layout gains a new `/admin/waitlist` page.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), Supabase (Postgres + JS client), Resend, Tailwind CSS v4, TypeScript.

---

## Context for the executing agent

- **Database client:** Use `createClient()` from `@/lib/supabase/server` (already wraps cookie handling). For admin ops (bypassing RLS), use `createAdminClient()` from `@/lib/supabase/admin`. Never use raw `pg` or Neon — this project is on Supabase.
- **Auth / Admin gate:** `/admin` is already protected by `src/app/admin/layout.tsx`, which checks `user.email` against `['teeaheadgolf@gmail.com', 'nbarris11@gmail.com']`. No separate `ADMIN_PASSWORD` env var is needed.
- **Colors:** Follow existing codebase — `#1B4332` (primary green), `#E0A800` (gold), `#FAF7F2` (bg), `#1A1A1A` (text), `#6B7770` (muted).
- **Components:** `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter`, `Input`, `Label` are all in `@/components/ui/`.
- **Next.js version:** 16.2.4 — read `node_modules/next/dist/docs/` if anything seems off. The App Router and Server Actions work the same as Next.js 14/15 for this feature set.
- **No test framework exists.** Skip writing test files. Validate by running `npm run build` at the end.
- **Existing `waitlist` table:** Stays as-is (used by the existing admin dashboard stats). Don't drop it.

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/008_waitlist_v2.sql` |
| Modify | `src/app/page.tsx` |
| Create | `src/app/waitlist/golfer/page.tsx` |
| Create | `src/app/waitlist/golfer/confirmed/page.tsx` |
| Create | `src/app/waitlist/golfer/actions.ts` |
| Create | `src/app/waitlist/course/page.tsx` |
| Create | `src/app/waitlist/course/confirmed/page.tsx` |
| Create | `src/app/waitlist/course/actions.ts` |
| Modify | `src/lib/resend.ts` |
| Create | `src/app/admin/waitlist/page.tsx` |
| Create | `src/app/admin/waitlist/actions.ts` |
| Modify | `src/app/admin/layout.tsx` |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/008_waitlist_v2.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/008_waitlist_v2.sql`:

```sql
-- Golfer waitlist (replaces the simple `waitlist` table for new signups)
create table if not exists public.golfer_waitlist (
  id           serial primary key,
  email        varchar(255) not null unique,
  first_name   varchar(100),
  last_name    varchar(100),
  zip_code     varchar(10),
  home_course  varchar(255),
  rounds_per_year    varchar(20),
  current_membership varchar(50),
  interested_tier    varchar(20),
  referral_source    varchar(100),
  position     integer,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.golfer_waitlist enable row level security;

drop policy if exists "Anyone can join golfer waitlist" on public.golfer_waitlist;
create policy "Anyone can join golfer waitlist"
  on public.golfer_waitlist for insert with check (true);

-- Course waitlist
create table if not exists public.course_waitlist (
  id                     serial primary key,
  course_name            varchar(255) not null,
  contact_name           varchar(255) not null,
  contact_role           varchar(100),
  email                  varchar(255) not null unique,
  phone                  varchar(20),
  city                   varchar(100),
  state                  varchar(2),
  num_holes              integer,
  annual_rounds          integer,
  current_software       varchar(100),
  on_golfnow             boolean,
  estimated_barter_cost  integer,
  biggest_frustration    text,
  is_founding_partner    boolean not null default false,
  founding_partner_number integer,
  status                 varchar(20) not null default 'pending',
  notes                  text,
  created_at             timestamptz not null default now(),
  approved_at            timestamptz
);

alter table public.course_waitlist enable row level security;

drop policy if exists "Anyone can join course waitlist" on public.course_waitlist;
create policy "Anyone can join course waitlist"
  on public.course_waitlist for insert with check (true);

-- Founding partner counter (single-row)
create table if not exists public.founding_partner_counter (
  id    integer primary key default 1,
  count integer not null default 0,
  cap   integer not null default 10,
  constraint single_row check (id = 1)
);

insert into public.founding_partner_counter (id, count, cap)
  values (1, 0, 10)
  on conflict (id) do nothing;

-- Atomic Founding Partner approval function (called via supabase.rpc)
-- Uses advisory lock to prevent race conditions without FOR UPDATE on this Supabase plan tier.
create or replace function public.approve_founding_partner(p_course_id integer)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_cap   integer;
  v_new   integer;
begin
  -- Lock the counter row for this transaction
  perform pg_advisory_xact_lock(1234567890);

  select count, cap into v_count, v_cap
  from public.founding_partner_counter
  where id = 1;

  if v_count >= v_cap then
    return jsonb_build_object('error', 'Founding Partner cap reached');
  end if;

  v_new := v_count + 1;

  update public.founding_partner_counter set count = v_new where id = 1;

  update public.course_waitlist
  set
    is_founding_partner     = true,
    founding_partner_number = v_new,
    status                  = 'approved',
    approved_at             = now()
  where id = p_course_id;

  return jsonb_build_object('founding_partner_number', v_new);
end;
$$;
```

- [ ] **Step 2: Apply the migration to Supabase**

Run in terminal:
```bash
npx supabase db push
```

If Supabase CLI is not linked, run:
```bash
npx supabase login
npx supabase link
npx supabase db push
```

Expected: Migration applies without errors. Verify in Supabase dashboard that all three tables and the `approve_founding_partner` function exist.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/008_waitlist_v2.sql
git commit -m "feat: add golfer/course waitlist tables and founding partner RPC"
```

---

## Task 2: Update Landing Page

**Files:**
- Modify: `src/app/page.tsx`

The goal is to replace the existing hero CTA section and add two new sections below the fold. Do **not** remove the pricing section or GolfNow comparison table — just replace the hero text/CTAs and add new sections.

- [ ] **Step 1: Add a server function to fetch the founding partner count**

At the top of `src/app/page.tsx`, after the imports, add a server function (this is a Server Component, so async is fine):

```tsx
import { createClient } from '@/lib/supabase/server'
```

Then update `HomePage` to be `async` and fetch the counter:

```tsx
export default async function HomePage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()
  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)
  // ... rest of component
```

- [ ] **Step 2: Replace the hero section**

Replace the entire `{/* ── Hero ──────────────────────────────────────── */}` block (lines 38–80 in the original) with:

```tsx
{/* ── Hero ──────────────────────────────────────────────── */}
<section className="bg-[#FAF7F2] px-6 py-24 text-center">
  <div className="max-w-3xl mx-auto space-y-8">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 bg-white border border-[#1B4332]/20 rounded-full px-4 py-1.5">
      <span className="size-2 rounded-full bg-[#1B4332] animate-pulse" />
      <span className="text-sm font-medium text-[#1B4332]">Coming soon to Metro Detroit</span>
    </div>

    <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] leading-tight tracking-tight">
      The Local-First{' '}
      <span className="text-[#1B4332]">Golf Loyalty Network</span>
    </h1>

    <p className="text-xl text-[#6B7770] leading-relaxed max-w-2xl mx-auto">
      Free software for courses. Real loyalty for golfers. Zero booking fees, always.
    </p>

    {/* Dual CTAs */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
      <Link
        href="/waitlist/golfer"
        className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-7 py-3 text-base font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
      >
        ⛳ I&apos;m a Golfer — Join the Waitlist
      </Link>
      <Link
        href="/waitlist/course"
        className="inline-flex flex-col items-center justify-center rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-7 py-3 text-base font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
      >
        <span>I Run a Course — Claim a Founding Spot</span>
        <span className="text-xs font-normal text-[#6B7770] mt-0.5">
          {spotsRemaining > 0
            ? `${spotsRemaining} of 10 spots remaining`
            : 'All Founding spots claimed — join the Core waitlist'}
        </span>
      </Link>
    </div>

    <p className="text-sm text-[#6B7770]">No credit card required · Metro Detroit launch</p>
  </div>
</section>
```

- [ ] **Step 3: Add a below-the-fold two-column value prop section**

Insert this **after** the hero section and **before** the "How It Works" section:

```tsx
{/* ── Two-Column Value Props ──────────────────────────────── */}
<section className="px-6 py-20 bg-white">
  <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

    {/* Golfer column */}
    <div className="space-y-6">
      <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full">
        For Golfers
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
        Eagle beats GolfPass+ on every metric — for $40 less.
      </h2>
      <div className="overflow-x-auto rounded-xl ring-1 ring-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-[#FAF7F2]">
              <th className="text-left px-4 py-3 font-medium">Perk</th>
              <th className="text-center px-4 py-3 font-medium text-[#FAF7F2]/70">GolfPass+ $119</th>
              <th className="text-center px-4 py-3 font-medium">Eagle $79</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {[
              ['Monthly credits', '$10/mo', '$15/mo'],
              ['Free rounds/yr', '0', '2'],
              ['Booking fee waiver', '12×/yr', 'Always'],
              ['Points multiplier', '1×', '2×'],
              ['Priority booking', 'None', '48hr early'],
              ['Guest passes', 'None', '12/yr'],
              ['Green fee discount', 'None', '10% off'],
              ['Birthday credit', 'None', '$25'],
            ].map(([perk, them, us]) => (
              <tr key={perk} className="even:bg-[#FAF7F2]">
                <td className="px-4 py-3 font-medium text-[#1A1A1A]">{perk}</td>
                <td className="px-4 py-3 text-center text-[#6B7770]">{them}</td>
                <td className="px-4 py-3 text-center font-semibold text-[#1B4332]">{us}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/waitlist/golfer"
        className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-6 py-3 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
      >
        Join the Golfer Waitlist →
      </Link>
    </div>

    {/* Course column */}
    <div className="space-y-6">
      <div className="inline-block bg-[#E0A800]/20 text-[#8B6F00] text-sm font-semibold px-3 py-1 rounded-full">
        For Courses — {spotsRemaining} of 10 Founding Spots Left
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
        GolfNow costs you ~$94,500/year in barter. We charge $0.
      </h2>
      <div className="bg-[#FAF7F2] rounded-xl p-6 space-y-4 ring-1 ring-black/5">
        <p className="text-[#1A1A1A] text-sm leading-relaxed">
          GolfNow takes 2 tee times per day in barter at your rack rate.
          At $175/round × 2 slots × 300 days: <strong className="text-[#1A1A1A]">$105,000/year</strong> in lost revenue.
        </p>
        <p className="text-[#1A1A1A] text-sm leading-relaxed">
          TeeAhead charges <strong className="text-[#1B4332]">$0</strong> for the first 10 Founding Partner courses — free for life.
          Course #11 onward pays $249/mo.
        </p>
        <p className="text-sm text-[#6B7770] italic">
          The only ask: tell your golfers about the Tee Ahead membership at booking.
        </p>
      </div>
      <Link
        href="/waitlist/course"
        className="inline-flex flex-col items-start rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
      >
        Claim a Founding Partner Spot →
        <span className="text-xs font-normal text-[#6B7770] mt-0.5">
          {spotsRemaining > 0 ? `${spotsRemaining} of 10 spots remaining` : 'Join the Core waitlist — $249/mo'}
        </span>
      </Link>
    </div>

  </div>
</section>
```

- [ ] **Step 4: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: Compiles successfully. Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update landing page with dual waitlist CTAs and founding counter"
```

---

## Task 3: Golfer Waitlist Server Action

**Files:**
- Create: `src/app/waitlist/golfer/actions.ts`

- [ ] **Step 1: Create the server action file**

Create `src/app/waitlist/golfer/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendGolferWaitlistConfirmation } from '@/lib/resend'

export async function joinGolferWaitlist(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName = (formData.get('last_name') as string)?.trim()
  const zipCode = (formData.get('zip_code') as string)?.trim()
  const homeCourse = (formData.get('home_course') as string)?.trim() || null
  const roundsPerYear = formData.get('rounds_per_year') as string
  const currentMembership = formData.get('current_membership') as string
  const interestedTier = formData.get('interested_tier') as string
  const referralSource = (formData.get('referral_source') as string)?.trim() || null

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!firstName || !lastName) {
    return { error: 'First and last name are required.' }
  }
  if (!zipCode) {
    return { error: 'ZIP code is required.' }
  }

  const supabase = await createClient()

  // Count existing signups to assign position
  const { count } = await supabase
    .from('golfer_waitlist')
    .select('*', { count: 'exact', head: true })

  const position = (count ?? 0) + 1

  const { error } = await supabase.from('golfer_waitlist').insert({
    email,
    first_name: firstName,
    last_name: lastName,
    zip_code: zipCode,
    home_course: homeCourse,
    rounds_per_year: roundsPerYear || null,
    current_membership: currentMembership || null,
    interested_tier: interestedTier || null,
    referral_source: referralSource,
    position,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: "You're already on the list!" }
    }
    console.error('[golfer-waitlist]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  await sendGolferWaitlistConfirmation({ email, firstName, position })

  return { success: true, position }
}
```

- [ ] **Step 2: Verify the action is typed correctly**

```bash
npx tsc --noEmit
```

Expected: No errors for this file (the `sendGolferWaitlistConfirmation` function doesn't exist yet — that's fine, it will be implemented in Task 5. The type error for the missing function is expected until Task 5 is complete).

---

## Task 4: Golfer Waitlist Page + Confirmation Page

**Files:**
- Create: `src/app/waitlist/golfer/page.tsx`
- Create: `src/app/waitlist/golfer/confirmed/page.tsx`

- [ ] **Step 1: Create the golfer waitlist page**

Create `src/app/waitlist/golfer/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinGolferWaitlist } from './actions'

export const metadata = {
  title: 'Join the Golfer Waitlist — TeeAhead',
  description: 'Get early access to TeeAhead, the local-first golf loyalty network coming to Metro Detroit.',
}

export default function GolferWaitlistPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await joinGolferWaitlist(formData)
    if (result.success) {
      redirect(`/waitlist/golfer/confirmed?position=${result.position}`)
    }
    // Errors bubble back via the redirect not happening — the form handles them client-side
    // For simplicity, redirect on success only; client-side shows errors
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="TeeAhead" width={140} height={42} className="h-9 w-auto" priority />
          </Link>
          <Link href="/" className="text-sm text-[#6B7770] hover:text-[#1B4332] transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="space-y-2 mb-10">
          <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full mb-2">
            ⛳ Golfer Waitlist
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Join the TeeAhead Waitlist</h1>
          <p className="text-[#6B7770]">
            Be first in line when we launch in Metro Detroit. No credit card, no commitment.
          </p>
        </div>

        <GolferWaitlistForm />
      </main>
    </div>
  )
}
```

Note: Since we need client-side error handling, the form must be a client component. Create `src/app/waitlist/golfer/GolferWaitlistForm.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinGolferWaitlist } from './actions'

export function GolferWaitlistForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinGolferWaitlist(formData)
      if (result.success) {
        router.push(`/waitlist/golfer/confirmed?position=${result.position}`)
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name *</Label>
          <Input id="first_name" name="first_name" required disabled={isPending} placeholder="Jack" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name *</Label>
          <Input id="last_name" name="last_name" required disabled={isPending} placeholder="Nicklaus" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address *</Label>
        <Input id="email" name="email" type="email" required disabled={isPending} placeholder="jack@example.com" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="zip_code">ZIP code *</Label>
        <Input id="zip_code" name="zip_code" required disabled={isPending} placeholder="48009" maxLength={10} />
        <p className="text-xs text-[#6B7770]">We use this to prioritize by metro area.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="home_course">Home course <span className="text-[#6B7770] font-normal">(optional)</span></Label>
        <Input id="home_course" name="home_course" disabled={isPending} placeholder="Oakland Hills, Detroit Golf Club, etc." />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rounds_per_year">Rounds per year</Label>
        <select
          id="rounds_per_year"
          name="rounds_per_year"
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select…</option>
          <option value="under_10">Under 10</option>
          <option value="10_20">10–20</option>
          <option value="20_40">20–40</option>
          <option value="40_plus">40+</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="current_membership">Current membership</Label>
        <select
          id="current_membership"
          name="current_membership"
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select…</option>
          <option value="none">None</option>
          <option value="golfpass_plus">GolfPass+</option>
          <option value="troon_access">Troon Access</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Which tier interests you most?</Label>
        <div className="space-y-2">
          {[
            { value: 'fairway', label: 'Fairway — Free forever' },
            { value: 'eagle', label: 'Eagle — $79/yr (most popular)' },
            { value: 'ace', label: 'Ace — $149/yr (all-in)' },
            { value: 'not_sure', label: "Not sure yet" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="interested_tier"
                value={value}
                disabled={isPending}
                className="accent-[#1B4332]"
              />
              <span className="text-sm text-[#1A1A1A]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referral_source">Where did you hear about us? <span className="text-[#6B7770] font-normal">(optional)</span></Label>
        <Input id="referral_source" name="referral_source" disabled={isPending} placeholder="Instagram, friend, golf course, etc." />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] font-semibold py-3"
      >
        {isPending ? 'Joining…' : 'Claim My Spot ⛳'}
      </Button>

      <p className="text-xs text-center text-[#6B7770]">
        No spam, ever. We&apos;ll only contact you about your waitlist status and the launch.
      </p>
    </form>
  )
}
```

Then update `src/app/waitlist/golfer/page.tsx` to import `GolferWaitlistForm` instead of defining it inline:

```tsx
import { GolferWaitlistForm } from './GolferWaitlistForm'
```

And remove the inline `handleSubmit` function from the page (the form handles it client-side now).

Final `page.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { GolferWaitlistForm } from './GolferWaitlistForm'

export const metadata = {
  title: 'Join the Golfer Waitlist — TeeAhead',
  description: 'Get early access to TeeAhead, the local-first golf loyalty network coming to Metro Detroit.',
}

export default function GolferWaitlistPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="TeeAhead" width={140} height={42} className="h-9 w-auto" priority />
          </Link>
          <Link href="/" className="text-sm text-[#6B7770] hover:text-[#1B4332] transition-colors">
            ← Back
          </Link>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="space-y-2 mb-10">
          <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full mb-2">
            ⛳ Golfer Waitlist
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Join the TeeAhead Waitlist</h1>
          <p className="text-[#6B7770]">
            Be first in line when we launch in Metro Detroit. No credit card, no commitment.
          </p>
        </div>
        <GolferWaitlistForm />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create the golfer confirmed page**

Create `src/app/waitlist/golfer/confirmed/page.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: "You're on the list — TeeAhead",
}

export default function GolferConfirmedPage({
  searchParams,
}: {
  searchParams: { position?: string }
}) {
  const position = searchParams.position ? parseInt(searchParams.position, 10) : null

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⛳</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">
          {position ? `You're #${position} on the list!` : "You're on the list!"}
        </h1>
        <p className="text-[#6B7770] leading-relaxed">
          We&apos;ll email you when TeeAhead launches in Metro Detroit.
          {position && position <= 100 && (
            <> You&apos;re in the first {position <= 10 ? '10' : position <= 50 ? '50' : '100'} — early access guaranteed.</>
          )}
        </p>

        <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-left space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">While you wait:</p>
          <ul className="text-sm text-[#6B7770] space-y-2">
            <li>• Know a course that should partner with us? Send them to <strong className="text-[#1A1A1A]">teeahead.com/waitlist/course</strong></li>
            <li>• Share your spot with golf friends — more local golfers = more partner courses</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-6 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run build to verify**

```bash
npm run build
```

Expected: No TypeScript errors for these files (there may still be an error for the missing `sendGolferWaitlistConfirmation` — that's resolved in Task 5).

- [ ] **Step 4: Commit**

```bash
git add src/app/waitlist/golfer/
git commit -m "feat: add golfer waitlist form and confirmation page"
```

---

## Task 5: Course Waitlist Server Action

**Files:**
- Create: `src/app/waitlist/course/actions.ts`

- [ ] **Step 1: Create the course server action**

Create `src/app/waitlist/course/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { sendCourseWaitlistConfirmation, sendCourseAdminAlert } from '@/lib/resend'

export async function joinCourseWaitlist(formData: FormData) {
  const courseName = (formData.get('course_name') as string)?.trim()
  const contactName = (formData.get('contact_name') as string)?.trim()
  const contactRole = (formData.get('contact_role') as string)?.trim() || null
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const city = (formData.get('city') as string)?.trim() || null
  const state = (formData.get('state') as string)?.trim() || null
  const numHoles = formData.get('num_holes') ? parseInt(formData.get('num_holes') as string, 10) : null
  const annualRounds = formData.get('annual_rounds') ? parseInt(formData.get('annual_rounds') as string, 10) : null
  const currentSoftware = (formData.get('current_software') as string) || null
  const onGolfnow = formData.get('on_golfnow') === 'yes'
  const avgGreenFee = formData.get('avg_green_fee') ? parseInt(formData.get('avg_green_fee') as string, 10) : null
  const biggestFrustration = (formData.get('biggest_frustration') as string)?.trim() || null

  if (!courseName || !contactName || !email || !email.includes('@')) {
    return { error: 'Course name, contact name, and a valid email are required.' }
  }

  // Estimate barter cost if on GolfNow: 2 tee times/day × avg green fee × 300 days
  const estimatedBarterCost =
    onGolfnow && avgGreenFee ? 2 * avgGreenFee * 300 : null

  const supabase = await createClient()

  const { error } = await supabase.from('course_waitlist').insert({
    course_name: courseName,
    contact_name: contactName,
    contact_role: contactRole,
    email,
    phone,
    city,
    state,
    num_holes: numHoles,
    annual_rounds: annualRounds,
    current_software: currentSoftware,
    on_golfnow: onGolfnow,
    estimated_barter_cost: estimatedBarterCost,
    biggest_frustration: biggestFrustration,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: "We already have an application from this email address." }
    }
    console.error('[course-waitlist]', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  await Promise.all([
    sendCourseWaitlistConfirmation({ email, contactName, courseName }),
    sendCourseAdminAlert({ courseName, contactName, contactRole, email, phone, city, state, onGolfnow, estimatedBarterCost, biggestFrustration }),
  ])

  return { success: true }
}
```

---

## Task 6: Course Waitlist Page + Confirmation Page

**Files:**
- Create: `src/app/waitlist/course/page.tsx`
- Create: `src/app/waitlist/course/CourseWaitlistForm.tsx`
- Create: `src/app/waitlist/course/confirmed/page.tsx`

- [ ] **Step 1: Create the course waitlist client form component**

Create `src/app/waitlist/course/CourseWaitlistForm.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinCourseWaitlist } from './actions'

export function CourseWaitlistForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [onGolfnow, setOnGolfnow] = useState<boolean | null>(null)
  const [avgGreenFee, setAvgGreenFee] = useState<string>('')

  const estimatedBarter =
    onGolfnow && avgGreenFee ? 2 * parseInt(avgGreenFee, 10) * 300 : null

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await joinCourseWaitlist(formData)
      if (result.success) {
        router.push('/waitlist/course/confirmed')
      } else {
        setError(result.error ?? 'Something went wrong.')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="course_name">Course name *</Label>
        <Input id="course_name" name="course_name" required disabled={isPending} placeholder="Oakland Hills Country Club" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name">Your name *</Label>
          <Input id="contact_name" name="contact_name" required disabled={isPending} placeholder="Alex Johnson" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_role">Your role</Label>
          <select
            id="contact_role"
            name="contact_role"
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select…</option>
            <option value="owner">Owner</option>
            <option value="gm">General Manager</option>
            <option value="director_of_golf">Director of Golf</option>
            <option value="pro">Head Pro</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required disabled={isPending} placeholder="alex@course.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" disabled={isPending} placeholder="(248) 555-0100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" disabled={isPending} placeholder="Birmingham" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" disabled={isPending} placeholder="MI" maxLength={2} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="num_holes">Number of holes</Label>
          <select
            id="num_holes"
            name="num_holes"
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select…</option>
            <option value="9">9</option>
            <option value="18">18</option>
            <option value="27">27</option>
            <option value="36">36</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="annual_rounds">Estimated annual rounds</Label>
          <Input id="annual_rounds" name="annual_rounds" type="number" min="0" disabled={isPending} placeholder="15000" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="current_software">Current tee sheet software</Label>
        <select
          id="current_software"
          name="current_software"
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Select…</option>
          <option value="golfnow">GolfNow</option>
          <option value="foreup">foreUP</option>
          <option value="lightspeed">Lightspeed</option>
          <option value="club_prophet">Club Prophet</option>
          <option value="other">Other</option>
          <option value="none">None</option>
        </select>
      </div>

      <div className="space-y-3 bg-[#FAF7F2] rounded-xl p-4 ring-1 ring-black/5">
        <Label>Are you currently on GolfNow?</Label>
        <div className="flex gap-6">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="on_golfnow"
                value={value}
                disabled={isPending}
                onChange={() => setOnGolfnow(value === 'yes')}
                className="accent-[#1B4332]"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        {onGolfnow && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="avg_green_fee">Average green fee (rack rate, $)</Label>
            <Input
              id="avg_green_fee"
              name="avg_green_fee"
              type="number"
              min="0"
              disabled={isPending}
              placeholder="175"
              value={avgGreenFee}
              onChange={(e) => setAvgGreenFee(e.target.value)}
            />
            {estimatedBarter && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm">
                <p className="font-semibold text-red-700">
                  Estimated annual barter cost: ${estimatedBarter.toLocaleString()}
                </p>
                <p className="text-red-600 text-xs mt-1">
                  (2 tee times/day × ${avgGreenFee} rack rate × 300 operating days)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="biggest_frustration">
          What&apos;s your biggest frustration with your current setup?{' '}
          <span className="text-[#6B7770] font-normal">(optional)</span>
        </Label>
        <textarea
          id="biggest_frustration"
          name="biggest_frustration"
          disabled={isPending}
          rows={3}
          placeholder="Barter costs, lack of customer data, booking fees eating into revenue…"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1B4332] hover:bg-[#1B4332]/90 text-[#FAF7F2] font-semibold py-3"
      >
        {isPending ? 'Submitting…' : 'Submit Founding Partner Application'}
      </Button>

      <p className="text-xs text-center text-[#6B7770]">
        Founding Partner status is subject to review. We&apos;ll be in touch within 48 hours.
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Create the course waitlist page**

Create `src/app/waitlist/course/page.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CourseWaitlistForm } from './CourseWaitlistForm'

export const metadata = {
  title: 'Founding Partner Application — TeeAhead',
  description: 'Claim one of 10 Founding Partner spots. Free platform for life in exchange for promoting Tee Ahead to your golfers.',
}

export default async function CourseWaitlistPage() {
  const supabase = await createClient()
  const { data: counter } = await supabase
    .from('founding_partner_counter')
    .select('count, cap')
    .single()

  const spotsRemaining = (counter?.cap ?? 10) - (counter?.count ?? 0)
  const allClaimed = spotsRemaining <= 0

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="bg-[#FAF7F2]/95 backdrop-blur border-b border-black/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="TeeAhead" width={140} height={42} className="h-9 w-auto" priority />
          </Link>
          <Link href="/" className="text-sm text-[#6B7770] hover:text-[#1B4332] transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="space-y-2 mb-6">
          <div className={`inline-block text-sm font-semibold px-3 py-1 rounded-full mb-2 ${
            allClaimed
              ? 'bg-gray-100 text-gray-600'
              : 'bg-[#E0A800]/20 text-[#8B6F00]'
          }`}>
            {allClaimed ? 'All Founding Spots Claimed' : `${spotsRemaining} of 10 Founding Partner spots remaining`}
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            {allClaimed ? 'Join the Course Waitlist' : 'Claim a Founding Partner Spot'}
          </h1>
        </div>

        <div className="bg-white rounded-xl p-5 ring-1 ring-[#E0A800]/30 mb-8 space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {allClaimed ? 'Core Partner — $249/month' : 'Founding Partners get the full platform free for life.'}
          </p>
          <p className="text-sm text-[#6B7770] leading-relaxed">
            {allClaimed
              ? 'All 10 Founding Partner spots have been claimed. You can still join the waitlist as a Core Partner at $249/month — same software, no barter.'
              : 'The only obligation: promote the Tee Ahead membership to your golfers at the point of booking, and allow us to feature your course in our marketing. That\'s it. Course #11 onward pays $249/month.'}
          </p>
        </div>

        <CourseWaitlistForm />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create the course confirmed page**

Create `src/app/waitlist/course/confirmed/page.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Application Received — TeeAhead',
}

export default function CourseConfirmedPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🏌️</div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Application received!</h1>
        <p className="text-[#6B7770] leading-relaxed">
          Neil or Billy will be in touch within 48 hours to walk you through next steps.
          We&apos;ll confirm your Founding Partner status and get you set up.
        </p>

        <div className="bg-white rounded-xl p-6 ring-1 ring-black/5 text-left space-y-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">What happens next:</p>
          <ol className="text-sm text-[#6B7770] space-y-2 list-decimal list-inside">
            <li>We review your application (usually same day)</li>
            <li>Neil or Billy calls to confirm fit and answer questions</li>
            <li>We send your Founding Partner confirmation email</li>
            <li>Onboarding call to get your tee sheet connected</li>
          </ol>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-[#1B4332] px-6 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run build to verify**

```bash
npm run build
```

Expected: No new type errors (email functions still unresolved until Task 7).

- [ ] **Step 5: Commit**

```bash
git add src/app/waitlist/course/
git commit -m "feat: add course waitlist form and confirmation page"
```

---

## Task 7: Email Functions

**Files:**
- Modify: `src/lib/resend.ts`

- [ ] **Step 1: Add three new email functions to resend.ts**

Append to `src/lib/resend.ts` (after the existing `sendWelcomeEmail` function):

```typescript
export async function sendGolferWaitlistConfirmation({
  email,
  firstName,
  position,
}: {
  email: string
  firstName: string
  position: number
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping golfer waitlist email')
    return
  }

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: `You're #${position} on the TeeAhead waitlist ⛳`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">You're #${position} on the list ⛳</h2>
        <p>Hey ${firstName},</p>
        <p>You're officially on the TeeAhead waitlist. We're launching in Metro Detroit and you'll be
        among the first to know when we go live.</p>

        <p>Here's what you're waiting for:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>Zero booking fees at partner courses — forever</li>
          <li>Eagle membership ($79/yr) beats GolfPass+ ($119/yr) on every single metric</li>
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

export async function sendCourseWaitlistConfirmation({
  email,
  contactName,
  courseName,
}: {
  email: string
  contactName: string
  courseName: string
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping course waitlist email')
    return
  }

  const firstName = contactName.split(' ')[0]

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: `${courseName} — Founding Partner application received`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Application received 🏌️</h2>
        <p>Hey ${firstName},</p>
        <p>We received your Founding Partner application for <strong>${courseName}</strong>.
        Neil or Billy will be in touch within 48 hours to confirm your spot and walk you through
        what happens next.</p>

        <p>As a quick reminder, Founding Partners get:</p>
        <ul style="color: #6B7770; padding-left: 16px; line-height: 2;">
          <li>The full TeeAhead platform — free for life</li>
          <li>Direct tee sheet connection (we handle the tech)</li>
          <li>Featured placement in our marketing to Metro Detroit golfers</li>
        </ul>

        <p>The only ask: tell your golfers about the TeeAhead membership at booking.
        That's the whole deal.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
          Questions? Reply to this email or call Neil at (248) 555-0100.
        </p>
      </div>
    `,
  })
}

export async function sendCourseAdminAlert({
  courseName,
  contactName,
  contactRole,
  email,
  phone,
  city,
  state,
  onGolfnow,
  estimatedBarterCost,
  biggestFrustration,
}: {
  courseName: string
  contactName: string
  contactRole: string | null
  email: string
  phone: string | null
  city: string | null
  state: string | null
  onGolfnow: boolean
  estimatedBarterCost: number | null
  biggestFrustration: string | null
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping course admin alert')
    return
  }

  const barterLine = estimatedBarterCost
    ? `<p><strong>Est. annual GolfNow barter cost:</strong> $${estimatedBarterCost.toLocaleString()}</p>`
    : ''

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: ['neil@teeahead.com', 'billy@teeahead.com'],
    subject: `New course application: ${courseName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">New course waitlist application</h2>
        <p><strong>Course:</strong> ${courseName}</p>
        <p><strong>Contact:</strong> ${contactName}${contactRole ? ` (${contactRole})` : ''}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${city || state ? `<p><strong>Location:</strong> ${[city, state].filter(Boolean).join(', ')}</p>` : ''}
        <p><strong>On GolfNow:</strong> ${onGolfnow ? 'Yes' : 'No'}</p>
        ${barterLine}
        ${biggestFrustration ? `<p><strong>Biggest frustration:</strong><br /><em>${biggestFrustration}</em></p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p><a href="https://teeahead.com/admin/waitlist" style="color: #1B4332;">Review and approve in admin panel →</a></p>
      </div>
    `,
  })
}

export async function sendFoundingPartnerApproval({
  email,
  contactName,
  courseName,
  partnerNumber,
}: {
  email: string
  contactName: string
  courseName: string
  partnerNumber: number
}) {
  const client = getResend()
  if (!client) {
    console.log('[notify] Resend not configured — skipping founding partner email')
    return
  }

  const firstName = contactName.split(' ')[0]

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: email,
    subject: `Welcome, Founding Partner #${partnerNumber} of 10 — ${courseName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">Welcome, Founding Partner #${partnerNumber} of 10 ⛳</h2>
        <p>Hey ${firstName},</p>
        <p><strong>${courseName}</strong> is officially a TeeAhead Founding Partner.
        You're locked in free for life — no catches.</p>

        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600; color: #166534;">Your Founding Partner agreement (short version):</p>
          <ol style="color: #166534; padding-left: 20px; line-height: 2; margin: 8px 0 0;">
            <li>Promote the TeeAhead membership to your golfers at booking.</li>
            <li>Allow us to feature ${courseName} in our marketing materials.</li>
          </ol>
        </div>

        <p><strong>What happens next:</strong></p>
        <ol style="color: #6B7770; padding-left: 20px; line-height: 2;">
          <li>Neil will reach out within 24 hours to schedule your onboarding call.</li>
          <li>We connect your tee sheet (we handle all the tech).</li>
          <li>You go live — your golfers start earning Fairway Points immediately.</li>
        </ol>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">
          TeeAhead · Your home course, redone right.<br />
          Questions? Reply to this email directly.
        </p>
      </div>
    `,
  })
}
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: Clean build — all `sendX` imports across actions files now resolve.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat: add waitlist and founding partner email templates"
```

---

## Task 8: Admin Waitlist Panel

**Files:**
- Create: `src/app/admin/waitlist/page.tsx`
- Create: `src/app/admin/waitlist/actions.ts`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create the founding partner approval server action**

Create `src/app/admin/waitlist/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFoundingPartnerApproval } from '@/lib/resend'

const ADMIN_EMAILS = ['teeaheadgolf@gmail.com', 'nbarris11@gmail.com']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/login')
  }
}

export async function approveFoundingPartner(courseId: number) {
  await requireAdmin()

  const adminClient = createAdminClient()

  // Fetch course data before calling RPC (needed for email)
  const { data: course, error: fetchError } = await adminClient
    .from('course_waitlist')
    .select('course_name, contact_name, email')
    .eq('id', courseId)
    .single()

  if (fetchError || !course) {
    return { error: 'Course not found.' }
  }

  // Call the atomic Postgres function
  const { data, error } = await adminClient.rpc('approve_founding_partner', {
    p_course_id: courseId,
  })

  if (error) {
    console.error('[approve-founding-partner]', error)
    return { error: error.message ?? 'Failed to approve.' }
  }

  const result = data as { error?: string; founding_partner_number?: number }

  if (result.error) {
    return { error: result.error }
  }

  const partnerNumber = result.founding_partner_number!

  await sendFoundingPartnerApproval({
    email: course.email,
    contactName: course.contact_name,
    courseName: course.course_name,
    partnerNumber,
  })

  return { success: true, partnerNumber }
}

export async function rejectCourseApplication(courseId: number) {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('course_waitlist')
    .update({ status: 'rejected' })
    .eq('id', courseId)

  if (error) {
    return { error: 'Failed to reject.' }
  }

  return { success: true }
}
```

- [ ] **Step 2: Verify createAdminClient exists in src/lib/supabase/admin.ts**

Read `src/lib/supabase/admin.ts` to confirm the export name. If it exports a different function name (e.g., `createServiceClient`), update the import in the action above accordingly.

```bash
cat src/lib/supabase/admin.ts
```

Adjust the import if needed.

- [ ] **Step 3: Create the admin waitlist page**

Create `src/app/admin/waitlist/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ApproveButton } from './ApproveButton'

export const metadata = { title: 'Waitlist — Admin' }

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const tab = searchParams.tab === 'courses' ? 'courses' : 'golfers'

  const adminClient = createAdminClient()

  const [
    { data: golfers },
    { data: courses },
    { data: counter },
  ] = await Promise.all([
    adminClient
      .from('golfer_waitlist')
      .select('*')
      .order('created_at', { ascending: false }),
    adminClient
      .from('course_waitlist')
      .select('*')
      .order('created_at', { ascending: false }),
    adminClient
      .from('founding_partner_counter')
      .select('count, cap')
      .single(),
  ])

  const spotsUsed = counter?.count ?? 0
  const spotsCap = counter?.cap ?? 10

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Waitlist</h1>
          <p className="text-[#6B7770] text-sm mt-1">
            {golfers?.length ?? 0} golfers · {courses?.length ?? 0} courses · {spotsUsed}/{spotsCap} Founding spots filled
          </p>
        </div>
        <a
          href={`/admin/waitlist/export?type=${tab}`}
          className="text-sm text-[#1B4332] border border-[#1B4332]/30 rounded-lg px-3 py-1.5 hover:bg-[#1B4332]/5 transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white ring-1 ring-black/5 rounded-xl p-1 w-fit">
        {[
          { value: 'golfers', label: `Golfers (${golfers?.length ?? 0})` },
          { value: 'courses', label: `Courses (${courses?.length ?? 0})` },
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
      </div>

      {tab === 'golfers' && (
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">#</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">ZIP</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Rounds/yr</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Tier interest</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {golfers && golfers.length > 0 ? (
                  golfers.map((g: any) => (
                    <tr key={g.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-4 py-3 text-[#6B7770]">{g.position}</td>
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                        {g.first_name} {g.last_name}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">{g.email}</td>
                      <td className="px-4 py-3 text-[#6B7770]">{g.zip_code}</td>
                      <td className="px-4 py-3 text-[#6B7770]">{g.rounds_per_year ?? '—'}</td>
                      <td className="px-4 py-3 text-[#6B7770]">{g.interested_tier ?? '—'}</td>
                      <td className="px-4 py-3 text-[#6B7770] text-xs">
                        {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#6B7770]">
                      No golfer signups yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'courses' && (
        <div className="bg-white rounded-xl ring-1 ring-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7F2] border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">GolfNow?</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Barter est.</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6B7770]">Applied</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {courses && courses.length > 0 ? (
                  courses.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1A1A1A]">{c.course_name}</div>
                        {c.is_founding_partner && (
                          <div className="text-xs text-[#E0A800] font-semibold">
                            Founding Partner #{c.founding_partner_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">
                        {c.contact_name}
                        {c.contact_role && <span className="block text-xs">{c.contact_role}</span>}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">{c.email}</td>
                      <td className="px-4 py-3 text-[#6B7770]">
                        {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.on_golfnow ? '✓' : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#6B7770]">
                        {c.estimated_barter_cost
                          ? `$${c.estimated_barter_cost.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-[#6B7770] text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {c.status === 'pending' && (
                          <ApproveButton courseId={c.id} spotsRemaining={spotsCap - spotsUsed} />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[#6B7770]">
                      No course applications yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? 'bg-gray-50 text-gray-600'}`}>
      {status}
    </span>
  )
}
```

- [ ] **Step 4: Create the ApproveButton client component**

Create `src/app/admin/waitlist/ApproveButton.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveFoundingPartner, rejectCourseApplication } from './actions'

export function ApproveButton({
  courseId,
  spotsRemaining,
}: {
  courseId: number
  spotsRemaining: number
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    if (!confirm('Approve this course as a Founding Partner? This sends them a confirmation email.')) return
    setError(null)
    startTransition(async () => {
      const result = await approveFoundingPartner(courseId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to approve.')
      }
    })
  }

  function handleReject() {
    if (!confirm('Mark this application as rejected?')) return
    setError(null)
    startTransition(async () => {
      const result = await rejectCourseApplication(courseId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to reject.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleApprove}
        disabled={isPending || spotsRemaining <= 0}
        className="text-xs px-3 py-1.5 rounded-lg bg-[#1B4332] text-[#FAF7F2] font-medium hover:bg-[#1B4332]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Approving…' : spotsRemaining <= 0 ? 'Cap reached' : '✓ Approve FP'}
      </button>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Add Waitlist link to admin nav**

In `src/app/admin/layout.tsx`, add the Waitlist link to the `<nav>` inside the `<header>`. After the existing "Courses" link:

```tsx
<Link href="/admin/waitlist" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Waitlist</Link>
```

The nav block should look like:
```tsx
<nav className="hidden sm:flex items-center gap-4 text-sm">
  <Link href="/admin" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Dashboard</Link>
  <Link href="/admin/users" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Users</Link>
  <Link href="/admin/content" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Content</Link>
  <Link href="/admin/courses" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Courses</Link>
  <Link href="/admin/waitlist" className="text-[#FAF7F2]/80 hover:text-[#FAF7F2] transition-colors">Waitlist</Link>
</nav>
```

- [ ] **Step 6: Run final build**

```bash
npm run build
```

Expected: Clean build with zero TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/waitlist/ src/app/admin/layout.tsx
git commit -m "feat: add admin waitlist panel with founding partner approval"
```

---

## Task 9: CSV Export Route

The admin Waitlist page has an "Export CSV" link pointing to `/admin/waitlist/export?type=golfers|courses`. This is a simple API route.

**Files:**
- Create: `src/app/admin/waitlist/export/route.ts`

- [ ] **Step 1: Create the export route**

Create `src/app/admin/waitlist/export/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = ['teeaheadgolf@gmail.com', 'nbarris11@gmail.com']

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          const str = String(val).replace(/"/g, '""')
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str}"`
            : str
        })
        .join(',')
    ),
  ]
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'golfers'
  const adminClient = createAdminClient()

  let csv = ''
  let filename = ''

  if (type === 'courses') {
    const { data } = await adminClient
      .from('course_waitlist')
      .select('*')
      .order('created_at', { ascending: false })
    csv = toCSV((data ?? []) as Record<string, unknown>[])
    filename = 'mulligan-course-waitlist.csv'
  } else {
    const { data } = await adminClient
      .from('golfer_waitlist')
      .select('*')
      .order('position', { ascending: true })
    csv = toCSV((data ?? []) as Record<string, unknown>[])
    filename = 'mulligan-golfer-waitlist.csv'
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 2: Run final build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/waitlist/export/route.ts
git commit -m "feat: add CSV export for golfer and course waitlists"
```

---

## Final Verification

- [ ] **Run full build one final time**

```bash
npm run build
```

Expected: Zero errors, zero warnings about missing modules.

- [ ] **Smoke test locally**

```bash
npm run dev
```

Visit and verify:
1. `http://localhost:3000` — see new headline "The Local-First Golf Loyalty Network", two CTAs, founding counter shows "10 of 10 spots remaining"
2. `http://localhost:3000/waitlist/golfer` — fill out form, submit, land on confirmed page with position number
3. `http://localhost:3000/waitlist/course` — fill out form, toggle GolfNow to see barter calculator, submit, land on confirmed page
4. `http://localhost:3000/admin/waitlist` (must be logged in as neil or billy) — see Golfers and Courses tabs, Approve button on pending courses

- [ ] **Final commit**

```bash
git add -A
git commit -m "chore: final waitlist system integration"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✓ `golfer_waitlist`, `course_waitlist`, `founding_partner_counter` tables
- ✓ Atomic founding partner approval via Postgres RPC with advisory lock
- ✓ Landing page: new headline, dual CTAs, live counter, two-column comparison
- ✓ Golfer form: all 8 fields, position auto-assigned, redirect to confirmed
- ✓ Course form: all fields, GolfNow barter calculator, redirect to confirmed
- ✓ Do NOT auto-assign Founding Partner status on submit — manual admin approval only
- ✓ Alert email to neil@teeahead.com and billy@teeahead.com on course submit
- ✓ 3 email templates: golfer confirmation, course pending, founding partner approval
- ✓ Admin panel: Golfers table (sortable by position), Courses table with Approve/Reject
- ✓ Cap enforcement: Approve button disabled when `spotsRemaining <= 0`
- ✓ CSV export for both tables
- ✗ PostHog analytics — marked optional in spec, omitted

**Not built (out of scope per spec):** Stripe, booking platform, mobile app.
