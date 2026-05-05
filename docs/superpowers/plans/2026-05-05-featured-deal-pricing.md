# Featured Deal Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Courses can mark individual tee times with a special override price and optional label; featured tee times sort to the top of the member booking grid with strikethrough pricing and a savings callout.

**Architecture:** Two new nullable columns (`special_price`, `special_label`) on `tee_times` drive everything. A tee time is "featured" when `special_price IS NOT NULL`. Course staff set/clear deals via an inline form in the expanded tee sheet row. The public booking grid sorts featured tee times first within each time-of-day section and renders them with strikethrough original pricing.

**Tech Stack:** Supabase (SQL migration), Next.js App Router server actions (`'use server'`), React `useState`/`useTransition`, Vitest + React Testing Library

---

## File Map

| File | Change |
|---|---|
| `supabase/migrations/056_tee_time_deals.sql` | Create — adds `special_price`, `special_label` columns to `tee_times` |
| `src/app/actions/teeTime.ts` | Modify — add `setTeeTimeDeal` action |
| `src/components/course/SetDealForm.tsx` | Create — inline form for setting/removing a deal |
| `src/components/course/TeeSheetGrid.tsx` | Modify — add `special_price`/`special_label` to type, DEAL pill, "Set deal" button, SetDealForm integration |
| `src/app/course/[slug]/page.tsx` | Modify — add `special_price, special_label` to Supabase select |
| `src/app/book/[slug]/page.tsx` | Modify — add `special_price, special_label` to Supabase select |
| `src/app/book/[slug]/PublicTeeTimeGrid.tsx` | Modify — update TeeTime type, featured-first sort, strikethrough card |
| `src/test/tee-sheet-display.test.tsx` | Modify — add deal pill and Set deal button tests |
| `src/test/featured-deal-card.test.tsx` | Create — PublicTeeTimeGrid featured card rendering and sort tests |

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/056_tee_time_deals.sql`

- [ ] **Step 1: Write the migration**

```sql
ALTER TABLE public.tee_times
  ADD COLUMN IF NOT EXISTS special_price numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS special_label text DEFAULT NULL;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/056_tee_time_deals.sql
git commit -m "feat(db): add special_price and special_label to tee_times"
```

---

### Task 2: Server Action

**Files:**
- Modify: `src/app/actions/teeTime.ts`

- [ ] **Step 1: Add `setTeeTimeDeal` to the bottom of `src/app/actions/teeTime.ts`**

```typescript
export async function setTeeTimeDeal(
  teeTimeId: string,
  specialPrice: number | null,
  specialLabel: string | null,
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('tee_times')
    .update({ special_price: specialPrice, special_label: specialLabel })
    .eq('id', teeTimeId)
  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/book/[slug]', 'page')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions/teeTime.ts
git commit -m "feat(actions): add setTeeTimeDeal server action"
```

---

### Task 3: TeeSheetGrid Tests (Failing)

**Files:**
- Modify: `src/test/tee-sheet-display.test.tsx`

- [ ] **Step 1: Update the `vi.mock('@/app/actions/teeTime', ...)` call to include `setTeeTimeDeal`**

Replace the existing mock block with:

```typescript
vi.mock('@/app/actions/teeTime', () => ({
  updateTeeTimeStatus: vi.fn().mockResolvedValue(undefined),
  updateBookingStatus: vi.fn().mockResolvedValue(undefined),
  setTeeTimeDeal: vi.fn().mockResolvedValue(undefined),
}))
```

- [ ] **Step 2: Add a mock for `SetDealForm` immediately after the existing mocks**

```typescript
vi.mock('@/components/course/SetDealForm', () => ({
  SetDealForm: () => <div data-testid="deal-form" />,
}))
```

- [ ] **Step 3: Update `makeTeeTime` to include the new fields**

Add `special_price` and `special_label` to the `makeTeeTime` helper overrides type and defaults:

```typescript
function makeTeeTime(overrides: Partial<{
  id: string
  scheduled_at: string
  max_players: number
  available_players: number
  base_price: number
  status: string
  special_price: number | null
  special_label: string | null
  bookings: ReturnType<typeof makeBooking>[]
}> = {}) {
  return {
    id: 'tt-1',
    scheduled_at: SCHEDULED_AT,
    max_players: 4,
    available_players: 4,
    base_price: 30,
    status: 'open',
    special_price: null,
    special_label: null,
    bookings: [],
    ...overrides,
  }
}
```

- [ ] **Step 4: Add the three new tests at the end of the `describe` block**

```typescript
it('shows DEAL pill in the price column when special_price is set', () => {
  render(
    <TeeSheetGrid
      teeTimes={[makeTeeTime({ special_price: 19.99 })]}
      slug="demo"
      courseId="course-1"
      courseName="Demo Course"
    />
  )
  expect(screen.getByText('DEAL')).toBeInTheDocument()
})

it('shows "Set deal" button in the expanded row', async () => {
  const user = userEvent.setup()
  render(
    <TeeSheetGrid
      teeTimes={[makeTeeTime()]}
      slug="demo"
      courseId="course-1"
      courseName="Demo Course"
    />
  )
  await user.click(screen.getByRole('button', { name: /8:00/i }))
  expect(screen.getByRole('button', { name: /set deal/i })).toBeInTheDocument()
})

it('shows the deal form when "Set deal" is clicked', async () => {
  const user = userEvent.setup()
  render(
    <TeeSheetGrid
      teeTimes={[makeTeeTime()]}
      slug="demo"
      courseId="course-1"
      courseName="Demo Course"
    />
  )
  await user.click(screen.getByRole('button', { name: /8:00/i }))
  await user.click(screen.getByRole('button', { name: /set deal/i }))
  expect(screen.getByTestId('deal-form')).toBeInTheDocument()
})
```

- [ ] **Step 5: Run the new tests — verify they fail**

```bash
npx vitest run src/test/tee-sheet-display.test.tsx
```

Expected: the 3 new tests fail with errors like "cannot find 'DEAL'" and "cannot find 'Set deal'".

---

### Task 4: SetDealForm Component + TeeSheetGrid Integration

**Files:**
- Create: `src/components/course/SetDealForm.tsx`
- Modify: `src/components/course/TeeSheetGrid.tsx`

- [ ] **Step 1: Create `src/components/course/SetDealForm.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { setTeeTimeDeal } from '@/app/actions/teeTime'

export function SetDealForm({
  teeTimeId,
  basePrice,
  initialSpecialPrice,
  initialSpecialLabel,
  onSuccess,
  onClose,
}: {
  teeTimeId: string
  basePrice: number
  initialSpecialPrice: number | null
  initialSpecialLabel: string | null
  onSuccess: () => void
  onClose: () => void
}) {
  const [price, setPrice] = useState(initialSpecialPrice?.toString() ?? '')
  const [label, setLabel] = useState(initialSpecialLabel ?? '')
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  function handleSave() {
    const parsed = parseFloat(price)
    if (isNaN(parsed) || parsed < 0) {
      setError('Enter a valid price.')
      return
    }
    setError('')
    startTransition(async () => {
      await setTeeTimeDeal(teeTimeId, parsed, label.trim() || null)
      onSuccess()
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await setTeeTimeDeal(teeTimeId, null, null)
      onSuccess()
    })
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder={`Special price (base: $${basePrice.toFixed(2)})`}
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs w-44"
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={40}
          className="border border-gray-300 rounded px-2 py-1 text-xs w-32"
        />
        <button
          onClick={handleSave}
          className="text-xs px-3 py-1 bg-[#1B4332] text-white rounded hover:bg-[#1B4332]/90"
        >
          Save
        </button>
        {initialSpecialPrice !== null && (
          <button
            onClick={handleRemove}
            className="text-xs px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 text-[#6B7770] hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Update `TeeSheetGrid.tsx` — type, state, imports**

At the top of the file, add the import:

```typescript
import { SetDealForm } from './SetDealForm'
```

Update the `TeeTime` interface to include the new fields:

```typescript
interface TeeTime {
  id: string
  scheduled_at: string
  max_players: number
  available_players: number
  base_price: number
  status: string
  special_price: number | null
  special_label: string | null
  bookings: Booking[]
}
```

Add `dealTarget` state alongside existing state declarations:

```typescript
const [dealTarget, setDealTarget] = useState<string | null>(null)
```

- [ ] **Step 3: Update `TeeSheetGrid.tsx` — DEAL pill in collapsed row**

In the price column `<div className="col-span-2 ...">`, update the content from:

```tsx
<div className="col-span-2 text-[#6B7770]">${tt.base_price.toFixed(2)}</div>
```

to:

```tsx
<div className="col-span-2 text-[#6B7770] flex items-center gap-1.5">
  ${tt.base_price.toFixed(2)}
  {tt.special_price !== null && (
    <span className="text-xs bg-amber-400 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
      DEAL
    </span>
  )}
</div>
```

- [ ] **Step 4: Update `TeeSheetGrid.tsx` — "Set deal" button and inline form in expanded row**

Inside the expanded section, in the `<div className="flex gap-2 mt-2 pt-2 ...">` actions row, add the "Set deal" button alongside existing buttons. Add it as the last item in the flex container:

```tsx
{displayStatus !== 'completed' && (
  <button
    onClick={() => setDealTarget(dealTarget === tt.id ? null : tt.id)}
    className="text-xs px-3 py-1 border border-amber-400 text-amber-700 rounded hover:bg-amber-50"
  >
    {tt.special_price !== null ? 'Edit deal' : 'Set deal'}
  </button>
)}
```

Then, immediately after the closing `</div>` of the actions row (but still inside the expanded section `div`), add:

```tsx
{dealTarget === tt.id && (
  <SetDealForm
    teeTimeId={tt.id}
    basePrice={tt.base_price}
    initialSpecialPrice={tt.special_price}
    initialSpecialLabel={tt.special_label}
    onSuccess={() => {
      setDealTarget(null)
      router.refresh()
    }}
    onClose={() => setDealTarget(null)}
  />
)}
```

- [ ] **Step 5: Run the tests — verify they pass**

```bash
npx vitest run src/test/tee-sheet-display.test.tsx
```

Expected: all tests pass including the 3 new ones.

- [ ] **Step 6: Commit**

```bash
git add src/components/course/SetDealForm.tsx src/components/course/TeeSheetGrid.tsx src/test/tee-sheet-display.test.tsx
git commit -m "feat(course): add inline deal pricing controls to tee sheet"
```

---

### Task 5: PublicTeeTimeGrid Tests (Failing)

**Files:**
- Create: `src/test/featured-deal-card.test.tsx`

- [ ] **Step 1: Create `src/test/featured-deal-card.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { PublicTeeTimeGrid } from '@/app/book/[slug]/PublicTeeTimeGrid'

// 7:30 AM and 8:00 AM Detroit (EDT = UTC-4)
const MORNING_EARLY = '2026-05-01T11:30:00.000Z'
const MORNING_LATE  = '2026-05-01T12:00:00.000Z'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

function makeTT(overrides: Partial<{
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  special_price: number | null
  special_label: string | null
}> = {}) {
  return {
    id: 'tt-1',
    scheduled_at: MORNING_LATE,
    available_players: 4,
    base_price: 65,
    special_price: null,
    special_label: null,
    ...overrides,
  }
}

const GRID_PROPS = {
  courseName: 'Demo Course',
  courseSlug: 'demo',
  selectedDate: '2026-05-01',
}

describe('PublicTeeTimeGrid — featured deal cards', () => {
  it('shows base price normally when no deal is set', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT()]} {...GRID_PROPS} />)
    expect(screen.getByText('$65.00')).toBeInTheDocument()
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument()
  })

  it('shows strikethrough base price when a deal is set', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT({ special_price: 45 })]} {...GRID_PROPS} />)
    const strikethrough = screen.getByText('$65.00')
    expect(strikethrough).toHaveStyle('text-decoration: line-through')
  })

  it('shows the special price in red when a deal is set', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT({ special_price: 45 })]} {...GRID_PROPS} />)
    expect(screen.getByText('$45.00')).toBeInTheDocument()
  })

  it('shows "Save $20.00" when base is 65 and special is 45', () => {
    render(<PublicTeeTimeGrid teeTimes={[makeTT({ special_price: 45 })]} {...GRID_PROPS} />)
    expect(screen.getByText('Save $20.00')).toBeInTheDocument()
  })

  it('shows the custom label when special_label is set', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTT({ special_price: 45, special_label: 'Twilight Rate' })]}
        {...GRID_PROPS}
      />
    )
    expect(screen.getByText('Twilight Rate')).toBeInTheDocument()
  })

  it('does not show a "Save" line when special_price is higher than base_price', () => {
    render(
      <PublicTeeTimeGrid
        teeTimes={[makeTT({ special_price: 80 })]}
        {...GRID_PROPS}
      />
    )
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument()
  })

  it('sorts featured tee time before non-featured in the same section', () => {
    const teeTimes = [
      makeTT({ id: 'early', scheduled_at: MORNING_EARLY, special_price: null }),
      makeTT({ id: 'late',  scheduled_at: MORNING_LATE,  special_price: 45 }),
    ]
    render(<PublicTeeTimeGrid teeTimes={teeTimes} {...GRID_PROPS} />)
    const cards = screen.getAllByRole('link', { name: /book now/i })
    // The featured 8:00 AM card's link should precede the non-featured 7:30 AM card's link
    const hrefs = cards.map(c => c.getAttribute('href'))
    expect(hrefs[0]).toBe('/app/book/late')
    expect(hrefs[1]).toBe('/app/book/early')
  })
})
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
npx vitest run src/test/featured-deal-card.test.tsx
```

Expected: all 7 tests fail (type errors or missing props/rendering logic).

---

### Task 6: PublicTeeTimeGrid Updates

**Files:**
- Modify: `src/app/book/[slug]/PublicTeeTimeGrid.tsx`

- [ ] **Step 1: Update the `TeeTime` interface**

Replace:

```typescript
interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
}
```

with:

```typescript
interface TeeTime {
  id: string
  scheduled_at: string
  available_players: number
  base_price: number
  special_price: number | null
  special_label: string | null
}
```

- [ ] **Step 2: Update the `TeeTimeCard` component**

Replace the entire `TeeTimeCard` function with:

```tsx
function TeeTimeCard({ tt }: { tt: TeeTime }) {
  const spotsLeft = tt.available_players
  const isLast = spotsLeft === 1
  const hasDeal = tt.special_price !== null
  const savings = hasDeal ? tt.base_price - tt.special_price! : 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      {hasDeal && tt.special_label && (
        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
          {tt.special_label}
        </p>
      )}
      <div>
        <p className="text-lg font-bold text-gray-900">{formatTime(tt.scheduled_at)}</p>
        <p className={`text-xs font-medium mt-0.5 ${isLast ? 'text-red-500' : 'text-gray-400'}`}>
          {isLast ? '1 spot left' : `${spotsLeft} spots left`}
        </p>
      </div>
      {hasDeal ? (
        <div>
          <p className="text-sm text-gray-400 line-through">${tt.base_price.toFixed(2)}</p>
          <p className="text-2xl font-bold text-red-600">${tt.special_price!.toFixed(2)}</p>
          {savings > 0 && (
            <p className="text-xs text-red-500 font-semibold">Save ${savings.toFixed(2)}</p>
          )}
        </div>
      ) : (
        <p className="text-2xl font-bold text-[#1B4332]">${tt.base_price.toFixed(2)}</p>
      )}
      <Link
        href={`/app/book/${tt.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-[#1B4332] text-white text-sm font-semibold rounded-lg py-2 hover:bg-[#163d2a] transition-colors"
      >
        Book Now
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Add the `sortWithFeaturedFirst` helper and apply it to the morning/afternoon splits**

Add this function above the `PublicTeeTimeGrid` component:

```typescript
function sortWithFeaturedFirst(tts: TeeTime[]): TeeTime[] {
  return [...tts].sort((a, b) => {
    const aFeatured = a.special_price !== null ? 1 : 0
    const bFeatured = b.special_price !== null ? 1 : 0
    if (bFeatured !== aFeatured) return bFeatured - aFeatured
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })
}
```

Then inside `PublicTeeTimeGrid`, replace:

```typescript
const morning = filtered.filter(tt => localHour(tt.scheduled_at) < 12)
const afternoon = filtered.filter(tt => localHour(tt.scheduled_at) >= 12)
```

with:

```typescript
const morning = sortWithFeaturedFirst(filtered.filter(tt => localHour(tt.scheduled_at) < 12))
const afternoon = sortWithFeaturedFirst(filtered.filter(tt => localHour(tt.scheduled_at) >= 12))
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npx vitest run src/test/featured-deal-card.test.tsx
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/book/[slug]/PublicTeeTimeGrid.tsx' src/test/featured-deal-card.test.tsx
git commit -m "feat(booking): featured tee time cards with strikethrough pricing"
```

---

### Task 7: Update Server-Side Select Queries

**Files:**
- Modify: `src/app/course/[slug]/page.tsx`
- Modify: `src/app/book/[slug]/page.tsx`

- [ ] **Step 1: Update the course tee sheet query in `src/app/course/[slug]/page.tsx`**

Find:

```typescript
const { data: teeTimes } = await supabase
  .from('tee_times')
  .select(`
    id, scheduled_at, max_players, available_players, base_price, status,
    bookings(id, players, total_paid, status, payment_status, points_awarded, user_id, guest_name, guest_phone, guest_email, payment_method,
      profiles(full_name)
    )
  `)
```

Replace the select string with:

```typescript
const { data: teeTimes } = await supabase
  .from('tee_times')
  .select(`
    id, scheduled_at, max_players, available_players, base_price, status, special_price, special_label,
    bookings(id, players, total_paid, status, payment_status, points_awarded, user_id, guest_name, guest_phone, guest_email, payment_method,
      profiles(full_name)
    )
  `)
```

- [ ] **Step 2: Update the public booking query in `src/app/book/[slug]/page.tsx`**

Find:

```typescript
const { data: teeTimes } = await supabase
  .from('tee_times')
  .select('id, scheduled_at, available_players, base_price')
```

Replace with:

```typescript
const { data: teeTimes } = await supabase
  .from('tee_times')
  .select('id, scheduled_at, available_players, base_price, special_price, special_label')
```

- [ ] **Step 3: Run the full test suite to confirm nothing regressed**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/course/[slug]/page.tsx' 'src/app/book/[slug]/page.tsx'
git commit -m "feat(queries): include special_price and special_label in tee time selects"
```
