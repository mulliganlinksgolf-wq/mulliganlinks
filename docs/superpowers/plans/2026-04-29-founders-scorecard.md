# Founders' Scorecard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the handwritten-note founder section on the homepage with a golf scorecard component telling the founders' story.

**Architecture:** Extract a self-contained `FoundersScorecard` component, swap it into `page.tsx` in place of the existing founder note block, and remove the now-unused `Caveat` font import.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/components/FoundersScorecard.tsx` | Scorecard UI — all markup and styles |
| Modify | `src/app/page.tsx` | Swap founder note for `<FoundersScorecard />`, remove Caveat import |
| Create | `src/test/founders-scorecard.test.tsx` | Vitest unit tests |

---

## Task 1: Create the FoundersScorecard component

**Files:**
- Create: `src/components/FoundersScorecard.tsx`

- [ ] **Step 1: Create the component file**

```tsx
// src/components/FoundersScorecard.tsx
import Link from 'next/link'

const HOLES = [
  {
    number: 1,
    par: 'The Read',
    notes: (
      <>
        Between the two of us, we&apos;ve seen this problem from{' '}
        <em>every angle</em>. Operator and golfer. Tee sheet and tee box.
      </>
    ),
  },
  {
    number: 2,
    par: "Neil's Side",
    notes: (
      <>
        Neil spent years building <em>Outing.golf</em> inside the industry —
        watching courses get squeezed by a company that&apos;s never set foot on
        their property.
      </>
    ),
  },
  {
    number: 3,
    par: "Billy's Side",
    notes: (
      <>
        Billy&apos;s been the golfer on the other side — paying booking fees,
        watching credits expire, feeling like a transaction instead of a regular.
      </>
    ),
  },
  {
    number: 4,
    par: 'The Why',
    notes: (
      <>
        We&apos;re not building TeeAhead because the market is hot. We&apos;re
        building it because <em>we&apos;re both tired of watching it happen</em>.
      </>
    ),
    redNumber: true,
  },
  {
    number: 5,
    par: 'The Ask',
    notes: (
      <>
        If you run a course in Metro Detroit, reach out to Neil directly —{' '}
        <a
          href="mailto:neil@teeahead.com"
          className="text-[#0F3D2E] underline decoration-dotted"
        >
          neil@teeahead.com
        </a>
        . If you&apos;re a golfer who feels the same way —{' '}
        <a
          href="mailto:billy@teeahead.com"
          className="text-[#0F3D2E] underline decoration-dotted"
        >
          billy@teeahead.com
        </a>
        .
      </>
    ),
  },
]

export function FoundersScorecard() {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-center text-xs font-bold tracking-[0.14em] uppercase text-[#F4F1EA]/35 mb-10">
        Why we&apos;re building TeeAhead
      </p>

      <div
        className="bg-[#FDFAF4] rounded-sm overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="bg-[#0F3D2E] px-6 py-5">
          <div className="flex justify-between items-start">
            <div className="text-[#F4F1EA] text-xl font-bold tracking-tight">
              <span className="text-[#C9A84C] italic">T</span>eeAhead
            </div>
            <div className="text-right text-[10px] tracking-[0.12em] text-[#F4F1EA]/55 leading-relaxed uppercase">
              Est. 2026
              <br />
              Detroit · MI
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F4F1EA]/15 flex justify-between text-[10px] tracking-[0.14em] text-[#F4F1EA]/55 uppercase">
            <span>Founders&apos; Scorecard</span>
            <span>Card No. 001</span>
          </div>
        </div>

        {/* Metadata rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-[#D4E4DC]">
          <div className="px-4 py-2.5 border-r border-[#D4E4DC]">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Course
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">Metro Detroit</span>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Date
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">April 2026</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-[#0F3D2E]">
          <div className="px-4 py-2.5 border-r border-[#D4E4DC]">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Conditions
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">Tailwind</span>
          </div>
          <div className="px-4 py-2.5">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#6B7770] font-sans">
              Tee
            </span>
            <span className="text-[13px] text-[#1A1A1A] ml-2">Founders</span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[56px_80px_1fr] bg-[#0F3D2E]">
          <div className="px-3 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase">
            Hole
          </div>
          <div className="px-3 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase border-l border-[#F4F1EA]/15">
            Par
          </div>
          <div className="px-3 py-2 text-[9px] tracking-[0.14em] text-[#F4F1EA]/70 uppercase border-l border-[#F4F1EA]/15">
            Notes from the Round
          </div>
        </div>

        {/* Holes */}
        {HOLES.map((hole, i) => (
          <div
            key={hole.number}
            className={`grid grid-cols-[56px_80px_1fr] ${
              i < HOLES.length - 1 ? 'border-b border-[#D4E4DC]' : 'border-b-2 border-[#0F3D2E]'
            }`}
          >
            <div
              className={`px-3 py-4 text-[28px] font-bold text-center border-r border-[#D4E4DC] ${
                hole.redNumber ? 'text-[#C0392B]' : 'text-[#0F3D2E]'
              }`}
            >
              {hole.number}
            </div>
            <div className="px-3 py-4 border-r border-[#D4E4DC]">
              <div className="text-[9px] tracking-[0.1em] uppercase text-[#6B7770] font-sans mb-1">
                Par
              </div>
              <div className="text-[13px] font-bold text-[#1A1A1A]">{hole.par}</div>
            </div>
            <div className="px-4 py-4 text-[13px] text-[#1A1A1A] leading-relaxed">
              {hole.notes}
            </div>
          </div>
        ))}

        {/* Signatures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-[#0F3D2E]">
          <div className="px-5 py-5 border-r border-[#D4E4DC]">
            <div className="text-[22px] font-bold italic text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 mb-1.5 inline-block">
              Billy Beslock
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-[#6B7770] font-sans">
              Co-Founder
            </div>
          </div>
          <div className="px-5 py-5 text-right">
            <div className="text-[22px] font-bold italic text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 mb-1.5 inline-block">
              Neil Barris
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-[#6B7770] font-sans">
              Co-Founder
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0F3D2E] px-5 py-4 flex justify-between items-center">
          <span className="text-[10px] tracking-[0.14em] uppercase text-[#F4F1EA]/55">
            Total · Always One TeeAhead
          </span>
          <Link
            href="/waitlist/golfer"
            className="bg-[#C9A84C] text-[#0F3D2E] text-[13px] font-bold px-5 py-2.5 rounded-sm hover:bg-[#D4B86A] transition-colors"
          >
            Join the Waitlist →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/barris/Desktop/MulliganLinks && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to this file)

---

## Task 2: Write and run tests

**Files:**
- Create: `src/test/founders-scorecard.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/test/founders-scorecard.test.tsx
import { render, screen } from '@testing-library/react'
import { FoundersScorecard } from '@/components/FoundersScorecard'

test('renders the scorecard header', () => {
  render(<FoundersScorecard />)
  expect(screen.getByText(/Founders' Scorecard/i)).toBeInTheDocument()
  expect(screen.getByText(/Card No. 001/i)).toBeInTheDocument()
})

test('renders all 5 holes', () => {
  render(<FoundersScorecard />)
  expect(screen.getByText('The Read')).toBeInTheDocument()
  expect(screen.getByText("Neil's Side")).toBeInTheDocument()
  expect(screen.getByText("Billy's Side")).toBeInTheDocument()
  expect(screen.getByText('The Why')).toBeInTheDocument()
  expect(screen.getByText('The Ask')).toBeInTheDocument()
})

test('renders both email links', () => {
  render(<FoundersScorecard />)
  expect(screen.getByRole('link', { name: 'neil@teeahead.com' })).toHaveAttribute(
    'href',
    'mailto:neil@teeahead.com'
  )
  expect(screen.getByRole('link', { name: 'billy@teeahead.com' })).toHaveAttribute(
    'href',
    'mailto:billy@teeahead.com'
  )
})

test('renders both founder signatures', () => {
  render(<FoundersScorecard />)
  expect(screen.getByText('Billy Beslock')).toBeInTheDocument()
  expect(screen.getByText('Neil Barris')).toBeInTheDocument()
})

test('renders the waitlist CTA linking to /waitlist/golfer', () => {
  render(<FoundersScorecard />)
  const cta = screen.getByRole('link', { name: /Join the Waitlist/i })
  expect(cta).toHaveAttribute('href', '/waitlist/golfer')
})
```

- [ ] **Step 2: Run tests — expect FAIL (component not yet wired in, but file exists so tests should pass)**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm test -- founders-scorecard 2>&1
```

Expected: all 5 tests PASS (component exists from Task 1)

---

## Task 3: Update page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add the FoundersScorecard import**

At the top of `src/app/page.tsx`, add alongside existing component imports:

```tsx
import { FoundersScorecard } from '@/components/FoundersScorecard'
```

- [ ] **Step 2: Remove the Caveat font import and initialization**

Remove these two lines (lines ~6 and ~13):

```tsx
import { Caveat } from 'next/font/google'   // DELETE
// ...
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '600', '700'] })  // DELETE
```

- [ ] **Step 3: Replace the founder note section**

Find the `{/* ── Founder Note ── */}` section (lines ~516–592) and replace the entire block with:

```tsx
{/* ── Founders' Scorecard ──────────────────────────────── */}
<section className="bg-[#0F3D2E] px-6 py-24">
  <FadeIn>
    <FoundersScorecard />
  </FadeIn>
</section>
```

- [ ] **Step 4: Run the full test suite**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm test 2>&1 | tail -20
```

Expected: all tests pass

- [ ] **Step 5: Run a production build to verify no errors**

```bash
cd /Users/barris/Desktop/MulliganLinks && npm run build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` with no TypeScript or build errors

- [ ] **Step 6: Commit**

```bash
git add src/components/FoundersScorecard.tsx src/test/founders-scorecard.test.tsx src/app/page.tsx docs/superpowers/specs/2026-04-29-founders-scorecard-design.md docs/superpowers/plans/2026-04-29-founders-scorecard.md
git commit -m "feat: replace founder note with scorecard component"
```

---

## Task 4: Deploy to production

- [ ] **Step 1: Push to main**

```bash
git push origin main
```

Vercel is connected to this repo (project `mulliganlinks`). Pushing to `main` triggers an automatic production deploy.

- [ ] **Step 2: Verify deploy**

```bash
vercel ls --prod 2>/dev/null | head -10
```

Or monitor at the Vercel dashboard. Wait for the deployment to complete (typically 1–2 minutes), then spot-check the live homepage to confirm the scorecard renders.
