# Homepage & Barter Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the homepage and `/barter` page to the approved "Premium Local / Story Arc" spec — Playfair Display headlines, dark green nav, restructured homepage sections, and a course-owner-focused barter page — then deploy to a new QA environment on Vercel before merging to production.

**Architecture:** All changes are confined to `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, and `src/components/BarterPage.tsx`. No new components, no DB schema changes, no routing changes. The QA environment is a separate Supabase project wired to Vercel's Preview deployment environment; every push to the `qa` branch auto-deploys a preview URL.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS 4, Supabase, Vercel, Vitest + Testing Library

---

## Task 0: Set Up QA Environment

**Files:**
- No code files — Vercel dashboard + Supabase dashboard + git

**Context:** Vercel auto-creates a preview URL for every non-`main` branch push. We create a `qa` branch and wire it to a fresh Supabase project so the preview has real data.

- [ ] **Step 1: Create a QA Supabase project**

  Go to [app.supabase.com](https://app.supabase.com) → New project. Name it `teeahead-qa`. Choose the same region as your production project. Wait ~2 minutes for provisioning.

- [ ] **Step 2: Apply all migrations to the QA Supabase project**

  In the QA project dashboard → SQL Editor → New query. Run each migration file in order. The files are in `supabase/migrations/` — run them in this exact order:

  ```
  001_waitlist.sql → 002_core.sql → 003_bookings.sql → 004_outings.sql →
  005_content.sql → 006_indexes_and_views.sql → 007_tee_times_unique.sql →
  008_waitlist_v2.sql → 009_waitlist_v2_fixes.sql → 010_lock_down_rpc.sql →
  011_content_blocks_update.sql → 012_seed_tee_times.sql → 013_tee_time_variety.sql →
  014_profiles_email.sql → 015_memberships_unique_user.sql →
  016_stripe_connect_courses.sql → 017_stripe_payments.sql → 018_walk_in_bookings.sql
  ```

  Paste each file's contents into the SQL editor and click Run. If a migration errors with "already exists", that's fine — skip it.

- [ ] **Step 3: Seed QA data**

  In the QA SQL editor, run:

  ```sql
  -- Founding partner counter (3 claimed, cap 10)
  INSERT INTO founding_partner_counter (count, cap) VALUES (3, 10)
  ON CONFLICT DO NOTHING;

  -- Homepage content blocks
  INSERT INTO content_blocks (key, value) VALUES
    ('home.headline', 'Golf, redone for the people who actually play it.'),
    ('home.subhead', 'Free software for your home course. Real loyalty for you. Zero booking fees — always.'),
    ('home.badge', 'Coming soon to Metro Detroit'),
    ('home.tagline', 'No credit card · Founding members get lifetime perks')
  ON CONFLICT (key) DO NOTHING;
  ```

- [ ] **Step 4: Collect QA Supabase credentials**

  In the QA project → Settings → API:
  - Copy `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
  - Copy `anon public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 5: Add QA env vars to Vercel**

  In [vercel.com](https://vercel.com) → your TeeAhead project → Settings → Environment Variables:

  Add the three variables from Step 4. For each one, set **Environment** to **Preview only** (uncheck Production and Development). This ensures preview deployments (the `qa` branch) use the QA Supabase project while production stays on the production Supabase project.

  Also set for Preview only:
  ```
  NEXT_PUBLIC_APP_URL = https://teeahead-git-qa-[your-vercel-slug].vercel.app
  ```
  (You can update this URL after the first deploy.)

- [ ] **Step 6: Create the `qa` git branch**

  ```bash
  git checkout -b qa
  git push -u origin qa
  ```

- [ ] **Step 7: Verify Vercel preview deploys**

  The push from Step 6 will trigger a Vercel preview build. Go to the Vercel dashboard → Deployments and confirm the `qa` branch built successfully. Open the preview URL and confirm the current (pre-redesign) site loads with real data.

- [ ] **Step 8: Commit**

  ```bash
  git add .
  git commit -m "chore: set up qa branch for preview deploys"
  ```

---

## Task 1: Add Playfair Display Font

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Context:** Playfair Display is the display/headline font for the "Premium Local" direction. It's loaded via `next/font/google` (same pattern as Inter). Tailwind 4 maps `--font-display` in `@theme inline` to the `font-display` utility class.

- [ ] **Step 1: Check Next.js font docs for breaking changes**

  ```bash
  grep -r "next/font" node_modules/next/dist/docs/ 2>/dev/null | head -5
  # If no docs dir, check the changelog:
  cat node_modules/next/package.json | grep '"version"'
  ```

  Confirm `next/font/google` is still the correct import. If the API has changed, follow the new pattern. The steps below assume the standard API is unchanged.

- [ ] **Step 2: Add Playfair Display to `layout.tsx`**

  In `src/app/layout.tsx`, change the font import block from:

  ```tsx
  import { Inter } from "next/font/google";

  const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
  });
  ```

  To:

  ```tsx
  import { Inter, Playfair_Display } from "next/font/google";

  const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
  });

  const playfair = Playfair_Display({
    variable: "--font-display",
    subsets: ["latin"],
    weight: ["700", "800", "900"],
    style: ["normal", "italic"],
  });
  ```

  Then update the `<html>` tag to include the new variable:

  ```tsx
  <html
    lang="en"
    className={`${inter.variable} ${playfair.variable} h-full antialiased`}
  >
  ```

- [ ] **Step 3: Register `--font-display` in Tailwind 4 theme**

  In `src/app/globals.css`, inside the `@theme inline { }` block, add one line after `--font-heading: var(--font-sans);`:

  ```css
  --font-display: var(--font-display);
  ```

  This makes `font-display` a valid Tailwind utility that resolves to `font-family: var(--font-display)`.

- [ ] **Step 4: Verify the build passes**

  ```bash
  npm run build
  ```

  Expected: build succeeds with no font-related errors. The `font-display` class won't be used yet — this just confirms the font loads correctly.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/layout.tsx src/app/globals.css
  git commit -m "feat: add Playfair Display font as --font-display variable"
  ```

---

## Task 2: Homepage — Nav

**Files:**
- Modify: `src/app/page.tsx` (nav section only, lines ~41–55)

**Context:** The nav changes from cream (`#FAF7F2`) to dark green (`#0F3D2E`), the logo becomes white via `brightness-0 invert`, the CTA button becomes gold, and a "Barter Calculator" text link is added.

- [ ] **Step 1: Replace the nav section**

  In `src/app/page.tsx`, replace the entire `{/* ── Header / Nav ── */}` block with:

  ```tsx
  {/* ── Header / Nav ──────────────────────────────────────── */}
  <header className="sticky top-0 z-50 bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8">
    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <Link href="/">
        <TeeAheadLogo className="h-14 w-auto brightness-0 invert" />
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/barter"
          className="text-sm font-medium text-[#F4F1EA]/70 hover:text-[#F4F1EA] transition-colors hidden sm:block"
        >
          Barter Calculator
        </Link>
        <Link
          href="/waitlist/golfer"
          className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
        >
          Join the Waitlist
        </Link>
      </nav>
    </div>
  </header>
  ```

- [ ] **Step 2: Verify dev server shows dark green nav**

  ```bash
  npm run dev
  ```

  Open http://localhost:3000. Confirm: nav is dark green, logo is white, "Barter Calculator" link is visible on desktop, gold CTA button.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: homepage nav — dark green bg, gold CTA, barter calculator link"
  ```

---

## Task 3: Homepage — Hero

**Files:**
- Modify: `src/app/page.tsx` (hero section, lines ~57–121)

**Context:** Replaces the current single-column hero + dual link CTAs with a Playfair Display headline and two audience cards (golfer / course). The long SEO paragraph at the bottom is removed (its content is already in page metadata).

- [ ] **Step 1: Replace the hero section**

  Replace the entire `{/* ── Hero ── */}` section with:

  ```tsx
  {/* ── Hero ──────────────────────────────────────────────── */}
  <section className="relative px-6 py-28 overflow-hidden">
    {/* Background image */}
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1920&q=80')" }}
    />
    {/* Gradient overlay */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(8,36,25,0.88) 0%, rgba(15,61,46,0.82) 50%, rgba(8,36,25,0.92) 100%)' }} />
    {/* Vignette */}
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)' }} />

    <FadeIn>
      <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#E0A800]/15 backdrop-blur-sm border border-[#E0A800]/40 rounded-full px-4 py-1.5">
          <span className="size-2 rounded-full bg-[#E0A800] animate-pulse" />
          <span className="text-sm font-semibold text-[#E0A800] tracking-wide uppercase">{badge}</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-black text-[#F4F1EA] leading-[1.08] tracking-[-0.02em]" style={{ fontSize: 'clamp(40px, 6vw, 62px)' }}>
          Golf, returned to the people who{' '}
          <em className="italic text-[#E0A800] not-italic" style={{ fontStyle: 'italic' }}>actually</em>{' '}
          play it.
        </h1>

        {/* Subhead */}
        <p className="text-lg text-[#F4F1EA]/72 leading-relaxed max-w-xl mx-auto">
          {subhead}
        </p>

        {/* Audience cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[620px] mx-auto pt-2">

          {/* Golfer card */}
          <div className="rounded-xl p-6 text-left space-y-4 transition-transform hover:-translate-y-0.5 duration-150"
               style={{ background: 'rgba(244,241,234,0.10)', border: '1.5px solid rgba(244,241,234,0.22)', backdropFilter: 'blur(8px)' }}>
            <div className="text-2xl">⛳</div>
            <div>
              <p className="font-bold text-[#F4F1EA] text-base mb-1">I&apos;m a Golfer</p>
              <p className="text-xs text-[#F4F1EA]/60 leading-relaxed">Zero fees. Real loyalty at the courses you already play. Beat GolfPass+ for $40 less.</p>
            </div>
            <Link
              href="/waitlist/golfer"
              className="block text-center rounded-lg bg-[#F4F1EA] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
            >
              Join the Waitlist
            </Link>
            <p className="text-xs text-[#F4F1EA]/40 text-center">Free · No credit card</p>
          </div>

          {/* Course card */}
          <div className="rounded-xl p-6 text-left space-y-4 transition-transform hover:-translate-y-0.5 duration-150"
               style={{ background: 'rgba(224,168,0,0.12)', border: '1.5px solid rgba(224,168,0,0.50)', backdropFilter: 'blur(8px)' }}>
            <div className="text-2xl">🏌️</div>
            <div>
              <p className="font-bold text-[#E0A800] text-base mb-1">I Run a Course</p>
              <p className="text-xs text-[#F4F1EA]/60 leading-relaxed">Free forever for Founding Partners. No barter. No commissions. No data extraction.</p>
            </div>
            <Link
              href="/waitlist/course"
              className="block text-center rounded-lg bg-[#E0A800] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
            >
              {spotsRemaining > 0 ? 'Claim a Founding Spot' : 'Join the Course Waitlist'}
            </Link>
            <p className="text-xs text-[#F4F1EA]/40 text-center">
              {spotsRemaining > 0
                ? `${spotsRemaining} of 10 spots remaining`
                : 'All founding spots claimed'}
            </p>
          </div>

        </div>

        <p className="text-sm text-[#F4F1EA]/50">{tagline}</p>
      </div>
    </FadeIn>
  </section>
  ```

  Note: `font-display` maps to `font-family: var(--font-display)` (Playfair Display) via the Tailwind theme registered in Task 1. The `not-italic` class on the `<em>` prevents Tailwind's reset from stripping italic — the inline `fontStyle` handles it instead.

- [ ] **Step 2: Verify hero in dev server**

  Open http://localhost:3000. Confirm: Playfair Display headline with gold italic "actually", two audience cards with correct colors, gold dot pulse in badge.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: homepage hero — Playfair headline, audience cards, badge"
  ```

---

## Task 4: Homepage — Stat Moment + Proof Strip

**Files:**
- Modify: `src/app/page.tsx`

**Context:** Replaces the current "Social Proof" section (3-column stat cards on cream) with two tightly coupled sections: a full-width white stat moment ($94,500, huge) with a barter calculator callout, followed by a compact proof strip on cream.

- [ ] **Step 1: Delete the old Two-Column Value Props section**

  Remove the entire `{/* ── Two-Column Value Props ── */}` section (currently the first section after the hero, on white background). This is replaced by the Solution section in Task 5.

- [ ] **Step 2: Replace the Social Proof section with Stat Moment + Proof Strip**

  Replace the entire `{/* ── Social Proof ── */}` section with:

  ```tsx
  {/* ── Stat Moment ──────────────────────────────────────── */}
  <section className="bg-white px-6 py-20 text-center border-t-4 border-[#E0A800]">
    <FadeIn>
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">
          What GolfNow costs the average course, per year
        </p>
        <p className="font-display font-black text-[#0F3D2E] leading-none tracking-[-0.03em]"
           style={{ fontSize: 'clamp(72px, 12vw, 96px)' }}>
          $94,500
        </p>
        <p className="text-xl font-medium text-[#1A1A1A] max-w-md mx-auto leading-snug">
          in barter tee times — revenue taken directly out of your pocket
        </p>
        <p className="text-base text-[#6B7770] max-w-xl mx-auto leading-relaxed">
          Brown Golf documented 39.6% of all rounds over three years went to zero-revenue barter
          slots. Windsor Parke Golf Club saw a 382% increase in online revenue after leaving GolfNow.
        </p>
        <p className="text-base text-[#6B7770]">
          TeeAhead charges <strong className="text-[#0F3D2E] font-bold">$0</strong>. For Founding Partners, forever.
        </p>

        {/* Barter callout — visually distinct, not just a text link */}
        <div className="inline-flex items-center gap-3 bg-[#0F3D2E] rounded-full px-6 py-3 mt-2">
          <span className="text-sm font-semibold text-[#F4F1EA]">Want your exact number?</span>
          <Link
            href="/barter"
            className="text-sm font-bold text-[#E0A800] hover:text-[#E0A800]/80 transition-colors"
          >
            Use the barter calculator →
          </Link>
        </div>
      </div>
    </FadeIn>
  </section>

  {/* ── Proof Strip ───────────────────────────────────────── */}
  <section className="bg-[#FAF7F2] px-6 py-10 border-t border-black/5">
    <FadeIn>
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
        {[
          { num: '100+', label: 'courses left GolfNow in Q1 2025 alone' },
          { num: '382%', label: 'revenue increase at Windsor Parke after leaving' },
          { num: '$0', label: 'what TeeAhead charges Founding Partner courses' },
        ].map(({ num, label }) => (
          <div key={num} className="space-y-1">
            <p className="font-display font-extrabold text-[#0F3D2E] leading-none" style={{ fontSize: '32px' }}>
              {num}
            </p>
            <p className="text-xs text-[#6B7770] max-w-[160px] leading-snug">{label}</p>
          </div>
        ))}
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 3: Verify in dev server**

  Open http://localhost:3000. Confirm: $94,500 is large and dominant in Playfair Display, gold top border on the section, barter callout pill is visible, proof strip shows 3 numbers below.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: homepage stat moment and proof strip sections"
  ```

---

## Task 5: Homepage — Solution Section

**Files:**
- Modify: `src/app/page.tsx`

**Context:** Replaces the "Two-Column Value Props" section (already deleted in Task 4) and the "How It Works" section. The solution section lives on dark green and explains TeeAhead to both audiences with feature bullets.

- [ ] **Step 1: Delete the How It Works section**

  Remove the entire `{/* ── How It Works ── */}` section (the 3-card section with emoji icons on white background, `id="how-it-works"`).

- [ ] **Step 2: Insert the Solution section after the Proof Strip**

  Add this after the Proof Strip section:

  ```tsx
  {/* ── Solution ──────────────────────────────────────────── */}
  <section className="bg-[#0F3D2E] px-6 py-20">
    <FadeIn>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <h2 className="font-display font-extrabold text-[#F4F1EA] leading-tight tracking-[-0.02em]"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>
            The better way to play — and to run a course.
          </h2>
          <p className="text-[#F4F1EA]/60 text-base leading-relaxed max-w-md mx-auto">
            Free for courses. Fair for golfers. Built in Metro Detroit for the people who show up every week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Golfer card */}
          <div className="rounded-2xl p-8 space-y-5"
               style={{ background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.12)' }}>
            <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#F4F1EA]/50">For Golfers</div>
            <h3 className="font-display font-bold text-[#F4F1EA] text-xl leading-snug">
              The smarter alternative to GolfPass+
            </h3>
            <ul className="space-y-2.5">
              {[
                'Book tee times at your home course with zero fees',
                'Earn Fairway Points on every round',
                'Eagle membership: $79/yr, $180 in credits — beats GolfPass+ by $40',
                'Priority booking, guest passes, birthday credit',
                'Loyalty that lives at courses you actually play',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#F4F1EA]/75 leading-snug">
                  <span className="text-[#8FA889] font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/waitlist/golfer"
              className="block text-center rounded-lg bg-[#F4F1EA] px-5 py-3 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
            >
              Join the Golfer Waitlist →
            </Link>
          </div>

          {/* Course card */}
          <div className="rounded-2xl p-8 space-y-5"
               style={{ background: 'rgba(224,168,0,0.10)', border: '1px solid rgba(224,168,0,0.30)' }}>
            <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#E0A800]/70">For Courses</div>
            <h3 className="font-display font-bold text-[#E0A800] text-xl leading-snug">
              Free software. No barter. No catch.
            </h3>
            <ul className="space-y-2.5">
              {[
                'Free for Founding Partners — forever',
                'No barter tee times, ever',
                'No commissions on bookings',
                'Full tee sheet control stays with you',
                'Only ask: tell your golfers about TeeAhead at booking',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#F4F1EA]/75 leading-snug">
                  <span className="text-[#E0A800] font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/waitlist/course"
              className="block text-center rounded-lg bg-[#E0A800] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
            >
              {spotsRemaining > 0 ? 'Claim a Founding Partner Spot →' : 'Join the Course Waitlist →'}
            </Link>
          </div>

        </div>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 3: Verify in dev server**

  Open http://localhost:3000. Confirm: dark green section with Playfair Display headline, two-column cards with correct accent colors (cream vs gold check marks), both CTA buttons present.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: homepage solution section — replaces value props and how-it-works"
  ```

---

## Task 6: Homepage — Pricing Section

**Files:**
- Modify: `src/app/page.tsx`

**Context:** Elevates the pricing cards (Playfair tier names, Eagle lifts 8px with gold ring), removes the vs. GolfNow comparison table, keeps all pricing data and footnote unchanged.

- [ ] **Step 1: Replace the Pricing section**

  Replace the entire `{/* ── Pricing ── */}` section with:

  ```tsx
  {/* ── Pricing ───────────────────────────────────────────── */}
  <section id="pricing" className="px-6 py-20 bg-[#FAF7F2]">
    <FadeIn>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14 space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#9DAA9F]">Membership</p>
          <h2 className="font-display font-extrabold text-[#1A1A1A] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Pick your game.
          </h2>
          <p className="text-[#6B7770] text-lg">Start free. Upgrade when it makes sense.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">

          {/* Fairway — Free */}
          <div className="bg-white rounded-2xl overflow-hidden border border-black/8">
            <div className="p-7 border-b border-black/5">
              <p className="font-display font-bold text-xl text-[#1A1A1A]">Fairway</p>
              <p className="text-sm text-[#9DAA9F] mt-0.5">The foundation</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display font-black text-4xl text-[#1A1A1A]">$0</span>
                <span className="text-[#6B7770] text-sm">/ forever</span>
              </div>
            </div>
            <div className="p-7 space-y-5">
              <ul className="space-y-2 text-sm text-[#1A1A1A]">
                {[
                  'Book tee times at partner courses',
                  'Zero booking fees',
                  '1× Fairway Points per dollar',
                  'Free cancellation (1hr policy)',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#8FA889] font-bold mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/waitlist/golfer"
                className="block text-center rounded-lg border-2 border-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
              >
                Join the Waitlist
              </Link>
            </div>
          </div>

          {/* Eagle — Most Popular (lifted) */}
          <div className="bg-white rounded-2xl overflow-hidden border-2 border-[#E0A800] shadow-[0_8px_32px_rgba(224,168,0,0.18)] relative -translate-y-2">
            <div className="bg-[#E0A800] py-2 text-center">
              <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-[0.06em]">Most Popular</span>
            </div>
            <div className="p-7 border-b border-black/5">
              <p className="font-display font-bold text-xl text-[#1A1A1A]">Eagle</p>
              <p className="text-sm text-[#9DAA9F] mt-0.5">Serious golfers</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display font-black text-4xl text-[#1A1A1A]">$79</span>
                <span className="text-[#6B7770] text-sm">/ yr</span>
              </div>
              <p className="text-xs text-[#9DAA9F] mt-0.5">~$6.58/mo</p>
            </div>
            <div className="p-7 space-y-5">
              <ul className="space-y-2 text-sm text-[#1A1A1A]">
                {[
                  '$15/mo in tee time credits ($180/yr)',
                  '2 free rounds per year',
                  'Always-on booking fee waiver',
                  'Free cancellation unlimited (1hr)',
                  '2× Fairway Points',
                  'Priority booking: 48hr early access',
                  '12 guest passes per year',
                  '10% green fee discount',
                  '$25 birthday credit',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#E0A800] font-bold mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/waitlist/golfer"
                className="block text-center rounded-lg bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
              >
                Join the Waitlist
              </Link>
              <p className="text-xs text-[#9DAA9F] text-center">Credits applied at partner courses</p>
            </div>
          </div>

          {/* Ace */}
          <div className="bg-white rounded-2xl overflow-hidden border-2 border-[#1B4332]">
            <div className="p-7 border-b border-black/5">
              <p className="font-display font-bold text-xl text-[#1A1A1A]">Ace</p>
              <p className="text-sm text-[#9DAA9F] mt-0.5">All-in members</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display font-black text-4xl text-[#1A1A1A]">$149</span>
                <span className="text-[#6B7770] text-sm">/ yr</span>
              </div>
              <p className="text-xs text-[#9DAA9F] mt-0.5">~$12.42/mo</p>
            </div>
            <div className="p-7 space-y-5">
              <ul className="space-y-2 text-sm text-[#1A1A1A]">
                {[
                  '$25/mo in tee time credits ($300/yr)',
                  '4 free rounds per year',
                  'Always-on booking fee waiver',
                  'Free cancellation unlimited (1hr)',
                  '3× Fairway Points',
                  'Priority booking: 72hr early access',
                  'Unlimited guest passes',
                  '15% green fee discount',
                  '$50 birthday credit',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#1B4332] font-bold mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/waitlist/golfer"
                className="block text-center rounded-lg border-2 border-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
              >
                Join the Waitlist
              </Link>
            </div>
          </div>

        </div>

        <p className="mt-12 text-center text-sm text-[#6B7770] max-w-xl mx-auto leading-relaxed">
          Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days — once they&apos;ve
          earned enough Fairway Points to see the math. Start free. Upgrade when it makes sense.
        </p>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 2: Delete the vs. GolfNow comparison table section**

  Remove the entire `{/* ── vs. GolfNow Comparison ── */}` section.

- [ ] **Step 3: Verify in dev server**

  Confirm: pricing cards render on cream bg, Eagle card is lifted with gold border, comparison table is gone, footnote is present.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: homepage pricing — Playfair tiers, Eagle lifted, comparison table removed"
  ```

---

## Task 7: Homepage — Founder Letter, Manifesto & Footer

**Files:**
- Modify: `src/app/page.tsx`

**Context:** Remove the founder bio section (avatar circles). Add an eyebrow label to the founder letter section. Add dual CTAs to the manifesto. Darken the footer background. Remove the legal disclaimer paragraph from the footer.

- [ ] **Step 1: Delete the Founder Bios section**

  Remove the entire `{/* ── Founder Section ── */}` section (the one with Neil and Billy's circular avatars with "N" and "B" initials).

- [ ] **Step 2: Add eyebrow to the Founder Letter section**

  In the `{/* ── Founder Note ── */}` section, wrap the existing content in a container that adds an eyebrow label. Change the section opening from:

  ```tsx
  <section className="bg-[#0F3D2E] px-6 py-24">
    <FadeIn>
    <div className="max-w-2xl mx-auto">
  ```

  To:

  ```tsx
  <section className="bg-[#0F3D2E] px-6 py-24">
    <FadeIn>
    <div className="max-w-2xl mx-auto">
      <p className="text-center text-xs font-bold tracking-[0.14em] uppercase text-[#F4F1EA]/35 mb-10">
        A note from the founders
      </p>
  ```

  And close the new `<div>` before the closing `</div></FadeIn></section>`.

- [ ] **Step 3: Replace the Manifesto section**

  Replace the `{/* ── Manifesto ── */}` section with:

  ```tsx
  {/* ── Manifesto ─────────────────────────────────────────── */}
  <section className="bg-[#0F3D2E] px-6 py-32 text-center border-t border-[#F4F1EA]/8">
    <FadeIn>
      <div className="max-w-4xl mx-auto space-y-10">
        <p className="font-display font-black text-[#F4F1EA] leading-[1.1] tracking-[-0.03em]"
           style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
          Local golf, returned to the people who{' '}
          <em style={{ fontStyle: 'italic', color: '#E0A800' }}>actually</em>{' '}
          play it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/waitlist/golfer"
            className="inline-flex items-center justify-center rounded-lg bg-[#F4F1EA] px-7 py-3.5 text-sm font-semibold text-[#0F3D2E] hover:bg-white transition-colors"
          >
            ⛳ Join the Golfer Waitlist
          </Link>
          <Link
            href="/waitlist/course"
            className="inline-flex items-center justify-center rounded-lg border border-[#F4F1EA]/30 px-7 py-3.5 text-sm font-semibold text-[#F4F1EA] hover:border-[#F4F1EA]/60 transition-colors"
          >
            Claim a Founding Course Spot →
          </Link>
        </div>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 4: Update the footer**

  In the footer section, change the background from `bg-[#0F3D2E]` to `bg-[#071f17]`:

  ```tsx
  <footer className="bg-[#071f17] border-t border-black/5 px-6 py-16">
  ```

  Then remove the legal disclaimer `<p>` tag at the bottom of the footer (the one reading "Competitor references are for comparative purposes only..."). The `© 2026` copyright line stays.

  Also update the footer Product nav — remove the `/#how-it-works` link (section no longer exists) and add the barter calculator link:

  ```tsx
  <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
    <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
    <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
    <Link href="/barter" className="hover:text-[#F4F1EA] transition-colors">Barter Calculator</Link>
    <Link href="#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
  </nav>
  ```

- [ ] **Step 5: Build to confirm no TypeScript errors**

  ```bash
  npm run build
  ```

  Expected: successful build, no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/page.tsx
  git commit -m "feat: homepage founder letter eyebrow, manifesto dual CTAs, footer cleanup"
  ```

---

## Task 8: Update Barter Page Tests Before Implementing

**Files:**
- Modify: `src/test/barter-page.test.tsx`

**Context:** The redesign changes the hero headline and removes the Share section. Tests must be updated before implementation so they fail correctly (TDD). Also add tests for the new preset chip behavior.

- [ ] **Step 1: Update the hero headline test**

  Change:

  ```tsx
  it('renders the hero headline', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/What has GolfNow actually cost you/i)).toBeInTheDocument()
  })
  ```

  To:

  ```tsx
  it('renders the hero headline', () => {
    render(<BarterPage spotsRemaining={10} />)
    expect(screen.getByText(/See exactly what GolfNow has cost you/i)).toBeInTheDocument()
  })
  ```

- [ ] **Step 2: Delete the share buttons describe block**

  Remove the entire `describe('BarterPage — share buttons', ...)` block (the last describe block with 5 tests for Copy Link, Share via Email, etc.). The Share section is being removed from the component.

- [ ] **Step 3: Update the spots remaining copy test**

  Change:

  ```tsx
  it('shows spots remaining when spots > 0', () => {
    render(<BarterPage spotsRemaining={7} />)
    expect(screen.getByText(/7 of 10 spots are left/i)).toBeInTheDocument()
  })
  ```

  To:

  ```tsx
  it('shows spots remaining when spots > 0', () => {
    render(<BarterPage spotsRemaining={7} />)
    expect(screen.getByText(/7 of 10 founding spots remaining/i)).toBeInTheDocument()
  })
  ```

- [ ] **Step 4: Add preset chip tests**

  Add a new describe block after the existing `describe('BarterPage — founding spots states', ...)` block:

  ```tsx
  describe('BarterPage — preset chips', () => {
    it('renders all four preset chips', () => {
      render(<BarterPage spotsRemaining={10} />)
      expect(screen.getByRole('button', { name: /Municipal/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Daily Fee/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Semi-Private/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /My own numbers/i })).toBeInTheDocument()
    })

    it('clicking Municipal preset sets green fee slider to 45', () => {
      render(<BarterPage spotsRemaining={10} />)
      const chip = screen.getByRole('button', { name: /Municipal/i })
      fireEvent.click(chip)
      const sliders = screen.getAllByRole('slider')
      // First slider is green fee
      expect(sliders[0]).toHaveValue('45')
    })

    it('clicking Daily Fee preset sets green fee slider to 85', () => {
      render(<BarterPage spotsRemaining={10} />)
      fireEvent.click(screen.getByRole('button', { name: /Daily Fee/i }))
      const sliders = screen.getAllByRole('slider')
      expect(sliders[0]).toHaveValue('85')
    })

    it('clicking Semi-Private preset sets green fee slider to 120', () => {
      render(<BarterPage spotsRemaining={10} />)
      fireEvent.click(screen.getByRole('button', { name: /Semi-Private/i }))
      const sliders = screen.getAllByRole('slider')
      expect(sliders[0]).toHaveValue('120')
    })
  })
  ```

- [ ] **Step 5: Run tests — confirm they fail for the right reasons**

  ```bash
  npm run test
  ```

  Expected failures:
  - `renders the hero headline` — FAIL (old headline text not found)
  - `shows spots remaining when spots > 0` — FAIL (old copy not found)
  - The 4 preset chip tests — FAIL (chips don't exist yet)

  Expected to still pass: all proof section, legal, founding spots state, and output card tests.

- [ ] **Step 6: Commit**

  ```bash
  git add src/test/barter-page.test.tsx
  git commit -m "test: update barter page tests for redesign — fail before implementation"
  ```

---

## Task 9: Barter Page — Nav & Hero

**Files:**
- Modify: `src/components/BarterPage.tsx`

**Context:** Replace the cream header with a dark green nav matching the homepage. Replace the cream hero with a dark `#071f17` hero with Playfair headline, gold italic, and preset chips. The preset chips set slider default values via new state.

- [ ] **Step 1: Add preset chip state to BarterPage**

  In `BarterPage.tsx`, add a `presetKey` state after the existing state declarations:

  ```tsx
  const [presetKey, setPresetKey] = useState<'municipal' | 'dailyfee' | 'semiprivate' | 'custom'>('dailyfee')

  const presets = {
    municipal:   { label: 'Municipal ($45)',      greenFee: 45,  days: 280 },
    dailyfee:    { label: 'Daily Fee ($85)',       greenFee: 85,  days: 280 },
    semiprivate: { label: 'Semi-Private ($120)',   greenFee: 120, days: 260 },
    custom:      { label: 'My own numbers',        greenFee: greenFee, days: operatingDays },
  } as const

  const handlePreset = (key: typeof presetKey) => {
    setPresetKey(key)
    if (key !== 'custom') {
      setGreenFee(presets[key].greenFee)
      setOperatingDays(presets[key].days)
    }
  }
  ```

- [ ] **Step 2: Replace the header**

  Replace the existing `<header>` element with:

  ```tsx
  <header className="bg-[#0F3D2E]/97 backdrop-blur border-b border-white/8 px-6 py-4">
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      <Link href="/">
        <TeeAheadLogo className="h-12 w-auto brightness-0 invert" />
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-[#F4F1EA]/65 hover:text-[#F4F1EA] transition-colors hidden sm:block">
          ← Back to Home
        </Link>
        <Link
          href="/waitlist/course"
          className="inline-flex items-center justify-center rounded-lg bg-[#E0A800] px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:bg-[#E0A800]/90 transition-colors"
        >
          Claim a Founding Spot
        </Link>
      </div>
    </div>
  </header>
  ```

- [ ] **Step 3: Replace the hero section**

  Replace the existing `{/* ── Hero ── */}` section (the cream one) with:

  ```tsx
  {/* ── Hero ──────────────────────────────────────────────── */}
  <section className="px-6 py-20 text-center relative overflow-hidden" style={{ background: '#071f17' }}>
    {/* Gold radial glow */}
    <div className="absolute inset-0 pointer-events-none"
         style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(224,168,0,0.08) 0%, transparent 65%)' }} />
    <FadeIn>
      <div className="max-w-2xl mx-auto space-y-7 relative z-10">
        <div className="inline-flex items-center gap-2 bg-[#E0A800]/12 border border-[#E0A800]/30 rounded-full px-4 py-1.5">
          <span className="text-xs font-bold text-[#E0A800] tracking-[0.08em] uppercase">For Golf Course Operators</span>
        </div>

        <h1 className="font-display font-black text-[#F4F1EA] leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
          See exactly what GolfNow has cost you.{' '}
          <em style={{ fontStyle: 'italic', color: '#E0A800' }}>In dollars.</em>
        </h1>

        <p className="text-base leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(244,241,234,0.60)' }}>
          Drop in your numbers. We&apos;ll calculate the exact revenue GolfNow&apos;s barter model has
          extracted from your course — this year alone. No login. No email required.
        </p>

        {/* Preset chips */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.08em] uppercase" style={{ color: 'rgba(244,241,234,0.35)' }}>
            Quick-start with a course type
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {(Object.keys(presets) as Array<keyof typeof presets>).map((key) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={presetKey === key
                  ? { background: 'rgba(224,168,0,0.15)', border: '1px solid rgba(224,168,0,0.40)', color: '#E0A800' }
                  : { background: 'rgba(244,241,234,0.07)', border: '1px solid rgba(244,241,234,0.15)', color: 'rgba(244,241,234,0.65)' }
                }
              >
                {presets[key].label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(244,241,234,0.30)' }}>
          Calculator based on NGCOA member survey data and Golf Inc. industry analysis (2024–2025). Actual costs vary by contract terms.
        </p>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 4: Run the preset chip tests**

  ```bash
  npm run test -- --reporter=verbose 2>&1 | grep -A2 "preset"
  ```

  Expected: the 4 preset chip tests now pass. The headline test also passes now.

- [ ] **Step 5: Verify in dev server**

  ```bash
  npm run dev
  ```

  Open http://localhost:3000/barter. Confirm: dark header, dark hero, gold italic headline, 4 preset chips, "Daily Fee" chip active by default.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/BarterPage.tsx
  git commit -m "feat: barter page nav and hero — dark treatment, preset chips"
  ```

---

## Task 10: Barter Page — Calculator Card (Running Total + Elevated Styling)

**Files:**
- Modify: `src/components/BarterPage.tsx`

**Context:** The calculator card gets a live running total in the top-right corner (so the number is visible while the user moves sliders, not just in the output section), elevated border-radius and shadow, and cleaner slider styling. Calculator logic is unchanged.

- [ ] **Step 1: Replace the calculator section**

  Replace the `{/* ── Calculator ── */}` section with:

  ```tsx
  {/* ── Calculator ────────────────────────────────────────── */}
  <section className="px-6 pb-6 bg-[#FAF7F2]">
    <FadeIn>
      <div className="max-w-2xl mx-auto bg-white rounded-[20px] p-8 border border-black/7"
           style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

        {/* Card header with running total */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-black/6">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">GolfNow Barter Calculator</p>
            <p className="text-xs text-[#9DAA9F] mt-0.5">Adjust sliders to match your course</p>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-[#0F3D2E] leading-none" style={{ fontSize: '32px' }}>
              ${displayedCost.toLocaleString()}
            </p>
            <p className="text-xs text-[#9DAA9F] mt-0.5">running total</p>
          </div>
        </div>

        {/* Slider 1: Green Fee */}
        <div className="space-y-3 mb-7">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#1A1A1A]">Your average green fee at peak</label>
            <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>${greenFee}</span>
          </div>
          <input
            type="range" min={20} max={200} step={5} value={greenFee}
            onChange={(e) => { setGreenFee(Number(e.target.value)); setPresetKey('custom') }}
            className="w-full h-1.5 rounded-full cursor-pointer"
            style={{ accentColor: '#0F3D2E' }}
          />
          <p className="text-xs text-[#9DAA9F]">$20–$200 · Use your published weekend or peak-time rate</p>
        </div>

        {/* Slider 2: Operating Days */}
        <div className="space-y-3 mb-7">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#1A1A1A]">Days your course is open per year</label>
            <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>{operatingDays}</span>
          </div>
          <input
            type="range" min={100} max={360} step={10} value={operatingDays}
            onChange={(e) => { setOperatingDays(Number(e.target.value)); setPresetKey('custom') }}
            className="w-full h-1.5 rounded-full cursor-pointer"
            style={{ accentColor: '#0F3D2E' }}
          />
          <p className="text-xs text-[#9DAA9F]">100–360 days</p>
        </div>

        {/* Slider 3: Barter Tee Times */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#1A1A1A]">Barter tee times given to GolfNow per day</label>
            <span className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '22px' }}>{barterTeeTimes}</span>
          </div>
          <input
            type="range" min={1} max={4} step={1} value={barterTeeTimes}
            onChange={(e) => setBarterTeeTimes(Number(e.target.value))}
            className="w-full h-1.5 rounded-full cursor-pointer"
            style={{ accentColor: '#0F3D2E' }}
          />
          <p className="text-xs text-[#9DAA9F]">GolfNow typically takes 2 prime-time tee times per day · 1–4</p>
        </div>

      </div>
    </FadeIn>
  </section>
  ```

  Note: The green fee and operating days sliders now call `setPresetKey('custom')` when manually adjusted, so the "My own numbers" chip becomes active when the user deviates from a preset.

- [ ] **Step 2: Run tests**

  ```bash
  npm run test
  ```

  Expected: all tests pass. The slider tests still work because slider roles and values are unchanged.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/BarterPage.tsx
  git commit -m "feat: barter calculator — running total in card header, elevated styling"
  ```

---

## Task 11: Barter Page — Output, Proof & CTA Sections

**Files:**
- Modify: `src/components/BarterPage.tsx`

**Context:** Move context cards (5yr, rounds, staff) into the dark green output section as glass cards. Reorder proof section to appear before CTA. Rewrite CTA section to be more direct. Remove the Share section entirely.

- [ ] **Step 1: Replace the Output Card section**

  Replace the `{/* ── Output Card ── */}` section AND the `{/* ── Context Blocks ── */}` section AND the `{/* ── Calculator Disclaimer ── */}` section with a single unified output section:

  ```tsx
  {/* ── Output ─────────────────────────────────────────────── */}
  <section className="px-6 py-16 bg-[#0F3D2E] text-center">
    <FadeIn>
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="text-sm font-medium text-[#F4F1EA]/60">GolfNow&apos;s barter model cost you</p>
        <p className="font-display font-black text-[#F4F1EA] leading-none tracking-[-0.03em]"
           style={{ fontSize: 'clamp(72px, 12vw, 96px)' }}>
          ${displayedCost.toLocaleString()}
        </p>
        <p className="text-base text-[#F4F1EA]/50">this year alone</p>

        <div className="border-t border-[#F4F1EA]/15 pt-8 space-y-2">
          <p className="text-sm font-medium text-[#F4F1EA]/65">TeeAhead would have charged you</p>
          <p className="font-display font-black text-[#E0A800] leading-none" style={{ fontSize: '64px' }}>$0</p>
        </div>

        {/* Context cards — inside the dark section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Over 5 years, that\'s', value: `$${(annualBarterCost * 5).toLocaleString()}`, sub: 'in lost revenue' },
            { label: 'That equals about', value: `${Math.round(annualBarterCost / greenFee).toLocaleString()} rounds`, sub: 'of revenue per year' },
            { label: 'You could hire', value: `${Math.max(1, Math.round(annualBarterCost / 50000))} staff`, sub: 'with that money' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl p-5 text-center"
                 style={{ background: 'rgba(244,241,234,0.06)', border: '1px solid rgba(244,241,234,0.10)' }}>
              <p className="text-xs font-medium text-[#F4F1EA]/45 uppercase tracking-wider mb-2">{label}</p>
              <p className="font-display font-bold text-[#F4F1EA] leading-none" style={{ fontSize: '26px' }}>{value}</p>
              <p className="text-xs text-[#F4F1EA]/45 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#F4F1EA]/25 leading-relaxed max-w-lg mx-auto pt-2">
          Calculation based on GolfNow&apos;s standard barter model of 2 prime-time tee times per day
          at published rack rates. Actual barter arrangements vary by course agreement.
        </p>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 2: Replace the Proof section**

  Replace the existing `{/* ── Proof Section ── */}` section with the elevated version:

  ```tsx
  {/* ── Proof ──────────────────────────────────────────────── */}
  <section className="px-6 py-16 bg-white">
    <FadeIn>
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="max-w-xl mx-auto text-center space-y-3">
          <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em]" style={{ fontSize: '32px' }}>
            This is not a hypothetical.
          </h2>
          <p className="text-[#6B7770] text-base leading-relaxed">
            The math above isn&apos;t projection — it&apos;s documented industry data.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { num: '382%', label: 'Online revenue increase at Windsor Parke Golf Club after leaving GolfNow', sub: '$81K → $393K', source: 'Golf Inc. / industry reporting, Windsor Parke case study' },
            { num: '39.6%', label: 'Of all rounds at Brown Golf went to zero-revenue barter slots over 3 years', sub: null, source: 'NGCOA member reporting / Golf Inc. analysis' },
            { num: '100+', label: 'Golf courses left GolfNow in Q1 2025 alone', sub: null, source: 'National Golf Course Owners Association (NGCOA), Q1 2025' },
          ].map(({ num, label, sub, source }) => (
            <div key={num} className="bg-[#FAF7F2] rounded-xl p-7 space-y-2 ring-1 ring-black/5">
              <p className="font-display font-bold text-[#0F3D2E]" style={{ fontSize: '36px' }}>{num}</p>
              <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{label}</p>
              {sub && <p className="text-xs text-[#6B7770]">{sub}</p>}
              <p className="text-xs text-[#9DAA9F]">Source: {source}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 3: Replace the Offer/CTA section and delete the Share section**

  Replace the `{/* ── Offer Section ── */}` and `{/* ── Share Section ── */}` sections with a single direct CTA section:

  ```tsx
  {/* ── CTA ────────────────────────────────────────────────── */}
  <section className="px-6 py-20 bg-[#FAF7F2] text-center">
    <FadeIn>
      <div className="max-w-xl mx-auto space-y-6">
        <h2 className="font-display font-bold text-[#1A1A1A] tracking-[-0.02em] leading-tight" style={{ fontSize: '34px' }}>
          Ready to stop paying GolfNow to take your tee times?
        </h2>
        <p className="text-[#6B7770] text-base leading-relaxed">
          TeeAhead is free for Founding Partner courses — forever. No barter. No commissions.
          The only ask: tell your golfers about TeeAhead at booking.
        </p>
        <div className="space-y-3">
          <Link
            href="/waitlist/course"
            className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg bg-[#0F3D2E] px-8 py-4 text-base font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
          >
            {allClaimed ? 'Join the Course Waitlist →' : 'Claim a Founding Partner Spot →'}
          </Link>
          {!allClaimed && (
            <p className="text-sm font-semibold text-[#E0A800]">
              {spotsRemaining} of 10 founding spots remaining
            </p>
          )}
        </div>
        <p className="text-sm text-[#6B7770]">
          Questions? Email Neil directly —{' '}
          <a href="mailto:neil@teeahead.com" className="text-[#0F3D2E] hover:underline font-medium">
            neil@teeahead.com
          </a>. Not a contact form.
        </p>
      </div>
    </FadeIn>
  </section>
  ```

- [ ] **Step 4: Run all tests**

  ```bash
  npm run test
  ```

  Expected: all tests pass. Verify specifically:
  - `shows spots remaining when spots > 0` passes with new copy "7 of 10 founding spots remaining"
  - Share button tests are gone (no failures from removed tests)
  - Proof section citation tests still pass (text is unchanged)

- [ ] **Step 5: Verify full barter page in dev server**

  Open http://localhost:3000/barter. Check the full flow: hero → calculator (with running total updating as sliders move) → dark output section (with context cards inside) → proof section → CTA. Confirm no Share section.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/BarterPage.tsx
  git commit -m "feat: barter output, proof, CTA sections — context cards in dark section, share section removed"
  ```

---

## Task 12: Push to QA & Verify

**Files:**
- No code changes — git push + visual verification

- [ ] **Step 1: Run the full build one final time**

  ```bash
  npm run build && npm run test
  ```

  Expected: build succeeds, all tests pass.

- [ ] **Step 2: Push the `qa` branch**

  ```bash
  git push origin qa
  ```

- [ ] **Step 3: Wait for Vercel preview deploy**

  Go to vercel.com → your project → Deployments. Wait for the `qa` branch build to complete (typically 1–2 minutes).

- [ ] **Step 4: Open the QA preview URL**

  Click the preview URL in Vercel. Verify:
  - Homepage: dark green nav with logo white, Playfair Display headline in hero, audience cards, $94,500 stat section, solution section, pricing cards with Eagle lifted, founder letter with eyebrow, manifesto with dual CTAs, dark footer
  - `/barter`: dark nav, dark hero with preset chips, calculator with running total, dark output section with context cards, proof section, direct CTA
  - Founding partner counter pulls from QA Supabase (should show the 3-claimed / 7-remaining state seeded in Task 0)

- [ ] **Step 5: Check mobile at 375px**

  In browser DevTools, set viewport to 375px wide. Confirm:
  - Homepage hero audience cards stack vertically
  - Pricing cards stack vertically
  - Barter preset chips wrap correctly
  - No horizontal overflow on any section

- [ ] **Step 6: Final commit**

  ```bash
  git add .
  git commit -m "chore: qa verification complete — ready for production merge"
  ```

---

## Merge to Production

When QA looks good:

```bash
git checkout main
git merge qa
git push origin main
```

Vercel will auto-deploy to production. Production Supabase credentials are already set in Vercel's Production environment from before this work began — no changes needed.
