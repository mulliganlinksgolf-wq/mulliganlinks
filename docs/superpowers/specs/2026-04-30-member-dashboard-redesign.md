# Member Dashboard Redesign — Design Spec

**Date:** 2026-04-30
**Page:** `/app` (`src/app/app/page.tsx`)

---

## Overview

Replace the current stat-cards dashboard with a dark, golf-native "Round Card" — a scorecard-metaphor UI that shows the member's live stats and contextual rows based on their activity state. The shell stays consistent; the content inside adapts.

---

## Visual Design

- **Background:** `#1C1C1C` (near-black)
- **Surface cards:** `#2a2a2a`
- **Header row inside card:** `#222`
- **Accent — points/rounds:** `#FFFFFF`
- **Accent — credits:** `#E0A800` (gold)
- **Accent — positive/green:** `#8FA889`
- **CTA button:** `#1B4332` bg / `#FAF7F2` text
- **Tier badge:** Eagle = `#E0A800`, Ace = `#1B4332`/`#FAF7F2`, Fairway = `#8FA889`/`#1A1A1A`
- **Font:** serif for greeting/headline; sans-serif for scorecard rows and stats

The overall page background remains `#FAF7F2` (the layout shell). The Round Card itself is the dark block, max-width matching the existing `max-w-5xl` container.

---

## Component Structure

Extract two new components from `page.tsx`:

### `RoundCard`
Server component. Receives all data as props. Renders the full dark card: header, stats strip, scorecard rows, CTA.

### `ScorecardRows`
Pure presentational component. Receives `state: 'new' | 'active'` and `tier: 'free' | 'eagle' | 'ace'` and the relevant data, renders the correct three rows.

`page.tsx` keeps its data-fetching logic and composes these components.

---

## Data Requirements

All fetched server-side in `page.tsx`. Additions vs. current:

| Field | Source | Currently fetched? |
|---|---|---|
| `full_name` | `profiles` | ✅ |
| `tier`, `status`, `current_period_end` | `memberships` | ✅ |
| Points balance | `fairway_points` (sum) | ✅ |
| Recent bookings (last 5) | `bookings` | ✅ |
| **Credit balance (cents)** | `getAndIssueMemberCredits()` | ❌ add |
| **Upcoming booking** | `bookings` where `scheduled_at > now`, limit 1 | ❌ add |
| **Last completed booking** | `bookings` where `status = 'completed'`, limit 1 | ❌ add |

The "active vs new" state trigger is: `completedBookings.length > 0`.

---

## Card Header

```
[Round Card]                          [Eagle] ← tier badge
Hey, William.
<sub-headline — state-dependent>
```

Sub-headline copy:
- **New:** "Your scorecard's still blank. 3 holes before your first round."
- **Active (1–4 rounds):** "N rounds played. You're warming up. 🏌️"
- **Active (5–9 rounds):** "N rounds played. You're on the back nine. 🏌️"
- **Active (10+ rounds):** "N rounds played. A regular. See you out there. 🏌️"

---

## Stats Strip

3-column grid, always visible, inside the top of the card:

| Column | New member | Active member |
|---|---|---|
| **Points** | `0` (dimmed) | Live balance |
| **Credits** | `—` (dimmed) | `$X.XX` in gold |
| **Rounds** | `0` (dimmed) | Total completed |

"Dimmed" = `color: #555` instead of `#fff`/`#E0A800`. No placeholder text — just the zero/dash.

---

## Scorecard Rows

Three rows always shown. Each row has: icon/number, a short label (uppercase, muted), and a description with optional sub-line.

### New Member State (0 completed bookings)

| # | Label | Primary | Sub-line |
|---|---|---|---|
| 01 | FIND | Find a course near you | 3 partner courses within 5 miles |
| 02 | EARN | Bank your first 50 Fairway Points | 100 pts = $1 toward future bookings |
| 03 | TRY | Eagle preview — 2× points + fee waived | Upgrade — $50 less than Golf Pass |

Row 03 links to `/app/membership`.

### Active Member State (1+ completed bookings)

Row content varies by what data is available and by tier.

**Row 1 — Next tee time (▸ NEXT)**
- If upcoming booking exists: "Course Name · Day Time" / "N days away · fee waived" (Eagle/Ace) or "N days away" (Fairway)
- If no upcoming: "No round booked yet" / "Find a tee time →" (links to `/app/courses`)

**Row 2 — Last round (✓ LAST)**
- "Course Name · Mon DD" / "+N pts earned · $X paid"
- Always available once active (at least 1 completed booking)

**Row 3 — Tier-dependent**

| Tier | Icon | Label | Primary | Sub-line |
|---|---|---|---|---|
| Fairway | ↑ | UPGRADE | Go Eagle — 2× points + fee waived | $89/yr — $50 less than Golf Pass |
| Eagle | ◎ | GOAL | N pts to your next $1 credit | Book 1 more round to hit it |
| Ace | ◎ | GOAL | N pts to your next $1 credit | Book 1 more round to hit it |

Fairway row 3 links to `/app/membership`. Eagle/Ace row 3 links to `/app/points`.

Points-to-next-credit calculation: `100 - (pointsBalance % 100)` pts to the next $1 credit (100 pts = $1, matching the rate shown on `/app/points`).

---

## CTA Button

Full-width, `#1B4332`, sits below the scorecard rows inside the card.

- **New:** "⛳ Find a tee time near you" → `/app/courses`
- **Active:** "⛳ Book another tee time" → `/app/courses`

---

## What's Removed

- The existing stat-card grid (Fairway Points / Membership / Rounds Booked cards)
- The standalone "Recent bookings" list section
- The separate upgrade nudge card at the bottom (absorbed into scorecard row 3)

Recent bookings detail is still accessible via `/app/bookings` (nav link already exists).

---

## What's Unchanged

- `AppNav` — no changes
- `AppLayout` — no changes
- All other `/app/*` pages — no changes
- Auth/redirect logic in `page.tsx`

---

## States Summary

| Condition | State |
|---|---|
| 0 completed bookings | New member |
| 1+ completed bookings | Active member |
| Active + `tier = 'free'` | Row 3 = upgrade nudge |
| Active + `tier = 'eagle'` or `'ace'` | Row 3 = points goal |

---

## Out of Scope

- Animations or transitions between states
- Push notifications or real-time updates
- Any changes to the bookings, points, membership, or courses pages
- Stripe/payment flows
