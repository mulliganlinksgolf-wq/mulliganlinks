# Sprint 5 — Self-Grouping for Solo Golfers (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let solo golfers (and 2- / 3-somes) join an existing partial tee time. Auto-link them into one group and email all parties 17 hours before tee-off with first names of the people they'll be playing with.

**Architecture:**
- Capacity stays gated by the existing `tee_times.available_players` counter (single source of truth for the UI). A new trigger acts as a safety net on `bookings` so a buggy code path cannot overbook.
- Group linkage uses a new `bookings.booking_group_id uuid` column. For solo / own-group bookings, it defaults to the booking's own id; when joining an existing slot, it inherits the host group's id. This makes "who am I paired with" unambiguous regardless of cancellations.
- Per-day disable lives in a new `course_tee_sheet_overrides` table (the `course_operating_days` table referenced in the original spec does not exist in this codebase).
- Pairing notifications are **email-only in v1**. SMS is deferred until `src/lib/sms.ts` is built (separate sprint).
- Privacy floor: notifications include first names only, parsed from `profiles.full_name`.

**Tech Stack:** Next.js 15 App Router (project-customized — see AGENTS.md), Supabase Postgres, Vitest, Playwright, Resend, Vercel Cron.

**Prerequisites assumed shipped:** none beyond what is currently in `main` as of migration 090.

**Explicitly NOT in scope:**
- Split-tee (`tee_start = 'front' | 'back'`) — original spec referenced a "Sprint 1" that has not shipped. All `tee_start` references stripped from this plan.
- SMS pairing notifications — deferred until SMS primitive sprint lands.
- Handicap matching, in-app chat, host opt-in, partial-refund logic, solo waitlist — all deferred to V1.1 per original spec.

---

## File Structure

**Schema:**
- Create: `supabase/migrations/091_self_grouping.sql`

**Server:**
- Create: `src/lib/tee-time-availability.ts` — partial-slot lookup helper
- Create: `src/lib/pairing-notifications.ts` — email pairing-notification dispatcher
- Modify: `src/app/actions/booking.ts` — extend `createPendingBooking` and `confirmBooking` with `joinExistingGroup` flag
- Create: `src/app/api/cron/pairing-notifications/route.ts` — daily cron handler
- Modify: `vercel.json` — register the cron

**UI:**
- Modify: `src/app/app/courses/[slug]/page.tsx` — golfer slot-list page, add "Join existing group" toggle and partial-slot filter
- Modify: `src/app/app/book/[teeTimeId]/page.tsx` — booking-confirmation page, read `?join=1` query param, show explainer, pass through to action
- Modify: `src/app/course/[slug]/tee-times/settings/page.tsx` — add self-grouping toggle + max-players control
- Identified in Task 0: course tee sheet day view — add Self-grouped badge + per-day-disable button

**Tests:**
- Create: `src/lib/tee-time-availability.test.ts`
- Create: `src/lib/pairing-notifications.test.ts`
- Create: `tests/e2e/self-grouping.spec.ts`

---

### Task 0: Locate the staff tee-sheet day view

This task is read-only. The badge + per-day disable button in Task 6 land on the staff-facing day view, but its exact path is not yet pinned. Lock it now.

**Files:**
- Read only

- [ ] **Step 1: Find the staff tee-sheet day view**

Run:
```bash
grep -rln "tee_times\|TeeTime\|scheduled_at" src/app/course/\[slug\]/ --include="*.tsx" | head -20
```

The most likely candidates are `src/app/course/[slug]/dashboard/page.tsx`, `src/app/course/[slug]/tee-times/create/page.tsx`, or a page under `src/app/course/[slug]/bookings/`. Open the top 2-3 hits and identify the one that renders a list of slots with their bookings for a chosen date.

**Record the path here in this document** (edit Task 6 to use it) before continuing to Task 1. If no such page exists today, create it as `src/app/course/[slug]/tee-sheet/page.tsx` in Task 6.

No commit on this task — verification gate.

---

### Task 1: Migration 091 — schema additions

**Files:**
- Create: `supabase/migrations/091_self_grouping.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- Migration 091: Self-grouping for solo golfers
-- ============================================================

-- 1. Course-level toggle and max-players
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS allow_self_grouping BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS max_players_per_tee_time SMALLINT NOT NULL DEFAULT 4
    CHECK (max_players_per_tee_time BETWEEN 1 AND 5);

-- 2. Per-day override table (course_operating_days does not exist in this schema)
CREATE TABLE IF NOT EXISTS course_tee_sheet_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  self_grouping_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, override_date)
);

CREATE INDEX IF NOT EXISTS idx_course_tee_sheet_overrides_course_date
  ON course_tee_sheet_overrides (course_id, override_date);

ALTER TABLE course_tee_sheet_overrides ENABLE ROW LEVEL SECURITY;

-- Course staff can read/write overrides for their own course
CREATE POLICY "course_staff_overrides_select"
  ON course_tee_sheet_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_staff cs
      WHERE cs.course_id = course_tee_sheet_overrides.course_id
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "course_staff_overrides_modify"
  ON course_tee_sheet_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_staff cs
      WHERE cs.course_id = course_tee_sheet_overrides.course_id
        AND cs.user_id = auth.uid()
    )
  );

-- Anyone with a confirmed booking can READ the override for their slot (booking page check)
CREATE POLICY "public_overrides_select_for_booking"
  ON course_tee_sheet_overrides FOR SELECT
  USING (true);

-- 3. Bookings: group linkage + self-grouped flag + notification tracking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_group_id UUID,
  ADD COLUMN IF NOT EXISTS is_self_grouped BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pairing_notification_sent_at TIMESTAMPTZ;

-- Backfill: for existing bookings, group_id = id (each booking is its own group)
UPDATE bookings SET booking_group_id = id WHERE booking_group_id IS NULL;
ALTER TABLE bookings ALTER COLUMN booking_group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_group_id
  ON bookings (booking_group_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pairing_notification_pending
  ON bookings (pairing_notification_sent_at)
  WHERE pairing_notification_sent_at IS NULL AND is_self_grouped = TRUE;

-- 4. Real-time occupancy view (no tee_start dimension — split-tee not shipped)
CREATE OR REPLACE VIEW tee_time_occupancy AS
SELECT
  tt.id AS tee_time_id,
  tt.course_id,
  tt.scheduled_at,
  tt.max_players,
  COALESCE(SUM(b.players), 0)::INTEGER AS players_booked,
  (tt.max_players - COALESCE(SUM(b.players), 0))::INTEGER AS spots_remaining,
  ARRAY_AGG(b.id) FILTER (WHERE b.id IS NOT NULL) AS booking_ids,
  BOOL_OR(b.is_self_grouped) AS has_self_grouped_bookings
FROM tee_times tt
LEFT JOIN bookings b
  ON b.tee_time_id = tt.id
  AND b.status NOT IN ('canceled', 'no_show')
GROUP BY tt.id, tt.course_id, tt.scheduled_at, tt.max_players;

GRANT SELECT ON tee_time_occupancy TO anon, authenticated;

-- 5. Safety-net capacity trigger (status uses one-L 'canceled')
CREATE OR REPLACE FUNCTION enforce_tee_time_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_max INTEGER;
BEGIN
  IF NEW.status IN ('canceled', 'no_show') THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(SUM(players), 0) + NEW.players,
    tt.max_players
  INTO v_total, v_max
  FROM bookings b
  RIGHT JOIN tee_times tt ON tt.id = NEW.tee_time_id
  WHERE (b.tee_time_id = NEW.tee_time_id
         AND b.status NOT IN ('canceled', 'no_show')
         AND b.id != NEW.id)
     OR b.id IS NULL
  GROUP BY tt.max_players;

  IF v_total > v_max THEN
    RAISE EXCEPTION 'Tee time capacity exceeded: % players would be in slot, max %', v_total, v_max
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_tee_time_capacity ON bookings;
CREATE TRIGGER trg_enforce_tee_time_capacity
  BEFORE INSERT OR UPDATE OF players, status, tee_time_id ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_tee_time_capacity();

COMMENT ON COLUMN bookings.booking_group_id IS
  'Groups bookings that share a tee time. Solo/own-group bookings have group_id = id. Joined bookings inherit the host group_id.';
COMMENT ON COLUMN bookings.is_self_grouped IS
  'True when this booking shares its tee time with at least one other separately-booked party.';
```

- [ ] **Step 2: Apply locally and confirm**

Run:
```bash
npx supabase db reset
```
Expected: no errors. If `course_staff` table doesn't exist by that exact name in this codebase, RLS policies will fail — open the migration that creates it and substitute the correct table/column names.

- [ ] **Step 3: Verify the view returns sensible rows**

Run:
```bash
npx supabase db execute --query "SELECT tee_time_id, players_booked, spots_remaining FROM tee_time_occupancy LIMIT 5;"
```
Expected: 5 rows, `spots_remaining` between 0 and `max_players`.

- [ ] **Step 4: Verify the trigger blocks overbooking**

Run:
```bash
npx supabase db execute --query "
  -- Pick any tee_time and try to insert a booking that overflows it
  WITH t AS (SELECT id, max_players FROM tee_times LIMIT 1)
  INSERT INTO bookings (tee_time_id, user_id, players, status, booking_group_id, course_id)
  SELECT t.id, '00000000-0000-0000-0000-000000000000', t.max_players + 1, 'confirmed', gen_random_uuid(),
         (SELECT course_id FROM tee_times WHERE id = t.id)
  FROM t;
"
```
Expected: error `Tee time capacity exceeded: ...`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/091_self_grouping.sql
git commit -m "feat(self-grouping): migration 091 — group_id, override table, capacity trigger"
```

---

### Task 2: Availability helper

**Files:**
- Create: `src/lib/tee-time-availability.ts`
- Test: `src/lib/tee-time-availability.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/tee-time-availability.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeAvailability } from './tee-time-availability';

describe('computeAvailability (pure transform)', () => {
  it('flags an empty slot as not partial, not full, with all spots open', () => {
    const out = computeAvailability({
      tee_time_id: 't1',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 0,
      spots_remaining: 4,
      has_self_grouped_bookings: false,
    });
    expect(out).toEqual({
      teeTimeId: 't1',
      scheduledAt: '2026-06-01T13:00:00Z',
      spotsRemaining: 4,
      isFull: false,
      isPartiallyBooked: false,
      hasSelfGroupedBookings: false,
    });
  });

  it('flags a 3-of-4 slot as partial with 1 spot open', () => {
    const out = computeAvailability({
      tee_time_id: 't2',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 3,
      spots_remaining: 1,
      has_self_grouped_bookings: true,
    });
    expect(out.isPartiallyBooked).toBe(true);
    expect(out.isFull).toBe(false);
    expect(out.spotsRemaining).toBe(1);
  });

  it('flags a 4-of-4 slot as full, not partial', () => {
    const out = computeAvailability({
      tee_time_id: 't3',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 4,
      spots_remaining: 0,
      has_self_grouped_bookings: false,
    });
    expect(out.isFull).toBe(true);
    expect(out.isPartiallyBooked).toBe(false);
  });

  it('clamps negative spots_remaining to 0 (defensive)', () => {
    const out = computeAvailability({
      tee_time_id: 't4',
      scheduled_at: '2026-06-01T13:00:00Z',
      max_players: 4,
      players_booked: 5,
      spots_remaining: -1,
      has_self_grouped_bookings: false,
    });
    expect(out.spotsRemaining).toBe(0);
    expect(out.isFull).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run:
```bash
npx vitest run src/lib/tee-time-availability.test.ts
```
Expected: FAIL — `computeAvailability` not defined.

- [ ] **Step 3: Write the helper**

```typescript
// src/lib/tee-time-availability.ts
import { createClient } from '@/lib/supabase/server';

export type OccupancyRow = {
  tee_time_id: string;
  scheduled_at: string;
  max_players: number;
  players_booked: number;
  spots_remaining: number;
  has_self_grouped_bookings: boolean;
};

export type TeeTimeAvailability = {
  teeTimeId: string;
  scheduledAt: string;
  spotsRemaining: number;
  isFull: boolean;
  isPartiallyBooked: boolean;
  hasSelfGroupedBookings: boolean;
};

export function computeAvailability(row: OccupancyRow): TeeTimeAvailability {
  const spots = Math.max(0, row.spots_remaining);
  return {
    teeTimeId: row.tee_time_id,
    scheduledAt: row.scheduled_at,
    spotsRemaining: spots,
    isFull: spots === 0,
    isPartiallyBooked: row.players_booked > 0 && spots > 0,
    hasSelfGroupedBookings: !!row.has_self_grouped_bookings,
  };
}

export async function getAvailability(params: {
  courseId: string;
  date: string; // YYYY-MM-DD, interpreted UTC
}): Promise<TeeTimeAvailability[]> {
  const supabase = await createClient();
  const start = `${params.date}T00:00:00Z`;
  const end = `${params.date}T23:59:59Z`;

  const { data, error } = await supabase
    .from('tee_time_occupancy')
    .select('tee_time_id, scheduled_at, max_players, players_booked, spots_remaining, has_self_grouped_bookings')
    .eq('course_id', params.courseId)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at');

  if (error) throw error;
  return (data ?? []).map(computeAvailability);
}
```

- [ ] **Step 4: Run the test, watch it pass**

Run:
```bash
npx vitest run src/lib/tee-time-availability.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tee-time-availability.ts src/lib/tee-time-availability.test.ts
git commit -m "feat(self-grouping): availability helper for partial-slot lookup"
```

---

### Task 3: Extend `confirmBooking()` and `createPendingBooking()` for join mode

**Files:**
- Modify: `src/app/actions/booking.ts`

**Context:** the existing booking action assumes the user is booking their own slot. We extend it to accept `joinExistingGroup: true`. In join mode, the action looks up the host group's `booking_group_id` from existing bookings on that slot and inherits it. The capacity trigger (Task 1) blocks any race that would overflow the slot.

- [ ] **Step 1: Read the current action**

Open `src/app/actions/booking.ts`. Locate `createPendingBooking` and `confirmBooking`. Read their parameter shape and the field list passed to `.insert({...})`.

- [ ] **Step 2: Add the `joinExistingGroup` param to `createPendingBooking`**

Find the function's signature and the body where it inserts the booking row. Extend in two places.

Signature change (the exact parameter type lives near the top of `booking.ts` — extend the existing input type):

```typescript
// Existing input type — add the join flag
type CreatePendingBookingInput = {
  teeTimeId: string;
  players: number;
  // ... existing fields ...
  joinExistingGroup?: boolean;
};
```

Body — before the `.insert()` call, look up the host group_id when in join mode:

```typescript
let bookingGroupId: string | null = null;
let isSelfGrouped = false;

if (input.joinExistingGroup) {
  // Verify the course + day allow self-grouping
  const { data: tt } = await supabase
    .from('tee_times')
    .select('id, scheduled_at, course_id, available_players, courses!inner(allow_self_grouping)')
    .eq('id', input.teeTimeId)
    .single();

  if (!tt) return { error: 'Tee time not found' };
  if (!tt.courses.allow_self_grouping) return { error: 'Self-grouping disabled for this course' };
  if (tt.available_players < input.players) return { error: 'slot_filled' };

  // Per-day override
  const dateKey = tt.scheduled_at.slice(0, 10);
  const { data: override } = await supabase
    .from('course_tee_sheet_overrides')
    .select('self_grouping_disabled')
    .eq('course_id', tt.course_id)
    .eq('override_date', dateKey)
    .maybeSingle();

  if (override?.self_grouping_disabled) {
    return { error: 'Self-grouping disabled for this date' };
  }

  // Inherit host group id (or start a new group if joining an empty slot — defensive)
  const { data: existing } = await supabase
    .from('bookings')
    .select('booking_group_id')
    .eq('tee_time_id', input.teeTimeId)
    .not('status', 'in', '(canceled,no_show)')
    .limit(1);

  if (existing && existing.length > 0) {
    bookingGroupId = existing[0].booking_group_id;
    isSelfGrouped = true;
  }
}
```

In the actual `.insert({...})` call, add these fields:

```typescript
.insert({
  // ... existing fields ...
  booking_group_id: bookingGroupId ?? undefined, // null lets DB default to gen_random_uuid()
  is_self_grouped: isSelfGrouped,
})
```

**Important:** if `bookingGroupId` is null AND the user is NOT joining, the column needs a value (it was set NOT NULL in migration 091). Set it to `crypto.randomUUID()` so each new own-group booking gets a unique id:

```typescript
booking_group_id: bookingGroupId ?? crypto.randomUUID(),
```

- [ ] **Step 3: After insert, flag the rest of the group as self-grouped**

Immediately after the successful insert in join mode:

```typescript
if (input.joinExistingGroup && newBookingId && bookingGroupId) {
  await supabase
    .from('bookings')
    .update({ is_self_grouped: true })
    .eq('booking_group_id', bookingGroupId)
    .neq('id', newBookingId);
}
```

- [ ] **Step 4: Handle the capacity-trigger error from Supabase**

Postgres raises SQLSTATE `23514` from the trigger. Map it to `'slot_filled'`:

```typescript
if (insertError) {
  if (insertError.code === '23514' || insertError.message?.includes('Tee time capacity exceeded')) {
    return { error: 'slot_filled' };
  }
  return { error: insertError.message };
}
```

- [ ] **Step 5: Make the same join-mode logic available in `confirmBooking()`**

`confirmBooking()` finalizes the row. If `createPendingBooking` already set `booking_group_id` and `is_self_grouped`, no change needed. Confirm by reading the function and verifying it does not overwrite those columns on update.

If `confirmBooking` does a full row rewrite, preserve the two new columns by explicitly passing them through:

```typescript
.update({
  status: 'confirmed',
  // ... existing fields ...
  // booking_group_id and is_self_grouped are already set by createPendingBooking, do not overwrite
})
```

- [ ] **Step 6: Verify by typescript**

Run:
```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/actions/booking.ts
git commit -m "feat(self-grouping): extend booking actions with joinExistingGroup mode"
```

---

### Task 4: Booking UI — "Join existing group" mode

**Files:**
- Modify: `src/app/app/courses/[slug]/page.tsx` — slot-list page (golfer picks a date + slot here)
- Modify: `src/app/app/book/[teeTimeId]/page.tsx` — booking-confirmation page (reads `?join=1`)

**Context:** the slot-list page (`/app/courses/[slug]`) is where the user browses available times — that's where the toggle lives. Clicking a slot navigates to `/app/book/[teeTimeId]?join=1` for confirmation.

- [ ] **Step 1: Add a "Join existing group" toggle to the list page**

At the top of the list:

```tsx
<div className="flex items-center gap-2 mb-4">
  <Switch
    id="join-toggle"
    checked={joinMode}
    onCheckedChange={setJoinMode}
  />
  <label htmlFor="join-toggle" className="text-sm">
    Join an existing group <span className="text-muted-foreground">— show slots with at least one open spot in a partial group</span>
  </label>
</div>
```

State:
```tsx
const [joinMode, setJoinMode] = useState(false);
```

- [ ] **Step 2: Filter the slot list by `isPartiallyBooked` in join mode**

The list already reads tee_times. Switch it to read from `tee_time_occupancy` via the new helper. Where the slots are mapped:

```tsx
const visibleSlots = joinMode
  ? slots.filter(s => s.isPartiallyBooked)
  : slots.filter(s => !s.isFull);
```

For each slot, when `joinMode` is true, render the spots-remaining badge:

```tsx
{joinMode && (
  <Badge variant="secondary">
    {slot.spotsRemaining} {slot.spotsRemaining === 1 ? 'spot' : 'spots'} open
  </Badge>
)}
```

- [ ] **Step 3: Pass `joinExistingGroup` through to the booking confirmation page**

When the user clicks a slot in join mode, navigate with a query param:

```tsx
<Link href={`/app/book/${slot.teeTimeId}?join=1`}>
  Book this slot
</Link>
```

- [ ] **Step 4: In `/app/book/[teeTimeId]/page.tsx`, read the param and clamp players**

```tsx
const searchParams = useSearchParams();
const joinMode = searchParams.get('join') === '1';
```

In join mode, cap the player selector at `spotsRemaining` (fetch via `getAvailability` for the slot's date, or extend the page's existing tee_time query to also return the occupancy row).

Add an explainer below the selector:

```tsx
{joinMode && (
  <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm">
    <p className="font-medium">You're joining an existing group.</p>
    <p className="mt-1 text-muted-foreground">
      We'll email everyone the day before with first names so you know who you're playing with.
      Names only — no contact info is shared.
    </p>
  </div>
)}
```

- [ ] **Step 5: Pass `joinExistingGroup: true` to the booking action**

In whatever form submit / payment-confirm handler this page uses, include the flag in the `createPendingBooking` / `confirmBooking` call.

- [ ] **Step 6: Hide the toggle when the course/day disables self-grouping**

Pull `course.allow_self_grouping` and the override (if any) for the visible date. If either says no, do not render the toggle.

- [ ] **Step 7: Manual smoke test**

```bash
npm run dev
```
Open `/app/courses/<some-slug>` (or wherever the slot list lives). Confirm:
- Toggle visible when course allows self-grouping
- Toggling on filters to partial slots and shows "X spots open"
- Clicking a slot navigates to `/app/book/<id>?join=1`
- Confirmation page shows the join explainer
- Selecting more players than `spotsRemaining` is blocked

- [ ] **Step 8: Commit**

```bash
git add src/app/app/courses/\[slug\]/page.tsx src/app/app/book/\[teeTimeId\]/page.tsx
git commit -m "feat(self-grouping): golfer booking UI — join existing group mode"
```

---

### Task 5: Course-side self-grouping toggle

**Files:**
- Modify: `src/app/course/[slug]/tee-times/settings/page.tsx`

**Context:** this page already houses cart_policy and advance-booking config (migration 022). Self-grouping settings belong here next to those.

- [ ] **Step 1: Read the existing page**

Open `src/app/course/[slug]/tee-times/settings/page.tsx`. Identify how the existing form reads from / writes to the `courses` (or `course_tee_sheet_config`) table.

- [ ] **Step 2: Add a "Self-Grouping" section to the form**

```tsx
<section className="rounded-lg border p-6 space-y-4">
  <div>
    <h2 className="text-lg font-semibold">Self-Grouping</h2>
    <p className="text-sm text-muted-foreground">
      Let solo golfers and small groups join existing partial tee times.
      Their group gets emailed the day before with first names of who they'll be paired with.
    </p>
  </div>

  <div className="flex items-center gap-3">
    <Switch
      id="allow-self-grouping"
      checked={settings.allow_self_grouping}
      onCheckedChange={(v) => setSettings({ ...settings, allow_self_grouping: v })}
    />
    <label htmlFor="allow-self-grouping" className="text-sm">
      Allow self-grouping at this course
    </label>
  </div>

  <div>
    <label className="text-sm font-medium">Max players per tee time</label>
    <input
      type="number"
      min={1}
      max={5}
      value={settings.max_players_per_tee_time}
      onChange={(e) => setSettings({
        ...settings,
        max_players_per_tee_time: Math.min(5, Math.max(1, parseInt(e.target.value || '4', 10))),
      })}
      className="mt-1 block w-24 rounded border px-2 py-1"
    />
    <p className="mt-1 text-xs text-muted-foreground">
      Most courses leave this at 4. Set to 5 if you allow 5-somes; 1 disables grouping entirely.
    </p>
  </div>

  <p className="text-xs text-muted-foreground">
    You can also disable self-grouping for a single date (e.g., tournament day) from the tee sheet view.
  </p>
</section>
```

- [ ] **Step 3: Extend the save handler in the same file**

The tee-times settings page handles its own save inline (no separate action file). Find the existing save function — likely a server action declared in this same file or imported from a sibling. Extend its update payload to include the two new columns:

```typescript
await supabase
  .from('courses')
  .update({
    // ... existing fields like cart_policy, advance_booking_days ...
    allow_self_grouping: settings.allow_self_grouping,
    max_players_per_tee_time: settings.max_players_per_tee_time,
  })
  .eq('id', courseId);
```

- [ ] **Step 4: Manual smoke test**

Run dev, navigate to `/course/<slug>/tee-times/settings`, toggle the switch + change max-players, save, refresh, confirm persisted in the `courses` row.

- [ ] **Step 5: Commit**

```bash
git add src/app/course/\[slug\]/tee-times/settings/page.tsx
git commit -m "feat(self-grouping): course-side toggle + max-players setting"
```

---

### Task 6: Course tee sheet — Self-grouped badge + per-day disable

**Files:**
- Modify: the tee-sheet day-view page identified in Task 0

- [ ] **Step 1: Render a "Self-grouped" badge on each slot with mixed parties**

Pull the `has_self_grouped_bookings` flag from `tee_time_occupancy` (or join to bookings to check `booking_group_id` distinctness). For each rendered slot:

```tsx
{slot.hasSelfGroupedBookings && (
  <Badge variant="outline" className="text-xs">Self-grouped</Badge>
)}
```

Hovering or clicking the slot should show the separately-booked parties (just the first names + party sizes — staff can see full info elsewhere).

- [ ] **Step 2: Add a "Disable self-grouping today" button on the day-view header**

```tsx
<Button
  variant={dayOverride?.self_grouping_disabled ? 'destructive' : 'outline'}
  size="sm"
  onClick={() => toggleSelfGroupingForDay(viewDate)}
>
  {dayOverride?.self_grouping_disabled
    ? 'Self-grouping disabled today — click to re-enable'
    : 'Disable self-grouping today'}
</Button>
```

Server action (add to `src/app/actions/course-operations.ts`, creating the file if needed):

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function toggleSelfGroupingForDay(input: {
  courseId: string;
  date: string; // YYYY-MM-DD
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('course_tee_sheet_overrides')
    .select('id, self_grouping_disabled')
    .eq('course_id', input.courseId)
    .eq('override_date', input.date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('course_tee_sheet_overrides')
      .update({ self_grouping_disabled: !existing.self_grouping_disabled, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from('course_tee_sheet_overrides')
      .insert({
        course_id: input.courseId,
        override_date: input.date,
        self_grouping_disabled: true,
      });
    if (error) return { error: error.message };
  }

  return { ok: true };
}
```

- [ ] **Step 3: Manual smoke test**

Toggle the day disable, confirm the booking UI (Task 4) hides the join toggle for that date.

- [ ] **Step 4: Commit**

```bash
git add src/app/course/\[slug\]/... src/app/actions/course-operations.ts
git commit -m "feat(self-grouping): course tee-sheet badge + per-day disable"
```

---

### Task 7: Pairing-notification library (email-only v1)

**Files:**
- Create: `src/lib/pairing-notifications.ts`
- Test: `src/lib/pairing-notifications.test.ts`

- [ ] **Step 1: Write the failing test for the name-joining helper**

```typescript
// src/lib/pairing-notifications.test.ts
import { describe, it, expect } from 'vitest';
import { joinFirstNames, parseFirstName } from './pairing-notifications';

describe('joinFirstNames', () => {
  it('handles a single other player', () => {
    expect(joinFirstNames(['Alice'])).toBe('Alice');
  });
  it('handles two players with "and"', () => {
    expect(joinFirstNames(['Alice', 'Bob'])).toBe('Alice and Bob');
  });
  it('handles three players with Oxford comma', () => {
    expect(joinFirstNames(['Alice', 'Bob', 'Carol'])).toBe('Alice, Bob, and Carol');
  });
  it('handles an empty list', () => {
    expect(joinFirstNames([])).toBe('');
  });
});

describe('parseFirstName', () => {
  it('returns first token of full name', () => {
    expect(parseFirstName('Neil Barris')).toBe('Neil');
  });
  it('handles single-word names', () => {
    expect(parseFirstName('Madonna')).toBe('Madonna');
  });
  it('trims whitespace', () => {
    expect(parseFirstName('  Neil Barris  ')).toBe('Neil');
  });
  it('returns empty for empty input', () => {
    expect(parseFirstName('')).toBe('');
    expect(parseFirstName(null as any)).toBe('');
  });
});
```

- [ ] **Step 2: Run the test, watch it fail**

Run:
```bash
npx vitest run src/lib/pairing-notifications.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the library**

```typescript
// src/lib/pairing-notifications.ts
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export function parseFirstName(fullName: string | null | undefined): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function joinFirstNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

type GroupRow = {
  booking_id: string;
  booking_group_id: string;
  tee_time_id: string;
  scheduled_at: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  course_name: string;
  course_slug: string;
};

export async function sendPairingNotificationsForTomorrow(): Promise<{
  sent: number;
  errors: number;
  skipped: number;
}> {
  const supabase = await createClient();

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const startWindow = new Date(Date.UTC(
    tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 0, 0, 0
  )).toISOString();
  const endWindow = new Date(Date.UTC(
    tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 23, 59, 59
  )).toISOString();

  // Pull all self-grouped, un-notified bookings for tomorrow joined to tee_time + course + profile (with email via view)
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_group_id,
      tee_time_id,
      user_id,
      tee_times!inner ( id, scheduled_at, courses!inner ( name, slug ) ),
      profiles_with_email!inner ( full_name, email )
    `)
    .eq('is_self_grouped', true)
    .is('pairing_notification_sent_at', null)
    .not('status', 'in', '(canceled,no_show)')
    .gte('tee_times.scheduled_at', startWindow)
    .lte('tee_times.scheduled_at', endWindow);

  if (error) throw error;

  const rows: GroupRow[] = (data ?? []).map((b: any) => ({
    booking_id: b.id,
    booking_group_id: b.booking_group_id,
    tee_time_id: b.tee_time_id,
    scheduled_at: b.tee_times.scheduled_at,
    user_id: b.user_id,
    full_name: b.profiles_with_email.full_name,
    email: b.profiles_with_email.email,
    course_name: b.tee_times.courses.name,
    course_slug: b.tee_times.courses.slug,
  }));

  // Group by booking_group_id
  const groups = new Map<string, GroupRow[]>();
  for (const r of rows) {
    const arr = groups.get(r.booking_group_id) ?? [];
    arr.push(r);
    groups.set(r.booking_group_id, arr);
  }

  let sent = 0;
  let errors = 0;
  let skipped = 0;

  for (const [groupId, members] of groups) {
    if (members.length < 2) {
      // Solo "group" of one — no one to pair with
      skipped++;
      continue;
    }

    const firstNames = members.map(m => parseFirstName(m.full_name));
    const scheduledAt = new Date(members[0].scheduled_at);
    const timeStr = scheduledAt.toLocaleString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Detroit',
    });

    for (const m of members) {
      const recipientFirst = parseFirstName(m.full_name);
      const otherNames = firstNames.filter((_, i) => members[i].booking_id !== m.booking_id);
      const namesText = joinFirstNames(otherNames);
      if (!namesText || !m.email) {
        skipped++;
        continue;
      }

      try {
        await resend.emails.send({
          from: 'TeeAhead <hello@teeahead.com>',
          to: m.email,
          subject: `Tomorrow's pairing — ${m.course_name} at ${timeStr}`,
          html: `
            <p>Hi ${recipientFirst || 'there'},</p>
            <p>Quick heads-up on your group for tomorrow's round at <strong>${m.course_name}</strong> — <strong>${timeStr}</strong>:</p>
            <p>You'll be playing with <strong>${namesText}</strong>.</p>
            <p>This was a self-grouped tee time — everyone booked separately and was paired by us. Show up 10 minutes early, introduce yourself on the first tee, and have a great round.</p>
            <p>— TeeAhead</p>
          `,
        });

        await supabase
          .from('bookings')
          .update({ pairing_notification_sent_at: new Date().toISOString() })
          .eq('id', m.booking_id);

        sent++;
      } catch (e) {
        console.error(`[pairing] failed for booking ${m.booking_id}:`, e);
        errors++;
      }
    }
  }

  return { sent, errors, skipped };
}
```

- [ ] **Step 4: Run the unit tests, watch them pass**

Run:
```bash
npx vitest run src/lib/pairing-notifications.test.ts
```
Expected: PASS (7 tests across both describes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pairing-notifications.ts src/lib/pairing-notifications.test.ts
git commit -m "feat(self-grouping): pairing-notification library (email v1, name helpers tested)"
```

---

### Task 8: Cron route + Vercel registration

**Files:**
- Create: `src/app/api/cron/pairing-notifications/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write the cron handler**

```typescript
// src/app/api/cron/pairing-notifications/route.ts
import { NextResponse } from 'next/server';
import { sendPairingNotificationsForTomorrow } from '@/lib/pairing-notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await sendPairingNotificationsForTomorrow();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[cron/pairing-notifications] error:', e);
    return NextResponse.json({ ok: false, error: e.message ?? 'unknown' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Register in `vercel.json`**

Open `vercel.json` and add to the `crons` array (alongside the existing 4 entries):

```json
{
  "path": "/api/cron/pairing-notifications",
  "schedule": "0 22 * * *"
}
```

22:00 UTC = 5 PM ET in winter, 6 PM ET in summer — gives golfers ~17 hours of heads-up.

- [ ] **Step 3: Manual local invocation**

Run the dev server then:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/pairing-notifications
```
Expected: 200 JSON with `{ ok: true, sent, errors, skipped }`. Tomorrow's pairing emails go out (or `sent: 0` if no self-grouped slots for tomorrow).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/pairing-notifications/route.ts vercel.json
git commit -m "feat(self-grouping): daily 5pm ET cron for pairing notifications"
```

---

### Task 9: Playwright E2E

**Files:**
- Create: `tests/e2e/self-grouping.spec.ts`

- [ ] **Step 1: Write the E2E spec**

```typescript
// tests/e2e/self-grouping.spec.ts
import { test, expect } from '@playwright/test';

// Assumes the seed/dev fixtures include:
// - course "fox-creek" with allow_self_grouping = true
// - a tee_time tomorrow at noon ET with a pre-existing 1-player booking
// - golfer accounts test-solo@teeahead.com / pw "testpass" and test-host@teeahead.com / pw "testpass"

test.describe('Self-grouping flow', () => {
  test('solo golfer joins a partial slot', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-solo@teeahead.com');
    await page.fill('input[name="password"]', 'testpass');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/**');

    await page.goto('/app/courses/fox-creek');

    await page.getByLabel(/Join an existing group/i).click();

    // Only partial slots should be visible
    await expect(page.getByText(/spot[s]? open/)).toBeVisible();

    // Click first partial slot
    await page.locator('[data-testid="slot-row"]').first().click();

    // Confirmation page shows the join explainer
    await expect(page.getByText(/joining an existing group/i)).toBeVisible();

    // Complete booking (assume a "Confirm" button — adjust to actual UI)
    await page.click('button:has-text("Confirm")');

    await expect(page.getByText(/booking confirmed/i)).toBeVisible();
  });

  test('capacity overflow returns slot_filled error', async ({ page, request }) => {
    // Fill a slot to capacity via direct API, then try to join via UI
    // (Implementation depends on test-only seeding endpoint or direct Supabase insert in test fixture)
    test.skip(true, 'Requires test-only seeding endpoint or fixture');
  });

  test('per-day disable hides the join toggle', async ({ page }) => {
    // Set course_tee_sheet_overrides for tomorrow, then verify toggle hidden
    test.skip(true, 'Requires admin-side flow + recompose of fixtures');
  });
});
```

- [ ] **Step 2: Run Playwright**

Run:
```bash
npx playwright test tests/e2e/self-grouping.spec.ts
```
Expected: first test PASSES, two are skipped (with reason). If first test fails, iterate on selectors to match actual UI from Tasks 4 + 5.

- [ ] **Step 3: Add a test-only API route for pairing notifications**

Create `src/app/api/test/trigger-pairing/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { sendPairingNotificationsForTomorrow } from '@/lib/pairing-notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }
  if (request.headers.get('x-test-key') !== process.env.TEST_API_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const result = await sendPairingNotificationsForTomorrow();
  return NextResponse.json(result);
}
```

This lets the E2E suite trigger the notification job without waiting for cron.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/self-grouping.spec.ts src/app/api/test/trigger-pairing/route.ts
git commit -m "test(self-grouping): E2E for join flow + test-only notification trigger"
```

---

### Task 10: Final verification

**Files:** none — verification only.

- [ ] **Step 1: Run the full type check**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 2: Run vitest suite**

```bash
npx vitest run
```
Expected: green.

- [ ] **Step 3: Run Playwright**

```bash
npx playwright test
```
Expected: green (with skipped tests acknowledged).

- [ ] **Step 4: Walk through acceptance criteria below**

Use the acceptance list as a manual checklist. Every box must be checkable.

- [ ] **Step 5: Push branch / open PR**

Per project deployment setup: pushing to `main` deploys to production. Push to a feature branch instead, open PR to `qa` first.

```bash
git push origin self-grouping-solo-golfers
gh pr create --title "Sprint 5: self-grouping for solo golfers" --body "..."
```

---

## Acceptance Criteria

- [ ] Migration 091 applies cleanly on a fresh `supabase db reset`
- [ ] `tee_time_occupancy` view returns accurate `spots_remaining` per slot
- [ ] Capacity trigger blocks overbooking with SQLSTATE 23514 — surfaced as `'slot_filled'` to the UI
- [ ] Golfer booking list shows "Join existing group" toggle only when `course.allow_self_grouping` AND no `course_tee_sheet_overrides` row disables it for the visible date
- [ ] Toggle filters list to partial slots; each shows "X spots open"
- [ ] Solo golfer can complete a join-mode booking; new row has `is_self_grouped = true` and `booking_group_id` matching the host group
- [ ] After the join, all other bookings on that `tee_time_id` are also updated to `is_self_grouped = true`
- [ ] Race condition (slot fills between page-load and submit) returns user-friendly `'slot_filled'` error
- [ ] Daily 22:00 UTC cron sends pairing emails for tomorrow's self-grouped slots
- [ ] `pairing_notification_sent_at` prevents duplicate sends — running the cron twice in a row is a no-op the second time
- [ ] Emails contain first names only (parsed from `profiles.full_name` via `profiles_with_email` view)
- [ ] Course portal tee sheet shows a "Self-grouped" badge on mixed-party slots
- [ ] Course operator can disable self-grouping globally via the tee-times settings page
- [ ] Course operator can disable self-grouping for a specific date from the tee sheet day view
- [ ] Standard "book my own group" flow has no regressions (Vitest + Playwright green)
- [ ] No TypeScript errors

---

## Out of scope (deferred to V1.1 or other sprints)

- SMS pairing notifications — wait for `src/lib/sms.ts` primitive sprint
- Split-tee booking (`tee_start: 'front' | 'back'`) — wait for Sprint 1
- Pairing preferences (handicap, walking/riding, gender filters)
- In-app chat between paired golfers
- Host opt-in before a stranger joins their group
- Partial-refund logic when a joiner cancels
- Solo waitlist when no partial slots match desired window

---

## Notes for the executing agent

1. **AGENTS.md says "This is NOT the Next.js you know."** Before writing any server-action / route-handler / server-component code, read `node_modules/next/dist/docs/` for the version this project uses. Heed deprecation notices.
2. **Path-substitution everywhere.** The original Sprint 5 spec referenced file paths that don't exist in this codebase (e.g., `src/app/app/courses/[slug]/book/page.tsx`). This v2 uses verified paths, but the booking flow's *upstream slot-list page* still needs to be located in Task 4 Step 1 — do not skip that step.
3. **`booking_group_id` is NOT NULL after migration 091.** Every `bookings.insert()` in the codebase must provide a value. For own-group bookings use `crypto.randomUUID()`. Grep for existing insert sites and confirm none break (`grep -rn "bookings'\?).insert\|from('bookings').insert" src/`).
4. **Capacity gate is double-locked.** The trigger is a safety net; the booking action's `available_players` check + decrement is the primary gate. Don't remove either.
5. **Resend `from` is `hello@teeahead.com`.** All transactional mail in this codebase uses that — do not deviate.
6. **Memory has policy reminders.** Founding courses get software free for 1 year only — not unrelated to this sprint but worth knowing the company is sensitive to pricing copy if any of the UI surfaces touches pricing language.
