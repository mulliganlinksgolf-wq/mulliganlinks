# Course Reports — New Report Pages Design

**Date:** 2026-05-09
**Status:** Approved

## Overview

Add 5 new standalone report pages to the course portal reports hub at `/course/[slug]/reports/`. Each report follows the existing pattern: a card on the hub page links to a dedicated page with KPI tiles, a chart, and a CSV-exportable data table.

---

## Architecture

### Pattern
All 5 reports follow the existing structure exactly:
- **Hub card** added to `/src/app/course/[slug]/reports/page.tsx`
- **Page** at `/src/app/course/[slug]/reports/[report-slug]/page.tsx` — server component, fetches data server-side
- **Chart component** co-located alongside the page file (e.g., `UtilizationChart.tsx`)
- **Shared components** reused: `KpiTile`, `CsvExportButton`, `DateRangePicker` from `src/components/reports/`

### Data Sources
All data comes from existing tables — no new tables required:
- `tee_time_bookings` → utilization, comp rounds
- `member_courses` + `tee_time_bookings` → repeat visits, loyalty
- `guest_passes` + `members` + `referral_clicks` → guest/referral activity
- `comp_rounds` → comp tracker
- `leagues` + `league_members` + `tee_time_bookings` → league performance

### Metrics logic
New query functions added to `src/lib/reports/courseMetrics.ts`. If that file exceeds ~300 lines after additions, split into `src/lib/reports/courseReports.ts` and update imports.

---

## Report Pages

### 1. Tee Sheet Utilization — `/reports/utilization`

**Purpose:** Show course operators when TeeAhead members are booking — are they filling slow times or crowding peak hours?

**KPI tiles:**
- Peak day of week
- Peak time slot
- Average party size
- % of bookings in off-peak hours (before 10am or after 3pm)

**Chart:** Heatmap grid — days of week (columns) × time slots in 1-hour buckets (rows), color intensity = booking count. Implemented as a CSS grid with Tailwind background-opacity classes (recharts doesn't have a native heatmap; CSS grid is simpler and more performant here).

**Table:** Monthly summary — month, total rounds, peak day, peak slot, avg party size. CSV export.

---

### 2. Member Loyalty & Repeat Visits — `/reports/loyalty`

**Purpose:** Show how often members return. Helps GMs identify their best members and spot at-risk ones going quiet.

**KPI tiles:**
- Avg visits per member per month
- % of members with 3+ visits in date range
- Single-visit members (visited only once)
- Most frequent visitor (name + visit count)

**Chart:** Bar chart — visit frequency distribution bucketed as 1×, 2×, 3×, 4×, 5+× visits.

**Table:** Top 20 most frequent visitors — member name, tier, total visits, last visit date. CSV export.

---

### 3. Guest Pass & Referral Activity — `/reports/guests`

**Purpose:** Close the loop on whether TeeAhead is actually bringing the course new golfers.

**KPI tiles:**
- Guest passes redeemed at this course
- Guest-to-member conversion count
- Members acquired via this course's referral link
- Total new-golfer attributions (conversions + referrals)

**Chart:** Monthly bar chart — guest pass redemptions per month.

**Table:** Referral/conversion detail — member name, source (guest pass / referral link), join date, tier. CSV export.

---

### 4. Comp Rounds Tracker — `/reports/comps`

**Purpose:** Help ops teams manage comp round exposure and see redemption patterns.

**KPI tiles:**
- Comp rounds issued (date range)
- Comp rounds redeemed
- Redemption rate (%)
- Estimated cost (redeemed rounds × course's avg green fee)

**Chart:** Monthly trend line — comps issued vs. redeemed per month.

**Table:** Per-member comp usage — member name, tier, comps issued, comps redeemed, last redemption date. CSV export.

---

### 5. League Performance — `/reports/leagues`

**Purpose:** Summarize league activity and revenue contribution at this course — data the course has no other way to see aggregated.

**KPI tiles:**
- Active leagues at this course
- Total league rounds played (date range)
- Total league members
- Estimated revenue contribution (league rounds × course's average green fee derived from revenue report data)

**Chart:** None needed — data is naturally tabular.

**Table:** League breakdown — league name, members, rounds played, holes (9/18), last activity date. CSV export.

---

## Hub Page Updates

5 new cards added to the existing grid in `/src/app/course/[slug]/reports/page.tsx`:

| Title | Description | Route |
|---|---|---|
| Tee Sheet Utilization | When members book — peak days, times, party size | `/reports/utilization` |
| Member Loyalty | Repeat visit rates and your most frequent visitors | `/reports/loyalty` |
| Guest Passes & Referrals | Guest redemptions, conversions, and referral attribution | `/reports/guests` |
| Comp Rounds | Comps issued vs. redeemed and estimated cost | `/reports/comps` |
| League Performance | Active leagues, rounds played, and revenue contribution | `/reports/leagues` |

---

## Error Handling

- All pages handle empty state (no data in date range) with a friendly message, consistent with existing report pages.
- Date range defaults to current month, consistent with existing reports.
- CSV export disabled (grayed out) when table is empty.

---

## Testing

- Vitest unit tests for each new metrics function in `courseMetrics.ts`
- Playwright E2E test: navigate to hub → click each new card → verify KPI tiles render and table has rows (using seeded test data)
