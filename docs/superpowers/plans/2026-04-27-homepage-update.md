# Homepage Marketing Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a full marketing/copy/UX audit brief to the TeeAhead homepage — tightening brand consistency, strengthening copy, adding social proof, and improving conversion flow.

**Architecture:** Nearly all changes are in `src/app/page.tsx` (a single async server component) and `src/app/layout.tsx` (global metadata). One new client component is added for scroll animations. No database schema changes needed — the `founding_partner_counter` query already exists.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4 (inline `@theme`), Supabase (server-side), Inter font

---

## File Map

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Title, description, OG, Twitter metadata |
| `src/app/page.tsx` | All section copy, structure, CTAs — 12 tasks touch this file |
| `src/components/FadeIn.tsx` | **New** — minimal client component for scroll fade-in |
| `public/og-image.svg` | **New** — SVG source for OG image (export to PNG manually) |

---

## Task 1: Metadata consistency — layout.tsx + page.tsx

**Files:**
- Modify: `src/app/layout.tsx` lines 12–46
- Modify: `src/app/page.tsx` lines 8–11

- [ ] **Step 1: Update layout.tsx metadata**

Replace the full `metadata` export in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: {
    default: "TeeAhead — Book ahead. Play more. Own your golf.",
    template: "%s | TeeAhead",
  },
  description:
    "The local-first golf platform. Free software for courses. Real loyalty for golfers. Zero booking fees, always. Coming to Metro Detroit.",
  metadataBase: new URL("https://teeahead.com"),
  openGraph: {
    type: "website",
    siteName: "TeeAhead",
    title: "TeeAhead — Book ahead. Play more. Own your golf.",
    description:
      "The local-first golf platform. Free software for courses. Real loyalty for golfers. Zero booking fees, always. Coming to Metro Detroit.",
    url: "https://teeahead.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TeeAhead" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TeeAhead — Book ahead. Play more. Own your golf.",
    description: "The local-first golf platform. Coming to Metro Detroit.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/brand/teeahead-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/teeahead-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/teeahead-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/brand/teeahead-favicon-192.png",
    other: [
      { rel: "icon", url: "/brand/teeahead-favicon-192.png", sizes: "192x192" },
      { rel: "icon", url: "/brand/teeahead-favicon-512.png", sizes: "512x512" },
    ],
  },
};
```

- [ ] **Step 2: Update page.tsx page-level metadata**

Replace lines 8–11 in `src/app/page.tsx`:

```typescript
export const metadata = {
  title: 'TeeAhead — Book ahead. Play more. Own your golf.',
  description:
    'The local-first golf platform. Free software for courses. Real loyalty for golfers. Zero booking fees, always. Coming to Metro Detroit.',
}
```

- [ ] **Step 3: Verify no stale tagline remains**

```bash
grep -r "Your home course, redone right" /Users/barris/Desktop/MulliganLinks/src/
```
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "fix: update all metadata to new tagline and description"
```

---

## Task 2: Hero content defaults + "Tee Ahead" brand fix

**Files:**
- Modify: `src/app/page.tsx` lines 25–28, 165

- [ ] **Step 1: Update the content_blocks fallback strings (lines 25–28)**

```typescript
  const headline = content['home.headline'] ?? 'Golf, redone for the people who actually play it.'
  const subhead = content['home.subhead'] ?? 'Free software for your home course. Real loyalty for you. Zero booking fees — always. The local-first alternative to GolfNow, built for the regulars.'
  const badge = content['home.badge'] ?? 'Coming soon to Metro Detroit'
  const tagline = content['home.tagline'] ?? 'No credit card · Founding members get lifetime perks'
```

- [ ] **Step 2: Fix "Tee Ahead" → "TeeAhead" on line 165**

Find this exact line (in the For Courses column):
```typescript
            The only ask: tell your golfers about the Tee Ahead membership at booking.
```

Replace with:
```typescript
            The only ask: tell your golfers about the TeeAhead membership at booking.
```

- [ ] **Step 3: Scan for all remaining "Tee Ahead" instances**

```bash
grep -n "Tee Ahead" /Users/barris/Desktop/MulliganLinks/src/app/page.tsx
```
Expected: no matches after the fix.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: update hero copy defaults and fix Tee Ahead → TeeAhead brand typo"
```

---

## Task 3: Header — replace dual CTAs with single "Join the Waitlist"

**Files:**
- Modify: `src/app/page.tsx` lines 39–52

- [ ] **Step 1: Replace nav content in the header**

Find this block in page.tsx:
```tsx
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#1A1A1A] hover:text-[#1B4332] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
```

Replace with:
```tsx
          <nav className="flex items-center gap-4">
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-5 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Join the Waitlist
            </Link>
          </nav>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: simplify header to single Join Waitlist CTA for pre-launch"
```

---

## Task 4: Footer redesign — three-column + new tagline

**Files:**
- Modify: `src/app/page.tsx` lines 396–410

- [ ] **Step 1: Replace footer content**

Find this entire footer block:
```tsx
      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#FAF7F2] border-t border-black/5 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <TeeAheadLogo className="h-14 w-auto" />
          <p className="text-sm text-[#6B7770]">Your home course, redone right.</p>
          <nav className="flex items-center gap-5 text-sm text-[#6B7770]">
            <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-[#1B4332] transition-colors">For Courses</Link>
          </nav>
          <p className="text-xs text-[#6B7770]">© 2026 TeeAhead</p>
        </div>
      </footer>
```

Replace with:
```tsx
      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-[#0F3D2E] border-t border-black/5 px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">

            {/* Column 1 — Brand */}
            <div className="space-y-3">
              <TeeAheadLogo className="h-10 w-auto brightness-0 invert" />
              <p className="text-sm text-[#F4F1EA]/80 leading-relaxed">
                Book ahead. Play more. Own your golf.
              </p>
              <p className="text-xs text-[#F4F1EA]/50">Built in Metro Detroit.</p>
            </div>

            {/* Column 2 — Product */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Product</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/waitlist/golfer" className="hover:text-[#F4F1EA] transition-colors">For Golfers</Link>
                <Link href="/waitlist/course" className="hover:text-[#F4F1EA] transition-colors">For Courses</Link>
                <Link href="#pricing" className="hover:text-[#F4F1EA] transition-colors">Pricing</Link>
                <Link href="#how-it-works" className="hover:text-[#F4F1EA] transition-colors">How It Works</Link>
              </nav>
            </div>

            {/* Column 3 — Company */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#F4F1EA]/50 uppercase tracking-wider">Company</p>
              <nav className="flex flex-col gap-2 text-sm text-[#F4F1EA]/70">
                <Link href="/about" className="hover:text-[#F4F1EA] transition-colors">About Neil &amp; Billy</Link>
                <a href="mailto:hello@teeahead.com" className="hover:text-[#F4F1EA] transition-colors">Contact</a>
                <Link href="/terms" className="hover:text-[#F4F1EA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#F4F1EA] transition-colors">Privacy</Link>
              </nav>
            </div>

          </div>
          <div className="border-t border-[#F4F1EA]/10 pt-6 text-center">
            <p className="text-xs text-[#F4F1EA]/40">© 2026 TeeAhead, LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
```

- [ ] **Step 2: Add anchor IDs to the pricing and how-it-works sections**

Find the pricing section opening tag:
```tsx
      {/* ── Pricing ───────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#FAF7F2]">
```
Replace with:
```tsx
      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20 bg-[#FAF7F2]">
```

Find the How It Works section opening tag:
```tsx
      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
```
Replace with:
```tsx
      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 bg-white">
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign footer with 3-column layout and dark TeeAhead green background"
```

---

## Task 5: For Golfers column — replace table with stat cards

**Files:**
- Modify: `src/app/page.tsx` lines 103–145

- [ ] **Step 1: Replace the For Golfers column content**

Find the entire For Golfers column div (starts with `{/* Golfer column */}`, ends before `{/* Course column */}`):

```tsx
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
```

Replace with:

```tsx
          {/* Golfer column */}
          <div className="space-y-6">
            <div className="inline-block bg-[#1B4332]/10 text-[#1B4332] text-sm font-semibold px-3 py-1 rounded-full">
              For Golfers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              The smarter GolfPass.
            </h2>
            <p className="text-[#6B7770] text-base leading-relaxed">
              $79 instead of $119. $180 in credits instead of $120. Zero booking fees — always. At courses you actually play.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {[
                { stat: '$40', label: 'saved per year vs GolfPass+' },
                { stat: '$60', label: 'more in credits per year' },
                { stat: '0', label: 'booking fees — always' },
              ].map(({ stat, label }) => (
                <div key={label} className="flex items-center gap-4 bg-[#FAF7F2] rounded-xl px-5 py-4 ring-1 ring-[#0F3D2E]/10">
                  <span className="text-3xl font-bold text-[#0F3D2E]">{stat}</span>
                  <span className="text-sm text-[#6B7770]">{label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/waitlist/golfer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0F3D2E] px-6 py-3 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
            >
              Join the Golfer Waitlist →
            </Link>
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace compact comparison table with stat cards in golfer column"
```

---

## Task 6: For Courses column — expanded GolfNow receipts + founding urgency

**Files:**
- Modify: `src/app/page.tsx` lines 148–176

- [ ] **Step 1: Replace the For Courses column content**

Find the entire Course column div (starts with `{/* Course column */}`):

```tsx
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
                Two barter slots per day, 300 operating days a year: <strong className="text-[#1A1A1A]">$94,500/year</strong> in lost revenue.
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
```

Replace with:

```tsx
          {/* Course column */}
          <div className="space-y-6">
            <div className="inline-block bg-[#E0A800]/20 text-[#8B6F00] text-sm font-semibold px-3 py-1 rounded-full">
              For Courses —{' '}
              <span className="text-[#E0A800] font-bold">
                {spotsRemaining <= 5 && spotsRemaining > 0
                  ? `Only ${spotsRemaining} spots left`
                  : `${spotsRemaining} of 10 Founding Spots Left`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              GolfNow costs the average course $94,500/year. We charge $0.
            </h2>
            <div className="bg-[#FAF7F2] rounded-xl p-6 space-y-4 ring-1 ring-black/5">
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                The math is brutal once you see it. GolfNow takes 2 prime-time tee times from you per day
                in barter — at your published rack rate. That&apos;s roughly{' '}
                <strong className="text-[#1A1A1A]">$94,500/year</strong> in lost revenue per course
                (industry analyst data, 2025). High-volume courses lose $150K+.
              </p>
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                Brown Golf documented 39.6% of all rounds over three years went to zero-revenue barter
                slots. Windsor Parke Golf Club saw a{' '}
                <strong className="text-[#1A1A1A]">382% increase in online revenue</strong> after leaving
                GolfNow ($81K → $393K).
              </p>
              <p className="text-[#1A1A1A] text-sm leading-relaxed">
                TeeAhead charges <strong className="text-[#0F3D2E]">$0</strong> for the first 10 Founding
                Partner courses — free for life. Course #11 onward pays $249/month. That&apos;s it. No
                barter. No commissions. No data extraction.
              </p>
              <p className="text-sm text-[#6B7770] italic">
                The only ask: tell your golfers about the TeeAhead membership at booking.
              </p>
            </div>
            <Link
              href="/waitlist/course"
              className="inline-flex flex-col items-start rounded-lg border-2 border-[#E0A800] bg-[#E0A800]/5 px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E0A800]/10 transition-colors"
            >
              {spotsRemaining > 0
                ? 'Claim a Founding Partner Spot →'
                : 'Join the Course Waitlist →'}
              <span className="text-xs font-normal text-[#6B7770] mt-0.5">
                {spotsRemaining > 0
                  ? `${spotsRemaining} of 10 spots remaining`
                  : 'Next 10 spots release Q2 2027'}
              </span>
            </Link>
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: expand GolfNow receipts with citations, dynamic urgency for founding spots"
```

---

## Task 7: Social proof section — "The exodus is real"

Insert this section between the Two-Column Value Props section and the How It Works section.

**Files:**
- Modify: `src/app/page.tsx` — insert after line 180 (`</section>` that closes Two-Column)

- [ ] **Step 1: Add the social proof section**

Find the comment and section tag that opens How It Works:
```tsx
      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 bg-white">
```

Insert the following before it:

```tsx
      {/* ── Social Proof ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
            The exodus is real.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {[
              {
                stat: '100+',
                label: 'courses left GolfNow in Q1 2025 alone',
                source: 'NGCOA data',
              },
              {
                stat: '382%',
                label: 'online revenue increase at Windsor Parke after leaving GolfNow',
                source: '$81K → $393K',
              },
              {
                stat: '$94,500',
                label: 'average annual barter cost per GolfNow course',
                source: 'industry analyst data, 2025',
              },
            ].map(({ stat, label, source }) => (
              <div key={stat} className="bg-white rounded-xl p-8 space-y-3 ring-1 ring-black/5 text-center">
                <div className="text-4xl font-bold text-[#0F3D2E]">{stat}</div>
                <p className="text-sm text-[#1A1A1A] font-medium leading-snug">{label}</p>
                <p className="text-xs text-[#6B7770]">{source}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-[#6B7770]">
            TeeAhead is built to give those courses — and their golfers — a better option.
          </p>
        </div>
      </section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add social proof section with GolfNow exodus stats"
```

---

## Task 8: How It Works — rewrite with waitlist-first copy

**Files:**
- Modify: `src/app/page.tsx` — the How It Works section

- [ ] **Step 1: Replace the three-step data array**

Find this array inside the How It Works section:
```tsx
            {[
              {
                icon: '🏌️',
                title: 'Join free',
                body: 'Create your TeeAhead account. No card needed to start.',
              },
              {
                icon: '📍',
                title: 'Find your course',
                body: 'Book tee times at partner courses with zero booking fees.',
              },
              {
                icon: '⭐',
                title: 'Earn & upgrade',
                body: 'Every dollar played earns Fairway Points. Upgrade to Eagle or Ace for bigger rewards.',
              },
            ]
```

Replace with:
```tsx
            {[
              {
                icon: '🏌️',
                title: 'Join the waitlist.',
                body: 'Be one of the first golfers in Metro Detroit when we launch. Free, no card required.',
              },
              {
                icon: '📍',
                title: 'Book at your home course.',
                body: 'Real tee times at the courses you already play. Zero booking fees, always.',
              },
              {
                icon: '⭐',
                title: 'Earn loyalty that lives at your course.',
                body: 'Fairway Points stay with you, your home course, and the network. Not a national chain.',
              },
            ]
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rewrite How It Works steps with waitlist-first, local-loyalty copy"
```

---

## Task 9: Pricing section — update CTAs and add Fairway→Eagle nudge

**Files:**
- Modify: `src/app/page.tsx` — pricing section

- [ ] **Step 1: Update Fairway CTA**

Find:
```tsx
                <Link
                  href="/signup"
                  className="block w-full text-center rounded-lg border border-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
                >
                  Start Free
                </Link>
```
Replace with:
```tsx
                <Link
                  href="/waitlist/golfer"
                  className="block w-full text-center rounded-lg border-2 border-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Join the Waitlist
                </Link>
```

- [ ] **Step 2: Update Eagle CTA**

Find:
```tsx
                <Link
                  href="/signup?next=/app/membership"
                  className="block w-full text-center rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1B4332]/90 transition-colors"
                >
                  Get Eagle
                </Link>
```
Replace with:
```tsx
                <Link
                  href="/waitlist/golfer"
                  className="block w-full text-center rounded-lg bg-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#F4F1EA] hover:opacity-90 transition-opacity"
                >
                  Join the Waitlist
                </Link>
```

- [ ] **Step 3: Update Ace CTA**

Find:
```tsx
                <Link
                  href="/signup?next=/app/membership"
                  className="block w-full text-center rounded-lg border border-[#1B4332] px-4 py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 transition-colors"
                >
                  Get Ace
                </Link>
```
Replace with:
```tsx
                <Link
                  href="/waitlist/golfer"
                  className="block w-full text-center rounded-lg border-2 border-[#0F3D2E] px-4 py-2.5 text-sm font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E]/5 transition-colors"
                >
                  Join the Waitlist
                </Link>
```

- [ ] **Step 4: Add Fairway→Eagle conversion nudge after pricing grid**

Find the closing `</div>` and `</section>` of the pricing section (after the three-column grid `</div>`):
```tsx
          </div>
        </div>
      </section>

      {/* ── vs. GolfNow Comparison
```
Insert before `</div></section>`:
```tsx
          <p className="mt-10 text-center text-sm text-[#6B7770] max-w-xl mx-auto">
            Most golfers start on Fairway. About 1 in 4 upgrade to Eagle within 60 days — once they&apos;ve
            earned enough Fairway Points to see the math. Start free. Upgrade when it makes sense.
          </p>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: update pricing CTAs to Join Waitlist, add Fairway→Eagle upgrade nudge"
```

---

## Task 10: GolfNow comparison section — update pull-quote

**Files:**
- Modify: `src/app/page.tsx` lines 390–392

- [ ] **Step 1: Replace the closing pull-quote**

Find:
```tsx
          <p className="text-center text-[#6B7770] text-lg mt-10 font-medium">
            &ldquo;GolfNow made tee times a commodity. We made them a community.&rdquo;
          </p>
```
Replace with:
```tsx
          <p className="text-center text-[#1A1A1A] text-xl mt-10 font-semibold italic max-w-2xl mx-auto">
            &ldquo;GolfNow turned your home course into a commodity. We&apos;re turning it back into your home.&rdquo;
          </p>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: update closing pull-quote to present-tense challenger framing"
```

---

## Task 11: Founder section — Neil & Billy

Insert a "Built by golfers. For golfers." section after the GolfNow comparison section.

**Files:**
- Modify: `src/app/page.tsx` — insert between `</section>` of comparison table and footer

- [ ] **Step 1: Insert founder section**

Find the footer comment:
```tsx
      {/* ── Footer ────────────────────────────────────────────── */}
```
Insert before it:

```tsx
      {/* ── Founder Section ───────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] text-center mb-14">
            Built by golfers. For golfers.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">

            {/* Neil */}
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0F3D2E] flex items-center justify-center text-[#F4F1EA] text-2xl font-bold">
                N
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-lg">Neil Barris</p>
                <p className="text-sm text-[#0F3D2E] font-medium">Co-Founder</p>
              </div>
              <p className="text-sm text-[#6B7770] leading-relaxed">
                Golf entrepreneur. Founder of{' '}
                <a href="https://outing.golf" className="text-[#0F3D2E] hover:underline">Outing.golf</a>.
                Spent years watching GolfNow extract value from the courses and golfers I was trying to
                serve. TeeAhead is the fix.
              </p>
            </div>

            {/* Billy */}
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0F3D2E] flex items-center justify-center text-[#F4F1EA] text-2xl font-bold">
                B
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-lg">Billy Beslock</p>
                <p className="text-sm text-[#0F3D2E] font-medium">Co-Founder</p>
              </div>
              <p className="text-sm text-[#6B7770] leading-relaxed">
                Lifelong golfer. Career operations background at Ford. The exact recreational golfer
                TeeAhead is built for — and the one keeping the product grounded in what real members
                actually want.
              </p>
            </div>

          </div>
          <p className="mt-10 text-center text-xs text-[#6B7770]">
            TeeAhead is being built by Neil and Billy in Metro Detroit. We&apos;re talking to local courses
            now and launching in 2026.
          </p>
        </div>
      </section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add founder section with Neil and Billy bios"
```

---

## Task 12: Scroll fade-in animations

Add subtle fade-in on scroll for major sections using a lightweight client component and CSS.

**Files:**
- Create: `src/components/FadeIn.tsx`
- Modify: `src/app/page.tsx` — wrap sections with `<FadeIn>`

- [ ] **Step 1: Create FadeIn client component**

Create `src/components/FadeIn.tsx`:

```typescript
'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  delay?: number
}

export function FadeIn({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationDelay = `${delay}ms`
          el.classList.add('fade-in-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`fade-in-hidden ${className ?? ''}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Add CSS for fade-in animations**

Open `src/app/globals.css` and add these rules at the end of the file:

```css
.fade-in-hidden {
  opacity: 0;
  transform: translateY(16px);
}

.fade-in-visible {
  animation: fadeInUp 0.5s ease forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Wrap key sections in FadeIn**

In `src/app/page.tsx`, add the import at the top:
```typescript
import { FadeIn } from '@/components/FadeIn'
```

Wrap each major section's inner `div` with `<FadeIn>`. For example, the hero's inner div:
```tsx
        <div className="max-w-3xl mx-auto space-y-8">
```
Becomes:
```tsx
        <FadeIn>
        <div className="max-w-3xl mx-auto space-y-8">
          ...
        </div>
        </FadeIn>
```

Apply `<FadeIn>` to: hero inner div, two-column value props inner div, social proof inner div, how-it-works inner div, pricing inner div, comparison table inner div, founder section inner div.

- [ ] **Step 4: Add hover states to tier cards in globals.css**

```css
/* Pricing card hover lift */
.pricing-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(15, 61, 46, 0.12);
}
```

Add `pricing-card` className to each `<Card>` in the pricing section.

- [ ] **Step 5: Commit**

```bash
git add src/components/FadeIn.tsx src/app/globals.css src/app/page.tsx
git commit -m "feat: add scroll fade-in animations and pricing card hover states"
```

---

## Task 13: OG image — update with new tagline

**Files:**
- Create: `public/og-image.svg` (source)
- Replace: `public/og-image.png` (export)

- [ ] **Step 1: Create SVG source at public/og-image.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0F3D2E"/>

  <!-- T mark icon (scaled to 120px height from 108×120 original) -->
  <g transform="translate(376, 235) scale(1)">
    <path
      fill-rule="evenodd"
      fill="#F4F1EA"
      d="M 0,4 H 108 V 30 H 76 V 116 H 32 V 30 H 0 Z
         M 7,11 H 101 V 23 H 7 Z
         M 39,37 H 69 V 109 H 39 Z"
    />
    <rect x="53" y="37" width="3" height="52" fill="#F4F1EA"/>
    <path d="M 56,37 L 67,47 L 56,57 Z" fill="#F4F1EA"/>
    <!-- "eeAhead" wordmark tight to T mark -->
    <text
      x="112"
      y="92"
      font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      font-weight="700"
      font-size="80"
      fill="#F4F1EA"
      letter-spacing="-0.04em"
    >eeAhead</text>
  </g>

  <!-- Tagline -->
  <text
    x="600"
    y="430"
    text-anchor="middle"
    font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    font-weight="400"
    font-size="28"
    fill="#F4F1EA"
    opacity="0.7"
    letter-spacing="0.01em"
  >Book ahead. Play more. Own your golf.</text>
</svg>
```

- [ ] **Step 2: Export to PNG (manual)**

Open `public/og-image.svg` in a browser and use the browser's screenshot or an SVG-to-PNG tool to export at 1200×630px. Save as `public/og-image.png`, replacing the existing file.

Alternatively, if Node/sharp is available:
```bash
npx sharp-cli --input public/og-image.svg --output public/og-image.png --width 1200 --height 630
```

- [ ] **Step 3: Commit**

```bash
git add public/og-image.svg public/og-image.png
git commit -m "feat: update OG image with new tagline and bone-on-green color scheme"
```

---

## Self-Review Against Brief

**Critical issues checklist:**
- [x] Task 1 — Tagline mismatch: metadata and footer tagline updated everywhere
- [x] Task 1/4 — Footer tagline: changed to "Book ahead. Play more. Own your golf."
- [x] Tasks 2/5/6 — Logo: TeeAheadLogo component renders icon T + eeAhead correctly; no code fix needed (verify rendering in browser)
- [x] Task 2 — Hero H1/subhead: content_blocks fallbacks updated
- [x] Task 6 — GolfNow $94,500 with receipts: expanded copy with citations added
- [x] Task 2 — "Tee Ahead" → "TeeAhead": fixed in course column, scan verified

**Major improvements checklist:**
- [x] Task 5 — Compact table removed, replaced with stat cards
- [x] Task 9 — Pricing CTAs: all changed to "Join the Waitlist"
- [x] Task 9 — Fairway→Eagle nudge: added below pricing grid
- [x] Task 8 — How It Works: rewritten with waitlist-first copy
- [x] Task 3 — Header CTA: simplified to single "Join the Waitlist"
- [x] Task 10 — Pull-quote: updated to Option A

**Polish checklist:**
- [x] Task 11 — Founder section: Neil & Billy bios added
- [x] Task 7 — Social proof section: "The exodus is real" added
- [x] Task 6 — Founding partner urgency: dynamic color + threshold messaging
- [x] Task 4 — Footer: 3-column structure added
- [x] Task 13 — OG image: SVG source created with new tagline
- [x] Task 12 — Scroll animations: FadeIn component + CSS

**Not in this plan (requires separate work):**
- `/about` page (Task 11 links to it but the page doesn't exist — deferred)
- Mobile table swipe indicator (tables already have `overflow-x-auto`)
- Color/typography audit (code already uses locked palette; verify in browser)
- "Last claimed X days ago" indicator (no `claimed_at` timestamp in current schema)
