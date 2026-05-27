# Member App — Round Card Theme Redesign

**Date:** 2026-04-30
**Scope:** All member-facing pages under `/app/*`

---

## Overview

Apply a consistent "Round Card" design language across every tab in the member app. The pattern: a dark `#1C1C1C` header block with a small uppercase label and a serif headline, followed by either dark `#2a2a2a` content rows (for data-heavy pages) or the existing light `#FAF7F2` background (for input-heavy pages). The nav stays white — it's chrome, not content.

The dashboard (`/app`) gets the deepest treatment — a full scorecard metaphor with two adaptive states. The other pages apply the same header/surface language without the scorecard rows.

---

## Design Tokens (shared across all pages)

| Token | Value | Usage |
|---|---|---|
| Dark shell | `#1C1C1C` | Header block background |
| Dark surface | `#2a2a2a` | Cards, rows, content panels |
| Dark header row | `#222` | Section labels inside dark panels |
| Light bg | `#FAF7F2` | Form pages (Profile) |
| White | `#fff` | Nav, form inputs |
| Text primary | `#FFFFFF` | Headlines on dark |
| Text muted | `#888888` | Labels, sub-lines on dark |
| Text dimmed | `#555555` | Inactive/zero stats |
| Accent green | `#8FA889` | Positive states, sub-lines |
| Accent gold | `#E0A800` | Credits, Eagle badge, highlights |
| CTA bg | `#1B4332` | Buttons, member card background |
| Divider | `#333333` | Row separators on dark |
| Tier — Fairway badge | `#8FA889` bg / `#1A1A1A` text |
| Tier — Eagle badge | `#E0A800` bg / `#1A1A1A` text |
| Tier — Ace badge | `#1B4332` bg / `#FAF7F2` text |
| Font — headlines | Tailwind `font-serif` (Georgia fallback) |
| Font — body/labels | Tailwind `font-sans` (default) |

---

## Page 1 — Dashboard (`/app`)

### Component Structure

Extract two new components from `page.tsx`:

**`RoundCard`** — server component. Receives all data as props. Renders the full dark card: header, stats strip, scorecard rows, CTA.

**`ScorecardRows`** — pure presentational. Receives `state: 'new' | 'active'` and `tier: 'free' | 'eagle' | 'ace'` plus relevant data. Renders the correct three rows.

`page.tsx` keeps all data-fetching and composes these components.

### Data Requirements

| Field | Source | Currently fetched? |
|---|---|---|
| `full_name` | `profiles` | ✅ |
| `tier`, `status`, `current_period_end` | `memberships` | ✅ |
| Points balance | `fairway_points` (sum) | ✅ |
| Recent bookings (last 5) | `bookings` | ✅ |
| **Credit balance (cents)** | `getAndIssueMemberCredits()` | ❌ add |
| **Upcoming booking** | `bookings` where `scheduled_at > now`, limit 1 | ❌ add |
| **Last completed booking** | `bookings` where `status = 'completed'`, limit 1 | ❌ add |

Active vs new state trigger: `completedBookings.length > 0`.

### Card Header

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

### Stats Strip

3-column grid inside the top of the card:

| Column | New member | Active member |
|---|---|---|
| **Points** | `0` (dimmed `#555`) | Live balance, white |
| **Credits** | `—` (dimmed) | `$X.XX` in gold |
| **Rounds** | `0` (dimmed) | Total completed, white |

### Scorecard Rows — New Member (0 completed bookings)

| # | Label | Primary | Sub-line |
|---|---|---|---|
| 01 | FIND | Find a course near you | 3 partner courses within 5 miles |
| 02 | EARN | Bank your first 50 Fairway Points | 100 pts = $1 toward future bookings |
| 03 | TRY | Eagle preview — 2× points + fee waived | Upgrade — $50 less than Golf Pass |

Row 03 links to `/app/membership`.

### Scorecard Rows — Active Member (1+ completed bookings)

**Row 1 — ▸ NEXT**
- Upcoming booking exists: "Course Name · Day Time" / "N days away · fee waived" (Eagle/Ace) or "N days away" (Fairway)
- No upcoming: "No round booked yet" / "Find a tee time →" → `/app/courses`

**Row 2 — ✓ LAST**
- "Course Name · Mon DD" / "+N pts earned · $X paid"

**Row 3 — tier-dependent**

| Tier | Icon | Label | Primary | Sub-line | Link |
|---|---|---|---|---|---|
| Fairway | ↑ | UPGRADE | Go Eagle — 2× points + fee waived | $89/yr — $50 less than Golf Pass | `/app/membership` |
| Eagle | ◎ | GOAL | N pts to your next $1 credit | Book 1 more round to hit it | `/app/points` |
| Ace | ◎ | GOAL | N pts to your next $1 credit | Book 1 more round to hit it | `/app/points` |

Points-to-next-credit: `100 - (pointsBalance % 100)` (100 pts = $1).

### CTA Button

Full-width `#1B4332`, below the scorecard rows:
- New: "⛳ Find a tee time near you" → `/app/courses`
- Active: "⛳ Book another tee time" → `/app/courses`

### What's Removed

- Existing stat-card grid (Fairway Points / Membership / Rounds Booked)
- Standalone "Recent bookings" list section
- Separate upgrade nudge card at the bottom

---

## Page 2 — Courses (`/app/courses`)

### Header Block (dark)

```
[Partner Courses]
Find your round.
Zero booking fees, always.
```

### Course Cards

Replace current white `Card` components with dark `#2a2a2a` cards:
- Image area: `#1B4332` placeholder with ⛳ (or actual hero image)
- Course name: white, `font-semibold`
- City/state: `#888`
- Price: `#8FA889` ("From $X.XX")
- Hover: `#333` background (subtle lift)

Grid layout unchanged: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

Empty state: dark `#2a2a2a` panel with white/muted text.

---

## Page 3 — Bookings (`/app/bookings`)

### Header Block (dark)

```
[My Bookings]
Your rounds.
```

### Booking Rows

Replace current white cards with dark `#2a2a2a` scorecard-style rows, grouped by section:

Section labels (`#222` bg, `#555` text, `8px` uppercase):
- **UPCOMING** — confirmed bookings with `scheduled_at > now`
- **PAST** — everything else

Each row (full-width, separated by `#333` divider):
- Left: course name (white, `font-semibold`) + date/time + players (`#888`)
- Right: price (white) + status chip
- Upcoming rows: sub-line in `#8FA889` ("N days away · confirmed")
- Past rows: sub-line in `#555` ("+N pts earned · completed")
- Rows are links to `/app/bookings/[id]`

Status chips adapt colors: confirmed = `#8FA889` text, completed = `#888`, cancelled = muted red.

Empty state: dark panel with "No bookings yet" + CTA button.

---

## Page 4 — Points (`/app/points`)

### Header Block (dark)

Three inline stats in the header (no separate cards):
- Points balance — white, large serif number
- Credit ready — gold `#E0A800`
- Earn rate — white (e.g. "1.5×")

Sub-line: "100 pts = $1 toward future rounds."

### Transaction History

Replace current white table with dark `#2a2a2a` panel:
- Section label: "HISTORY" in `#222` bg
- Each row: reason + course + date on left, `+N` / `-N` on right (`#8FA889` for positive, muted red for negative)
- Separated by `#333` dividers

Empty state: dark panel with "No transactions yet."

---

## Page 5 — My Card (`/app/card`)

Already close to the theme. Changes are minor:

- Wrap the existing card + "How it works" section in a dark `#1C1C1C` shell
- Header label: `[Member Card]` in the standard uppercase style
- "How it works" section: move from white `ring-1` card to dark `#2a2a2a` panel, text `#ddd`
- Upgrade nudge for Fairway tier: dark `#2a2a2a` panel with gold `#E0A800` text accent (currently `#E0A800/10` bg — harmonise with the new surface)
- The physical member card itself (`#1B4332` background) is unchanged

---

## Page 6 — Profile (`/app/profile`)

### Header Block (dark)

```
[Profile]
William Barris
Eagle Member · Member since April 2025
```

Membership tier shown in gold/green text (not a badge — inline, muted).

### Form Area

Stays light (`#FAF7F2` background, white inputs) — better UX for text input against a light background. No dark inputs.

`ProfileForm` component itself is unchanged. Only the page wrapper gets the dark header above it.

---

## Page 7 — Membership (`/app/membership`)

### Header Block (dark)

```
[Membership]
Upgrade your game.
Currently on Fairway (free).   ← or "You're on Eagle." for paid members
```

### Tier Cards

Replace white `ring-2` cards with dark `#2a2a2a` cards:
- Recommended tier (Eagle for Fairway members): `border: 1px solid #E0A800`
- Current tier: `border: 1px solid #555`, "Current plan" label instead of button
- Tier name: colored by tier (`#E0A800` Eagle, `#8FA889` Ace)
- Price: white, large serif
- Feature list: `#888` text, `#8FA889` checkmarks
- CTA button: `#E0A800` bg / `#1A1A1A` text for recommended; `#333` bg / `#888` text for secondary

`FoundingGolferBanner` component: currently uses `bg-[#E0A800]/15 border-[#E0A800]/40` on a light page. On the dark membership page, keep the gold border but change bg to `bg-[#E0A800]/10` and text colors to `text-[#FAF7F2]` / `text-[#aaa]` so it reads on `#2a2a2a`.

---

## Shared Rules

1. **Nav stays white.** `AppNav` is unchanged — it's chrome, not content.
2. **`AppLayout` background stays `#FAF7F2`.** The dark card sits on the cream — it contrasts intentionally.
3. **No dark inputs.** Form fields always use white/light backgrounds for readability.
4. **All pages are server components.** No client-side state added.
5. **No new routes or DB schema changes** beyond what Page 1 requires.

---

## What's Out of Scope

- Animations or transitions
- Individual booking detail page (`/app/bookings/[id]`)
- Individual course detail page (`/app/courses/[slug]`)
- Booking flow (`/app/book/[teeTimeId]`)
- Any admin, course portal, or public marketing pages
- Stripe/payment flows
