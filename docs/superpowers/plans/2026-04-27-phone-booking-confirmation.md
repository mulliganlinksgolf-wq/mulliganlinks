# Phone Booking Confirmation Email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let course staff capture a caller's email when entering a walk-in booking, and send (or resend) a confirmation email from the tee sheet at any time.

**Architecture:** New `guest_email` column on `bookings` feeds two flows: (1) optional email field in `WalkInBookingModal` auto-sends on save; (2) "✉ Send confirmation" button on tee sheet booking rows opens a `SendConfirmationPopover` that sends/resends via a `sendWalkInConfirmation` server action. Email rendering lives in a new `sendPhoneBookingConfirmation()` function in `src/lib/emails.ts`.

**Tech Stack:** Next.js server actions, Supabase (SQL migration + RPC update), Resend (email), React (client components), Vitest (unit tests)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/026_guest_email.sql` | Create | Add `guest_email` column; update `create_walk_in_booking` RPC |
| `src/lib/emails.ts` | Modify | Add `sendPhoneBookingConfirmation()` |
| `src/app/actions/teeTime.ts` | Modify | Add `guestEmail` to `createWalkInBooking` + `updateBooking`; add `sendWalkInConfirmation` + `sendWalkInEmail` actions |
| `src/components/course/WalkInBookingModal.tsx` | Modify | Add `courseName` prop + email field in group mode; fire email on save |
| `src/components/course/SendConfirmationPopover.tsx` | Create | Inline popover for sending confirmation from tee sheet |
| `src/components/course/TeeSheetGrid.tsx` | Modify | Add `courseName` prop, `guest_email` to Booking type, "✉" button wired to popover |
| `src/app/course/[slug]/page.tsx` | Modify | Pass `courseName` to `TeeSheetGrid` |
| `src/test/phone-booking-email.test.ts` | Create | Unit tests for `sendPhoneBookingConfirmation` |
| `src/test/send-walk-in-confirmation.test.ts` | Create | Unit tests for `sendWalkInConfirmation` action |

---

## Task 1: Migration — add `guest_email` and update RPC

**Files:**
- Create: `supabase/migrations/026_guest_email.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/026_guest_email.sql
-- Add guest email to bookings for phone-in confirmation emails

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_email text;

-- Replace RPC to accept email parameter
CREATE OR REPLACE FUNCTION public.create_walk_in_booking(
  p_tee_time_id uuid,
  p_guest_name text,
  p_guest_phone text,
  p_players int,
  p_total_paid numeric,
  p_payment_method text,
  p_guest_email text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_available int;
  v_booking_id uuid;
BEGIN
  -- Verify the caller is a course admin for this tee time
  IF NOT EXISTS (
    SELECT 1 FROM public.tee_times tt
    JOIN public.course_admins ca ON ca.course_id = tt.course_id
    WHERE tt.id = p_tee_time_id AND ca.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the row to prevent double-booking
  SELECT available_players INTO v_available
  FROM public.tee_times
  WHERE id = p_tee_time_id
  FOR UPDATE;

  IF v_available < p_players THEN
    RAISE EXCEPTION 'Not enough available spots (% available, % requested)', v_available, p_players;
  END IF;

  INSERT INTO public.bookings (
    tee_time_id, guest_name, guest_phone, guest_email, players,
    total_paid, payment_method, status, payment_status
  ) VALUES (
    p_tee_time_id, p_guest_name, NULLIF(p_guest_phone, ''), NULLIF(p_guest_email, ''), p_players,
    p_total_paid, p_payment_method, 'confirmed',
    CASE WHEN p_payment_method = 'unpaid' THEN 'pending' ELSE 'succeeded' END
  )
  RETURNING id INTO v_booking_id;

  UPDATE public.tee_times
  SET
    available_players = available_players - p_players,
    status = CASE WHEN (available_players - p_players) = 0 THEN 'booked' ELSE 'open' END
  WHERE id = p_tee_time_id;

  RETURN v_booking_id;
END;
$$;
```

- [ ] **Step 2: Push migration to production**

```bash
cd /Users/barris/Desktop/MulliganLinks
npx supabase db push --linked
```

Expected: `Applying migration 026_guest_email.sql... done`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/026_guest_email.sql
git commit -m "feat: add guest_email to bookings; update walk-in RPC"
```

---

## Task 2: `sendPhoneBookingConfirmation()` + tests

**Files:**
- Modify: `src/lib/emails.ts`
- Create: `src/test/phone-booking-email.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/test/phone-booking-email.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend before importing emails
const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg-1' }, error: null })
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}))

// Set env before import
process.env.RESEND_API_KEY = 're_test_key'

import { sendPhoneBookingConfirmation } from '@/lib/emails'

describe('sendPhoneBookingConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null })
  })

  it('sends an email to the guest address', async () => {
    await sendPhoneBookingConfirmation({
      guestName: 'John Smith',
      guestEmail: 'john@example.com',
      courseName: 'Fieldstone Golf Club',
      teeTimeIso: '2026-05-01T14:00:00Z',
      players: 2,
      totalPaid: 170,
      paymentMethod: 'cash',
    })

    expect(mockSend).toHaveBeenCalledOnce()
    const call = mockSend.mock.calls[0][0]
    expect(call.to).toBe('john@example.com')
    expect(call.subject).toContain('Fieldstone Golf Club')
  })

  it('includes course name, players, and payment method in html', async () => {
    await sendPhoneBookingConfirmation({
      guestName: 'Jane Doe',
      guestEmail: 'jane@example.com',
      courseName: 'Fieldstone Golf Club',
      teeTimeIso: '2026-05-01T14:00:00Z',
      players: 3,
      totalPaid: 255,
      paymentMethod: 'card',
    })

    const html = mockSend.mock.calls[0][0].html as string
    expect(html).toContain('Fieldstone Golf Club')
    expect(html).toContain('3')
    expect(html).toContain('Card')
    expect(html).toContain('$255.00')
  })

  it('does not throw when RESEND_API_KEY is placeholder — just returns', async () => {
    const originalKey = process.env.RESEND_API_KEY
    process.env.RESEND_API_KEY = 're_placeholder'
    await expect(
      sendPhoneBookingConfirmation({
        guestName: 'Test',
        guestEmail: 'test@example.com',
        courseName: 'Test Course',
        teeTimeIso: '2026-05-01T14:00:00Z',
        players: 1,
        totalPaid: 85,
        paymentMethod: 'cash',
      })
    ).resolves.toBeUndefined()
    expect(mockSend).not.toHaveBeenCalled()
    process.env.RESEND_API_KEY = originalKey
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/test/phone-booking-email.test.ts
```

Expected: FAIL — `sendPhoneBookingConfirmation is not a function`

- [ ] **Step 3: Add `sendPhoneBookingConfirmation` to `src/lib/emails.ts`**

Append after the closing brace of `sendCourseBookingAlert`:

```typescript
export async function sendPhoneBookingConfirmation({
  guestName,
  guestEmail,
  courseName,
  teeTimeIso,
  players,
  totalPaid,
  paymentMethod,
}: {
  guestName: string
  guestEmail: string
  courseName: string
  teeTimeIso: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}) {
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey || resendKey === 're_placeholder') return

    const { date: dateStr, time: timeStr } = fmtDateTime(teeTimeIso)
    const firstName = guestName.split(' ')[0]
    const paymentLabel =
      paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : 'Unpaid'

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)

    await resend.emails.send({
      from: 'TeeAhead <notifications@teeahead.com>',
      to: guestEmail,
      subject: `Tee time confirmed — ${courseName} ${dateStr}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
          <h2 style="color: #1B4332;">You're on the tee ⛳</h2>
          <p>Hey ${firstName}, your tee time at <strong>${courseName}</strong> is confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Course</td><td style="padding: 8px 0; font-weight: 600; border-bottom: 1px solid #eee;">${courseName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dateStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Time</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Players</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${players}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770; border-bottom: 1px solid #eee;">Total paid</td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">$${totalPaid.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #6B7770;">Payment method</td><td style="padding: 8px 0;">${paymentLabel}</td></tr>
          </table>
          <p style="color: #6B7770; font-size: 13px;">Booked by calling the course. Questions? Contact us at support@teeahead.com</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #6B7770; font-size: 12px;">TeeAhead &middot; Your home course, redone right.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[phone-booking-email]', err)
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/test/phone-booking-email.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/emails.ts src/test/phone-booking-email.test.ts
git commit -m "feat: add sendPhoneBookingConfirmation email function"
```

---

## Task 3: Update server actions

**Files:**
- Modify: `src/app/actions/teeTime.ts`
- Create: `src/test/send-walk-in-confirmation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/send-walk-in-confirmation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const mockSendEmail = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/emails', () => ({
  sendBookingConfirmation: vi.fn(),
  sendCourseBookingAlert: vi.fn(),
  sendPhoneBookingConfirmation: mockSendEmail,
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { sendWalkInConfirmation } from '@/app/actions/teeTime'

function buildMock(booking: Record<string, unknown> | null) {
  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
  }
  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue(updateChain),
      single: vi.fn().mockResolvedValue(
        table === 'bookings'
          ? {
              data: booking,
              error: booking ? null : { message: 'not found' },
            }
          : { data: null, error: null }
      ),
    })),
  }
  return client
}

describe('sendWalkInConfirmation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when booking not found', async () => {
    vi.mocked(createClient).mockResolvedValue(buildMock(null) as never)
    const result = await sendWalkInConfirmation({ bookingId: 'b-1', email: 'x@y.com' })
    expect(result.error).toBeTruthy()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('calls sendPhoneBookingConfirmation with correct args when booking found', async () => {
    const booking = {
      id: 'b-1',
      guest_name: 'Bob Jones',
      players: 2,
      total_paid: 170,
      payment_method: 'cash',
      tee_times: {
        scheduled_at: '2026-05-01T14:00:00Z',
        courses: { name: 'Fieldstone Golf Club' },
      },
    }
    vi.mocked(createClient).mockResolvedValue(buildMock(booking) as never)
    const result = await sendWalkInConfirmation({ bookingId: 'b-1', email: 'bob@example.com' })
    expect(result.error).toBeUndefined()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        guestName: 'Bob Jones',
        guestEmail: 'bob@example.com',
        courseName: 'Fieldstone Golf Club',
        players: 2,
        totalPaid: 170,
        paymentMethod: 'cash',
      })
    )
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/test/send-walk-in-confirmation.test.ts
```

Expected: FAIL — `sendWalkInConfirmation is not a function`

- [ ] **Step 3: Update `src/app/actions/teeTime.ts`**

**3a** — Update `updateBooking` — add `guestEmail` to params and patch object. Find the existing params block and replace it:

```typescript
export async function updateBooking({
  bookingId,
  players,
  totalPaid,
  paymentMethod,
  guestName,
  guestPhone,
  guestEmail,
}: {
  bookingId: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card'
  guestName?: string
  guestPhone?: string
  guestEmail?: string
}): Promise<{ error?: string }> {
```

In the patch object line (currently `const patch: Record<string, unknown> = ...`), add `guest_email`:

```typescript
  const patch: Record<string, unknown> = { players, total_paid: totalPaid, payment_method: paymentMethod }
  if (booking.guest_name !== null || guestName !== undefined) {
    patch.guest_name = guestName ?? booking.guest_name
    patch.guest_phone = guestPhone ?? null
    if (guestEmail !== undefined) patch.guest_email = guestEmail || null
  }
```

**3b** — Update `createWalkInBooking` — add `guestEmail` param and pass to RPC:

```typescript
export async function createWalkInBooking({
  teeTimeId,
  guestName,
  guestPhone,
  guestEmail,
  players,
  totalPaid,
  paymentMethod,
}: {
  teeTimeId: string
  guestName: string
  guestPhone: string
  guestEmail?: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_walk_in_booking', {
    p_tee_time_id: teeTimeId,
    p_guest_name: guestName,
    p_guest_phone: guestPhone,
    p_guest_email: guestEmail ?? null,
    p_players: players,
    p_total_paid: totalPaid,
    p_payment_method: paymentMethod,
  })
  if (error) return { error: error.message }
  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/bookings', 'page')
  return {}
}
```

**3c** — Add two new actions at the bottom of the file. First add the import at the top of the file (after existing imports):

```typescript
import { sendPhoneBookingConfirmation } from '@/lib/emails'
```

Then append at the bottom of the file:

```typescript
// Sends confirmation email from tee sheet "Send confirmation" button.
// Fetches booking details from DB, updates guest_email, fires email.
export async function sendWalkInConfirmation({
  bookingId,
  email,
}: {
  bookingId: string
  email: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, guest_name, players, total_paid, payment_method, tee_times(scheduled_at, courses(name))')
    .eq('id', bookingId)
    .single()

  if (fetchErr || !booking) return { error: 'Booking not found.' }

  // Persist email so it pre-fills next time
  await supabase.from('bookings').update({ guest_email: email }).eq('id', bookingId)

  const teeTime = (booking as any).tee_times
  const courseName = teeTime?.courses?.name ?? 'your course'

  sendPhoneBookingConfirmation({
    guestName: booking.guest_name ?? 'Guest',
    guestEmail: email,
    courseName,
    teeTimeIso: teeTime?.scheduled_at ?? new Date().toISOString(),
    players: booking.players,
    totalPaid: booking.total_paid,
    paymentMethod: booking.payment_method as 'cash' | 'card' | 'unpaid',
  }).catch(err => console.error('[send-walk-in-confirmation]', err))

  return {}
}

// Sends confirmation email directly from WalkInBookingModal using locally-available data.
// Caller already has all booking details — no DB fetch needed.
export async function sendWalkInEmail({
  guestName,
  guestEmail,
  courseName,
  teeTimeIso,
  players,
  totalPaid,
  paymentMethod,
}: {
  guestName: string
  guestEmail: string
  courseName: string
  teeTimeIso: string
  players: number
  totalPaid: number
  paymentMethod: 'cash' | 'card' | 'unpaid'
}): Promise<{ error?: string }> {
  sendPhoneBookingConfirmation({
    guestName,
    guestEmail,
    courseName,
    teeTimeIso,
    players,
    totalPaid,
    paymentMethod,
  }).catch(err => console.error('[send-walk-in-email]', err))
  return {}
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/test/send-walk-in-confirmation.test.ts
```

Expected: 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/teeTime.ts src/test/send-walk-in-confirmation.test.ts
git commit -m "feat: add sendWalkInConfirmation + sendWalkInEmail actions; thread guestEmail through walk-in actions"
```

---

## Task 4: Update `WalkInBookingModal` — add email field

**Files:**
- Modify: `src/components/course/WalkInBookingModal.tsx`

- [ ] **Step 1: Update `Props` interface and add `courseName`**

Replace the existing `Props` interface:

```typescript
interface Props {
  teeTimeId: string
  availablePlayers: number
  basePrice: number
  scheduledAt: string
  courseName: string
  onClose: () => void
  onSuccess: () => void
}
```

Update the function signature to destructure `courseName`:

```typescript
export function WalkInBookingModal({
  teeTimeId,
  availablePlayers,
  basePrice,
  scheduledAt,
  courseName,
  onClose,
  onSuccess,
}: Props) {
```

- [ ] **Step 2: Add email state and import**

Add at the top of the file after existing imports:

```typescript
import { createWalkInBooking, sendWalkInEmail } from '@/app/actions/teeTime'
```

(This replaces the existing `import { createWalkInBooking } from '@/app/actions/teeTime'` line.)

Add `groupEmail` state after `groupPhone` state:

```typescript
  const [groupEmail, setGroupEmail] = useState('')
```

- [ ] **Step 3: Add email input in group mode**

In the group mode JSX, find the `grid grid-cols-2 gap-3` div containing Name and Phone, and add a full-width email field below it:

```tsx
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6B7770] block mb-1">Name *</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Lead golfer name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7770] block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={groupPhone}
                    onChange={e => setGroupPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7770] block mb-1">
                  Email <span className="text-[#9DAA9F] font-normal">(sends confirmation)</span>
                </label>
                <input
                  type="email"
                  value={groupEmail}
                  onChange={e => setGroupEmail(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
                />
              </div>
```

- [ ] **Step 4: Fire confirmation email after successful group booking**

In `handleSubmit`, update the group mode `startTransition` block:

```typescript
      startTransition(async () => {
        const result = await createWalkInBooking({
          teeTimeId,
          guestName: groupName.trim(),
          guestPhone: groupPhone.trim(),
          guestEmail: groupEmail.trim() || undefined,
          players: playerCount,
          totalPaid: parseFloat(groupAmount) || 0,
          paymentMethod,
        })
        if (result?.error) {
          setError(result.error)
          return
        }
        if (groupEmail.trim()) {
          sendWalkInEmail({
            guestName: groupName.trim(),
            guestEmail: groupEmail.trim(),
            courseName,
            teeTimeIso: scheduledAt,
            players: playerCount,
            totalPaid: parseFloat(groupAmount) || 0,
            paymentMethod,
          }).catch(() => {/* fire and forget */})
        }
        onSuccess()
      })
```

- [ ] **Step 5: Commit**

```bash
git add src/components/course/WalkInBookingModal.tsx
git commit -m "feat: add email field to WalkInBookingModal; fire confirmation email on save"
```

---

## Task 5: Create `SendConfirmationPopover`

**Files:**
- Create: `src/components/course/SendConfirmationPopover.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { sendWalkInConfirmation } from '@/app/actions/teeTime'

interface Props {
  bookingId: string
  guestName: string
  initialEmail?: string
}

export function SendConfirmationPopover({ bookingId, guestName, initialEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(initialEmail ?? '')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function handleSend() {
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await sendWalkInConfirmation({ bookingId, email: email.trim() })
      if (result?.error) {
        setError(result.error)
      } else {
        setSent(true)
        setTimeout(() => {
          setOpen(false)
          setSent(false)
        }, 1800)
      }
    })
  }

  if (sent) {
    return (
      <span className="text-xs px-2 py-0.5 text-green-700 font-medium">✓ Sent</span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100 text-[#6B7770]"
        title={`Send confirmation to ${guestName}`}
      >
        ✉ Confirm
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg border border-gray-200 shadow-lg p-3 w-64"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-[#1A1A1A] mb-2">
            Send confirmation to {guestName}
          </p>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="guest@email.com"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4332] mb-2"
          />
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-1.5 text-xs text-[#6B7770] border border-gray-200 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isPending}
              className="flex-1 py-1.5 text-xs bg-[#1B4332] text-[#FAF7F2] rounded hover:bg-[#1B4332]/90 disabled:opacity-50"
            >
              {isPending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/course/SendConfirmationPopover.tsx
git commit -m "feat: add SendConfirmationPopover component for tee sheet"
```

---

## Task 6: Update `TeeSheetGrid` and the tee sheet page

**Files:**
- Modify: `src/components/course/TeeSheetGrid.tsx`
- Modify: `src/app/course/[slug]/page.tsx`

- [ ] **Step 1: Update `Booking` interface and props in `TeeSheetGrid.tsx`**

Add `guest_email` to the `Booking` interface:

```typescript
interface Booking {
  id: string
  players: number
  total_paid: number
  status: string
  payment_status?: string | null
  points_awarded?: number
  user_id?: string | null
  guest_name: string | null
  guest_phone?: string | null
  guest_email?: string | null
  payment_method?: string | null
  profiles: { full_name: string } | null
}
```

Update the `TeeSheetGrid` function signature to accept `courseName`:

```typescript
export function TeeSheetGrid({
  teeTimes,
  slug,
  courseId,
  courseName,
}: {
  teeTimes: TeeTime[]
  slug: string
  courseId: string
  courseName: string
}) {
```

- [ ] **Step 2: Import `SendConfirmationPopover` and `WalkInBookingModal` courseName prop**

Add to imports at the top of `TeeSheetGrid.tsx`:

```typescript
import { SendConfirmationPopover } from './SendConfirmationPopover'
```

- [ ] **Step 3: Pass `courseName` to `WalkInBookingModal`**

Find the `WalkInBookingModal` JSX block and add `courseName`:

```tsx
      {bookingTeeTime && (
        <WalkInBookingModal
          teeTimeId={bookingTeeTime.id}
          availablePlayers={bookingTeeTime.available_players}
          basePrice={bookingTeeTime.base_price}
          scheduledAt={bookingTeeTime.scheduled_at}
          courseName={courseName}
          onClose={() => setBookingTeeTime(null)}
          onSuccess={() => {
            setBookingTeeTime(null)
            setExpanded(null)
            router.refresh()
          }}
        />
      )}
```

- [ ] **Step 4: Add "✉ Confirm" button to walk-in booking rows**

In the per-booking action buttons section, add `SendConfirmationPopover` after the existing "Edit" button for walk-in bookings (`b.user_id === null`). Find the block:

```tsx
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => setEditTarget({ booking: b, teeTime: tt })}
                              className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100 text-[#6B7770]"
                            >
                              Edit
                            </button>
                          )}
```

Replace with:

```tsx
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => setEditTarget({ booking: b, teeTime: tt })}
                              className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-100 text-[#6B7770]"
                            >
                              Edit
                            </button>
                          )}
                          {b.status === 'confirmed' && b.user_id === null && (
                            <SendConfirmationPopover
                              bookingId={b.id}
                              guestName={getDisplayName(b)}
                              initialEmail={b.guest_email ?? undefined}
                            />
                          )}
```

- [ ] **Step 5: Update the tee sheet page to pass `courseName` and fetch `guest_email`**

In `src/app/course/[slug]/page.tsx`, update the bookings select query to include `guest_email`:

```typescript
      bookings(id, players, total_paid, status, payment_status, points_awarded, user_id, guest_name, guest_phone, guest_email, payment_method,
        profiles(full_name)
      )
```

Update the `TeeSheetGrid` call to pass `courseName`:

```tsx
        <TeeSheetGrid teeTimes={teeTimes as any} slug={slug} courseId={course.id} courseName={course.name} />
```

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/course/TeeSheetGrid.tsx src/app/course/[slug]/page.tsx
git commit -m "feat: wire SendConfirmationPopover into tee sheet; pass courseName through"
```

---

## Task 7: Push to production

- [ ] **Step 1: Push all commits**

```bash
git push
```

- [ ] **Step 2: Verify in Vercel**

Check the Vercel dashboard for a successful deploy. Confirm the tee sheet loads at `/course/[slug]` and the walk-in modal shows the email field.
