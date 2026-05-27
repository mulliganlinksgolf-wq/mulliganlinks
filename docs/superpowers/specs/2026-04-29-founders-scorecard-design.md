# Founders' Scorecard — Design Spec

**Date:** 2026-04-29
**Status:** Approved

## Overview

Replace the handwritten-note section on the homepage (`/`) with a golf scorecard component that tells the founders' story. The scorecard format is more visually distinctive, brand-consistent, and on-theme than the current notebook-style note.

## What Changes

The "Founder Note" section (currently lines ~516–592 in `src/app/page.tsx`) is removed and replaced with a new `<FoundersScorecard>` component. The surrounding section wrapper (`bg-[#0F3D2E] px-6 py-24`) and `<FadeIn>` animation are preserved.

## Component Design

### Header
Dark green (`#0F3D2E`) card header with:
- TeeAhead wordmark (italic "T" in gold `#C9A84C`, rest in cream `#F4F1EA`)
- "EST. 2026 / DETROIT · MI" top-right, small caps, muted
- "FOUNDERS' SCORECARD" left / "CARD NO. 001" right, below a hairline rule

### Metadata Row
Two rows, two columns each (COURSE / DATE, CONDITIONS / TEE), bordered grid:
- Course: Metro Detroit
- Date: April 2026
- Conditions: Tailwind
- Tee: Founders

### Column Headers
Dark green bar: HOLE | PAR | NOTES FROM THE ROUND

### Holes (5 rows)
| # | Par Label | Notes |
|---|-----------|-------|
| 1 | The Read | Between the two of us, we've seen this problem from *every angle*. Operator and golfer. Tee sheet and tee box. |
| 2 | Neil's Side | Neil spent years building *Outing.golf* inside the industry — watching courses get squeezed by a company that's never set foot on their property. |
| 3 | Billy's Side | Billy's been the golfer on the other side — paying booking fees, watching credits expire, feeling like a transaction instead of a regular. |
| 4 | The Why | We're not building TeeAhead because the market is hot. We're building it because *we're both tired of watching it happen*. (Hole number rendered in red `#C0392B`) |
| 5 | The Ask | If you run a course in Metro Detroit, reach out to Neil directly — neil@teeahead.com. If you're a golfer who feels the same way — billy@teeahead.com. (Email links, dotted underline, dark green) |

### Signatures Row
Two-column grid, bold italic names, underline rule, "CO-FOUNDER" label below in small caps:
- Left: **Billy Beslock** / CO-FOUNDER
- Right: **Neil Barris** / CO-FOUNDER (right-aligned)

### Footer Bar
Dark green, full-width:
- Left: "TOTAL · ALWAYS ONE TEEAHEAD" (small caps, muted)
- Right: "Join the Waitlist →" gold CTA button (links to `/waitlist/golfer`)

## Styling

- Background card: cream `#FDFAF4`
- Grid borders: `#D4E4DC`
- Text: `#1A1A1A` (body), `#6B7770` (labels/metadata)
- Dark green: `#0F3D2E`
- Gold: `#C9A84C`
- Hole 4 number: red `#C0392B`
- Font: system serif (Georgia) for the card body; sans-serif for labels/metadata
- Hole number font size: ~28px bold
- Max width: ~700px, centered
- Box shadow: `0 8px 32px rgba(0,0,0,0.18)`
- Wrapped in existing `<FadeIn>` component

## Responsive

- On mobile, the metadata row columns stack (COURSE / DATE on separate rows)
- Signatures: stack vertically on mobile, side-by-side on sm+
- Hole table columns stay as-is (HOLE col is narrow, PAR col collapses gracefully)

## Implementation Notes

- Extract into `src/components/FoundersScorecard.tsx` (not inline in page.tsx)
- Content is hardcoded (not CMS-backed) — this is founder identity copy, not marketing copy
- Remove the `Caveat` font import from `page.tsx` if it's no longer used elsewhere
- Email links: `href="mailto:neil@teeahead.com"` and `href="mailto:billy@teeahead.com"`
- CTA button links to `/waitlist/golfer`
- No new dependencies needed
