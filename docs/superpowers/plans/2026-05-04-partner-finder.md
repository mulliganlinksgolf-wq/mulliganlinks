# Partner Finder ("Find a Playing Partner") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let TeeAhead members signal golf availability and find compatible playing partners — a lightweight opt-in availability board with connection requests, tier-gated for Eagle/Ace.

**Architecture:** Four new Postgres tables (preferences, availability, connection_requests, blocks) with RLS, a types file, server actions, four member-app pages, two email functions, and admin reporting additions. No new npm packages. Follows all existing patterns: Server Actions in `actions.ts` co-located with pages, `createClient()` for server components, `createAdminClient()` for admin/admin checks, Vitest for unit tests.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (Postgres + RLS + Auth), Tailwind CSS v4, shadcn/ui, Resend (email), Vitest (tests), lucide-react (icons already installed)

> ⚠️ **Migration number correction:** The spec says `041_` but latest migration in the repo is `051_`. Use `052_partner_finder.sql`.

---

## File Map

### New files
| Path | Responsibility |
|---|---|
| `supabase/migrations/052_partner_finder.sql` | 4 tables + RLS + helper function |
| `src/types/partners.ts` | Shared TypeScript types |
| `src/app/app/partners/page.tsx` | Browse feed (server component) |
| `src/app/app/partners/actions.ts` | All partner Server Actions |
| `src/app/app/partners/my-availability/page.tsx` | Manage your own availability |
| `src/app/app/partners/preferences/page.tsx` | Edit partner profile |
| `src/app/app/partners/requests/page.tsx` | Requests inbox (received + sent) |
| `src/components/PartnerCard.tsx` | Reusable member card for feed |
| `src/components/PartnerRequestModal.tsx` | Client modal to send a request |
| `src/app/admin/reports/partner-finder/page.tsx` | Partner finder activity stats |
| `src/test/partner-matching.test.ts` | Unit tests for logic |
| `src/test/partner-preferences.test.tsx` | Component test for preferences form |

### Modified files
| Path | Change |
|---|---|
| `src/lib/nav.ts` | Add Partners to SIDEBAR_NAV_ITEMS and BOTTOM_NAV_ITEMS |
| `src/app/app/layout.tsx` | Fetch pending request count, pass to nav |
| `src/components/AppSidebar.tsx` | Accept + render notification dot on Partners item |
| `src/components/AppBottomNav.tsx` | Accept + render notification dot on Partners item |
| `src/lib/resend.ts` | Add sendPartnerRequestEmail + sendPartnerRequestAcceptedEmail |
| `src/app/admin/reports/page.tsx` | Add Partner Finder card |
| `src/app/admin/users/page.tsx` | Add "Partner Profile" column |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/052_partner_finder.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/052_partner_finder.sql

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE partner_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handicap_index numeric(4,1),
  pace_preference text CHECK (pace_preference IN ('relaxed', 'moderate', 'fast')),
  prefers_walking boolean DEFAULT false,
  drinks_ok boolean DEFAULT true,
  smoking_ok boolean DEFAULT false,
  preferred_holes text CHECK (preferred_holes IN ('9', '18', 'either')) DEFAULT 'either',
  skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'any')) DEFAULT 'any',
  bio text,
  is_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(profile_id)
);

CREATE TABLE partner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  time_preference text CHECK (time_preference IN ('morning', 'afternoon', 'evening', 'flexible')) DEFAULT 'flexible',
  course_id uuid REFERENCES courses(id),
  holes text CHECK (holes IN ('9', '18', 'either')) DEFAULT 'either',
  notes text,
  is_active boolean DEFAULT true,
  expires_at timestamptz GENERATED ALWAYS AS (available_date::timestamptz + interval '1 day') STORED,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT available_date_not_past CHECK (available_date >= CURRENT_DATE)
);

CREATE INDEX ON partner_availability(available_date) WHERE is_active = true;
CREATE INDEX ON partner_availability(profile_id);

CREATE TABLE partner_connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  availability_id uuid REFERENCES partner_availability(id) ON DELETE SET NULL,
  message text,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_request CHECK (requester_id != recipient_id),
  CONSTRAINT one_active_request UNIQUE (requester_id, recipient_id, availability_id)
);

CREATE TABLE partner_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_blocked(user_a uuid, user_b uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM partner_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_blocks ENABLE ROW LEVEL SECURITY;

-- partner_preferences
CREATE POLICY "pp_select" ON partner_preferences
  FOR SELECT USING (is_visible = true OR profile_id = auth.uid());
CREATE POLICY "pp_insert" ON partner_preferences
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "pp_update" ON partner_preferences
  FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "pp_delete" ON partner_preferences
  FOR DELETE USING (profile_id = auth.uid());

-- partner_availability
CREATE POLICY "pa_select" ON partner_availability
  FOR SELECT USING (
    is_active = true
    AND available_date >= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM partner_blocks
      WHERE (blocker_id = profile_id AND blocked_id = auth.uid())
         OR (blocker_id = auth.uid() AND blocked_id = profile_id)
    )
  );
CREATE POLICY "pa_insert" ON partner_availability
  FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "pa_update" ON partner_availability
  FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "pa_delete" ON partner_availability
  FOR DELETE USING (profile_id = auth.uid());

-- partner_connection_requests
CREATE POLICY "pcr_select" ON partner_connection_requests
  FOR SELECT USING (requester_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "pcr_insert" ON partner_connection_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "pcr_update_recipient" ON partner_connection_requests
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (status IN ('accepted', 'declined'));
CREATE POLICY "pcr_update_requester" ON partner_connection_requests
  FOR UPDATE USING (requester_id = auth.uid())
  WITH CHECK (status = 'withdrawn');

-- partner_blocks
CREATE POLICY "pb_select" ON partner_blocks
  FOR SELECT USING (blocker_id = auth.uid());
CREATE POLICY "pb_insert" ON partner_blocks
  FOR INSERT WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "pb_delete" ON partner_blocks
  FOR DELETE USING (blocker_id = auth.uid());
```

- [ ] **Step 2: Run the migration locally**

```bash
npx supabase db push
```
Expected: migration applies without errors.

- [ ] **Step 3: Verify tables exist**

```bash
npx supabase db diff --schema public 2>/dev/null | grep -E "partner_|is_blocked"
```
Expected: four table names and the function appear in output.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/052_partner_finder.sql
git commit -m "feat(db): add partner finder tables, RLS, and is_blocked helper"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/partners.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/partners.ts

export type PacePreference = 'relaxed' | 'moderate' | 'fast'
export type TimePreference = 'morning' | 'afternoon' | 'evening' | 'flexible'
export type HolePreference = '9' | '18' | 'either'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'any'
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'

export interface PartnerPreferences {
  id: string
  profile_id: string
  handicap_index: number | null
  pace_preference: PacePreference | null
  prefers_walking: boolean
  drinks_ok: boolean
  smoking_ok: boolean
  preferred_holes: HolePreference
  skill_level: SkillLevel
  bio: string | null
  is_visible: boolean
  updated_at: string
}

export interface PartnerAvailability {
  id: string
  profile_id: string
  available_date: string
  time_preference: TimePreference
  course_id: string | null
  holes: HolePreference
  notes: string | null
  is_active: boolean
  expires_at: string
  created_at: string
  // joined
  profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  preferences?: PartnerPreferences
  course?: {
    id: string
    name: string
    slug: string
  }
}

export interface ConnectionRequest {
  id: string
  requester_id: string
  recipient_id: string
  availability_id: string | null
  message: string | null
  status: RequestStatus
  created_at: string
  updated_at: string
  requester?: { full_name: string | null; avatar_url: string | null }
  recipient?: { full_name: string | null; avatar_url: string | null }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/partners.ts
git commit -m "feat(types): add partner finder TypeScript types"
```

---

## Task 3: Server Actions

**Files:**
- Create: `src/app/app/partners/actions.ts`

- [ ] **Step 1: Write the failing test for validation logic**

```typescript
// src/test/partner-matching.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mocks ──────────────────────────────────────────
const mockAuthGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

// Resend mock (actions call email helpers)
vi.mock('@/lib/resend', () => ({
  sendPartnerRequestEmail: vi.fn().mockResolvedValue(undefined),
  sendPartnerRequestAcceptedEmail: vi.fn().mockResolvedValue(undefined),
}))

// ── Helpers ─────────────────────────────────────────────────
function makeChain(overrides: Partial<{
  data: unknown; error: unknown; count: number
}> = {}) {
  const base = { data: overrides.data ?? null, error: overrides.error ?? null, count: overrides.count ?? 0 }
  const chain: Record<string, unknown> = {}
  const methods = ['select','insert','update','upsert','eq','neq','lt','lte','gte','gt',
                   'in','is','not','order','limit','single','maybeSingle','returns']
  for (const m of methods) chain[m] = vi.fn().mockReturnThis()
  chain['then'] = (resolve: (v: typeof base) => unknown) => Promise.resolve(resolve(base))
  return chain as ReturnType<typeof makeChain>
}

function authenticatedUser(tier: 'fairway' | 'eagle' | 'ace' = 'eagle') {
  mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'memberships')
      return makeChain({ data: { tier } })
    return makeChain({ data: null })
  })
}

// ── Import actions after mocks ───────────────────────────────
import {
  upsertPartnerPreferences,
  upsertAvailability,
  deleteAvailability,
  sendConnectionRequest,
  respondToRequest,
  withdrawRequest,
  blockMember,
} from '@/app/app/partners/actions'

// ── Tests ────────────────────────────────────────────────────

describe('tier gate', () => {
  it('rejects fairway members from upsertPartnerPreferences', async () => {
    authenticatedUser('fairway')
    const result = await upsertPartnerPreferences({ bio: 'hello' })
    expect(result.error).toMatch(/Upgrade to Eagle or Ace/)
  })

  it('rejects fairway members from upsertAvailability', async () => {
    authenticatedUser('fairway')
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: tomorrow,
      time_preference: 'morning',
      holes: 'either',
    })
    expect(result.error).toMatch(/Upgrade to Eagle or Ace/)
  })

  it('allows eagle members through tier gate', async () => {
    authenticatedUser('eagle')
    // upsert succeeds (DB chain returns no error)
    const result = await upsertPartnerPreferences({ bio: 'hello' })
    expect(result.error).toBeUndefined()
  })
})

describe('bio length validation', () => {
  beforeEach(() => authenticatedUser('eagle'))

  it('rejects bio longer than 280 chars', async () => {
    const result = await upsertPartnerPreferences({ bio: 'x'.repeat(281) })
    expect(result.error).toMatch(/280/)
  })

  it('accepts bio of exactly 280 chars', async () => {
    const result = await upsertPartnerPreferences({ bio: 'x'.repeat(280) })
    expect(result.error).toBeUndefined()
  })
})

describe('availability date validation', () => {
  beforeEach(() => authenticatedUser('eagle'))

  it('rejects past dates', async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: yesterday,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toMatch(/past/)
  })

  it('rejects dates more than 60 days out', async () => {
    const wayOut = new Date(Date.now() + 61 * 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: wayOut,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toMatch(/60 days/)
  })

  it('accepts today', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: today,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toBeUndefined()
  })
})

describe('notes length validation', () => {
  beforeEach(() => authenticatedUser('eagle'))

  it('rejects notes longer than 140 chars', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: today,
      time_preference: 'flexible',
      holes: 'either',
      notes: 'x'.repeat(141),
    })
    expect(result.error).toMatch(/140/)
  })

  it('accepts notes of exactly 140 chars', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: today,
      time_preference: 'flexible',
      holes: 'either',
      notes: 'x'.repeat(140),
    })
    expect(result.error).toBeUndefined()
  })
})

describe('availability cap', () => {
  it('rejects 8th slot when 7 already exist', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain({ data: { tier: 'eagle' } })
      if (table === 'partner_availability') return makeChain({ count: 7 })
      return makeChain({ data: null })
    })
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: tomorrow,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toMatch(/7/)
  })

  it('accepts 7th slot when 6 already exist', async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'memberships') return makeChain({ data: { tier: 'eagle' } })
      if (table === 'partner_availability') return makeChain({ count: 6 })
      return makeChain({ data: null })
    })
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const result = await upsertAvailability({
      available_date: tomorrow,
      time_preference: 'flexible',
      holes: 'either',
    })
    expect(result.error).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/test/partner-matching.test.ts 2>&1 | tail -20
```
Expected: FAIL — "Cannot find module '@/app/app/partners/actions'"

- [ ] **Step 3: Create the actions file**

```typescript
// src/app/app/partners/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  PartnerPreferences,
  TimePreference,
  HolePreference,
  RequestStatus,
} from '@/types/partners'
import {
  sendPartnerRequestEmail,
  sendPartnerRequestAcceptedEmail,
} from '@/lib/resend'

async function requireEagleOrAce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' as string, user: null, supabase: null }
  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'
  if (tier === 'fairway') {
    return { error: 'Upgrade to Eagle or Ace to use the Partner Finder.', user: null, supabase: null }
  }
  return { error: null, user, supabase }
}

// ── upsertPartnerPreferences ─────────────────────────────────

export async function upsertPartnerPreferences(
  data: Partial<Omit<PartnerPreferences, 'id' | 'profile_id' | 'updated_at'>>
): Promise<{ error?: string }> {
  const { error: tierError, user, supabase } = await requireEagleOrAce()
  if (tierError) return { error: tierError }

  if (data.bio && data.bio.length > 280) {
    return { error: 'Bio must be 280 characters or fewer.' }
  }

  const { error } = await supabase!
    .from('partner_preferences')
    .upsert(
      { ...data, profile_id: user!.id, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/app/partners/preferences')
  return {}
}

// ── upsertAvailability ────────────────────────────────────────

export async function upsertAvailability(data: {
  available_date: string
  time_preference: TimePreference
  course_id?: string
  holes: HolePreference
  notes?: string
}): Promise<{ error?: string }> {
  const { error: tierError, user, supabase } = await requireEagleOrAce()
  if (tierError) return { error: tierError }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selected = new Date(data.available_date + 'T00:00:00')
  if (selected < today) return { error: 'Cannot add availability for a past date.' }

  const sixtyDaysOut = new Date(today)
  sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60)
  if (selected > sixtyDaysOut) return { error: 'Availability can only be set up to 60 days in advance.' }

  if (data.notes && data.notes.length > 140) {
    return { error: 'Notes must be 140 characters or fewer.' }
  }

  // Enforce 7-slot cap
  const { count } = await supabase!
    .from('partner_availability')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user!.id)
    .eq('is_active', true)
    .gte('available_date', today.toISOString().slice(0, 10))

  if ((count ?? 0) >= 7) {
    return { error: 'You can have at most 7 upcoming availability slots. Delete one to add another.' }
  }

  const { error } = await supabase!.from('partner_availability').insert({
    profile_id: user!.id,
    available_date: data.available_date,
    time_preference: data.time_preference,
    course_id: data.course_id ?? null,
    holes: data.holes,
    notes: data.notes ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/app/partners/my-availability')
  return {}
}

// ── deleteAvailability ────────────────────────────────────────

export async function deleteAvailability(
  availabilityId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('partner_availability')
    .update({ is_active: false })
    .eq('id', availabilityId)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app/partners/my-availability')
  return {}
}

// ── sendConnectionRequest ─────────────────────────────────────

export async function sendConnectionRequest(
  recipientId: string,
  availabilityId: string,
  message?: string
): Promise<{ error?: string }> {
  const { error: tierError, user, supabase } = await requireEagleOrAce()
  if (tierError) return { error: tierError }

  if (message && message.length > 280) {
    return { error: 'Message must be 280 characters or fewer.' }
  }

  // Check block — silently succeed if blocked
  const { data: blocked } = await supabase!.rpc('is_blocked', {
    user_a: user!.id,
    user_b: recipientId,
  })
  if (blocked) return {}

  const { error } = await supabase!.from('partner_connection_requests').insert({
    requester_id: user!.id,
    recipient_id: recipientId,
    availability_id: availabilityId,
    message: message ?? null,
  })

  if (error) {
    // Unique constraint violation = request already exists
    if (error.code === '23505') return { error: 'You already sent a request for this availability.' }
    return { error: error.message }
  }

  // Send notification email (best-effort)
  try {
    const [{ data: requesterProfile }, { data: recipientProfile }, { data: availability }] =
      await Promise.all([
        supabase!.from('profiles').select('full_name').eq('id', user!.id).single(),
        supabase!.from('profiles').select('full_name').eq('id', recipientId).single(),
        supabase!.from('partner_availability').select('available_date').eq('id', availabilityId).single(),
      ])

    const { data: { users } } = await (await import('@/lib/supabase/admin')).createAdminClient()
      .auth.admin.listUsers({ perPage: 1000 })
    const recipientAuthUser = users?.find((u: { id: string }) => u.id === recipientId)

    if (recipientAuthUser?.email) {
      const requesterFirstName = requesterProfile?.full_name?.split(' ')[0] ?? 'Someone'
      await sendPartnerRequestEmail({
        requesterName: requesterFirstName,
        recipientEmail: recipientAuthUser.email,
        availabilityDate: availability?.available_date ?? '',
        message: message,
      })
    }
  } catch {
    // non-fatal
  }

  revalidatePath('/app/partners/requests')
  return {}
}

// ── respondToRequest ──────────────────────────────────────────

export async function respondToRequest(
  requestId: string,
  status: 'accepted' | 'declined'
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('partner_connection_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('recipient_id', user.id)

  if (error) return { error: error.message }

  if (status === 'accepted') {
    try {
      const { data: req } = await supabase
        .from('partner_connection_requests')
        .select('requester_id, availability_id')
        .eq('id', requestId)
        .single()

      if (req) {
        const [{ data: recipientProfile }, { data: availability }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          req.availability_id
            ? supabase.from('partner_availability').select('available_date').eq('id', req.availability_id).single()
            : Promise.resolve({ data: null }),
        ])

        const { data: { users } } = await (await import('@/lib/supabase/admin')).createAdminClient()
          .auth.admin.listUsers({ perPage: 1000 })
        const requesterAuthUser = users?.find((u: { id: string }) => u.id === req.requester_id)

        if (requesterAuthUser?.email) {
          await sendPartnerRequestAcceptedEmail({
            recipientName: recipientProfile?.full_name?.split(' ')[0] ?? 'Your partner',
            requesterEmail: requesterAuthUser.email,
            availabilityDate: availability?.available_date ?? '',
          })
        }
      }
    } catch {
      // non-fatal
    }
  }

  revalidatePath('/app/partners/requests')
  return {}
}

// ── withdrawRequest ───────────────────────────────────────────

export async function withdrawRequest(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('partner_connection_requests')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('requester_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/app/partners/requests')
  return {}
}

// ── blockMember ────────────────────────────────────────────────

export async function blockMember(
  blockedId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error: blockError } = await supabase
    .from('partner_blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId })

  if (blockError && blockError.code !== '23505') return { error: blockError.message }

  // Decline any pending requests between the two users
  await supabase
    .from('partner_connection_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${blockedId}),and(requester_id.eq.${blockedId},recipient_id.eq.${user.id})`)

  revalidatePath('/app/partners')
  return {}
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npx vitest run src/test/partner-matching.test.ts 2>&1 | tail -30
```
Expected: all tests PASS

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "partners" | head -10
```
Expected: no errors in partners files.

- [ ] **Step 6: Commit**

```bash
git add src/app/app/partners/actions.ts src/test/partner-matching.test.ts
git commit -m "feat(partners): server actions + validation tests"
```

---

## Task 4: Email Functions

**Files:**
- Modify: `src/lib/resend.ts`

- [ ] **Step 1: Add the two email functions to the bottom of resend.ts**

Append after the last existing function:

```typescript
export async function sendPartnerRequestEmail({
  requesterName,
  recipientEmail,
  availabilityDate,
  message,
}: {
  requesterName: string
  recipientEmail: string
  availabilityDate: string
  message?: string
}) {
  const client = getResend()
  if (!client) return

  const dateLabel = availabilityDate
    ? new Date(availabilityDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : 'an upcoming date'

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: recipientEmail,
    subject: `${requesterName} wants to play golf with you on ${dateLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">You've got a tee time request ⛳</h2>
        <p>${requesterName} wants to play golf with you on <strong>${dateLabel}</strong>.</p>
        ${message ? `<blockquote style="border-left: 3px solid #1B4332; padding-left: 12px; color: #6B7770;">${message}</blockquote>` : ''}
        <p style="margin: 24px 0;">
          <a href="https://teeahead.com/app/partners/requests"
             style="background: #1B4332; color: #FAF7F2; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            View request →
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">TeeAhead · Your home course, redone right.</p>
      </div>
    `,
  })
}

export async function sendPartnerRequestAcceptedEmail({
  recipientName,
  requesterEmail,
  availabilityDate,
}: {
  recipientName: string
  requesterEmail: string
  availabilityDate: string
}) {
  const client = getResend()
  if (!client) return

  const dateLabel = availabilityDate
    ? new Date(availabilityDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : 'your requested date'

  await client.emails.send({
    from: 'TeeAhead <notifications@teeahead.com>',
    to: requesterEmail,
    subject: `Your golf request was accepted — ${dateLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; color: #1A1A1A;">
        <h2 style="color: #1B4332;">You're on! 🏌️</h2>
        <p>${recipientName} accepted your request to play on <strong>${dateLabel}</strong>.</p>
        <p>Reach out to coordinate the details — tee time, course, who's driving the cart.</p>
        <p style="margin: 24px 0;">
          <a href="https://teeahead.com/app/partners/requests"
             style="background: #1B4332; color: #FAF7F2; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            View your requests →
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #6B7770; font-size: 12px;">TeeAhead · Your home course, redone right.</p>
      </div>
    `,
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "resend" | head -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat(email): add partner request and accepted email templates"
```

---

## Task 5: Preferences Page

**Files:**
- Create: `src/app/app/partners/preferences/page.tsx`

- [ ] **Step 1: Write component test first**

```typescript
// src/test/partner-preferences.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/app/app/partners/actions', () => ({
  upsertPartnerPreferences: vi.fn().mockResolvedValue({}),
}))

// We test the client form component in isolation.
// PreferencesForm is a named export from the page — we test it directly.
import { PreferencesForm } from '@/app/app/partners/preferences/page'

describe('PreferencesForm', () => {
  const defaultPrefs = {
    id: 'pref-1',
    profile_id: 'user-1',
    handicap_index: null,
    pace_preference: null,
    prefers_walking: false,
    drinks_ok: true,
    smoking_ok: false,
    preferred_holes: 'either' as const,
    skill_level: 'any' as const,
    bio: null,
    is_visible: true,
    updated_at: new Date().toISOString(),
  }

  it('renders all fields', () => {
    render(<PreferencesForm existing={defaultPrefs} />)
    expect(screen.getByLabelText(/handicap/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('character counter updates on bio input', () => {
    render(<PreferencesForm existing={defaultPrefs} />)
    const bio = screen.getByLabelText(/bio/i)
    fireEvent.change(bio, { target: { value: 'hello' } })
    expect(screen.getByText(/5 \/ 280/)).toBeInTheDocument()
  })

  it('is_visible toggle defaults to true', () => {
    render(<PreferencesForm existing={defaultPrefs} />)
    const toggle = screen.getByRole('checkbox', { name: /visible/i })
    expect(toggle).toBeChecked()
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run src/test/partner-preferences.test.tsx 2>&1 | tail -10
```
Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Create the preferences page**

```typescript
// src/app/app/partners/preferences/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerPreferences, PacePreference, HolePreference, SkillLevel } from '@/types/partners'
import { upsertPartnerPreferences } from '../actions'

export const metadata: Metadata = { title: 'Partner Preferences — TeeAhead' }

// ── Client form exported for testing ─────────────────────────
'use client' // only the form is a client component — see below

// NOTE: Next.js App Router does not support mixing 'use server' / 'use client'
// in one file. The form is extracted as a named client export.
// The default export (page) remains a server component in a separate chunk.
// We achieve this by having the page import the client component below.

// ─── This file pattern: server page imports a client form ────
// See my-availability/page.tsx for the same pattern.
```

Because Next.js doesn't allow `'use client'` and `'use server'` in the same file, split into two files:

```typescript
// src/app/app/partners/preferences/PreferencesForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertPartnerPreferences } from '../actions'
import type { PartnerPreferences, PacePreference, HolePreference, SkillLevel } from '@/types/partners'

export function PreferencesForm({ existing }: { existing: PartnerPreferences | null }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [handicap, setHandicap] = useState(existing?.handicap_index?.toString() ?? '')
  const [pace, setPace] = useState<PacePreference | ''>(existing?.pace_preference ?? '')
  const [walking, setWalking] = useState(existing?.prefers_walking ?? false)
  const [drinksOk, setDrinksOk] = useState(existing?.drinks_ok ?? true)
  const [smokingOk, setSmokingOk] = useState(existing?.smoking_ok ?? false)
  const [holes, setHoles] = useState<HolePreference>(existing?.preferred_holes ?? 'either')
  const [skill, setSkill] = useState<SkillLevel>(existing?.skill_level ?? 'any')
  const [bio, setBio] = useState(existing?.bio ?? '')
  const [visible, setVisible] = useState(existing?.is_visible ?? true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await upsertPartnerPreferences({
        handicap_index: handicap ? parseFloat(handicap) : null,
        pace_preference: pace || null,
        prefers_walking: walking,
        drinks_ok: drinksOk,
        smoking_ok: smokingOk,
        preferred_holes: holes,
        skill_level: skill,
        bio: bio || null,
        is_visible: visible,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const paceOptions: PacePreference[] = ['relaxed', 'moderate', 'fast']
  const holeOptions: HolePreference[] = ['9', '18', 'either']
  const skillOptions: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'any']

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Handicap */}
      <div>
        <label htmlFor="handicap" className="block text-sm font-medium text-white mb-1">
          Handicap Index
        </label>
        <input
          id="handicap"
          type="number"
          min={0}
          max={54}
          step={0.1}
          value={handicap}
          onChange={e => setHandicap(e.target.value)}
          placeholder="e.g. 14.2"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889]"
        />
      </div>

      {/* Pace */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Pace</span>
        <div className="flex gap-2">
          {paceOptions.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPace(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                pace === p ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      {[
        { label: 'Prefer to walk', value: walking, set: setWalking },
        { label: 'Drinks OK', value: drinksOk, set: setDrinksOk },
        { label: 'Smoking OK', value: smokingOk, set: setSmokingOk },
      ].map(({ label, value, set }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{label}</span>
          <button
            type="button"
            role="switch"
            aria-checked={value}
            onClick={() => set(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              value ? 'bg-[#52B788]' : 'bg-white/20'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      ))}

      {/* Holes */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Preferred Holes</span>
        <div className="flex gap-2">
          {holeOptions.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setHoles(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                holes === h ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {h === 'either' ? 'Either' : `${h} holes`}
            </button>
          ))}
        </div>
      </div>

      {/* Skill */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Skill Level</span>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSkill(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                skill === s ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Tell other golfers a bit about your game..."
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
        />
        <p className="text-xs text-[#8FA889] mt-1 text-right">{bio.length} / 280</p>
      </div>

      {/* Visible toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white">Visible in Partner Finder</span>
          <p className="text-xs text-[#8FA889]">Turn off to hide from other members</p>
        </div>
        <label className="sr-only" htmlFor="visible-toggle">Visible in Partner Finder</label>
        <input
          id="visible-toggle"
          type="checkbox"
          aria-label="Visible in Partner Finder"
          checked={visible}
          onChange={e => setVisible(e.target.checked)}
          className="w-5 h-5 rounded accent-[#52B788]"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-[#52B788] text-sm">Preferences saved!</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2] disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save Preferences'}
      </button>
    </form>
  )
}
```

```typescript
// src/app/app/partners/preferences/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerPreferences } from '@/types/partners'
import { PreferencesForm } from './PreferencesForm'

export { PreferencesForm } from './PreferencesForm'

export const metadata: Metadata = { title: 'Partner Preferences — TeeAhead' }

export default async function PreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'

  const { data: existing } = await supabase
    .from('partner_preferences')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Partner Preferences</h1>
        <p className="text-[#8FA889] mt-1">
          Control how you appear to other members in Find a Partner.
        </p>
      </div>

      {tier === 'fairway' ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-white font-medium mb-2">Eagle or Ace membership required</p>
          <p className="text-[#8FA889] text-sm mb-4">
            Upgrade to Eagle to set your partner preferences and appear in the feed.
          </p>
          <a
            href="/app/membership"
            className="inline-block bg-white text-[#1B4332] font-semibold px-6 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]"
          >
            Upgrade to Eagle →
          </a>
        </div>
      ) : (
        <PreferencesForm existing={existing as PartnerPreferences | null} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run component tests**

```bash
npx vitest run src/test/partner-preferences.test.tsx 2>&1 | tail -20
```
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/app/partners/preferences/ src/test/partner-preferences.test.tsx
git commit -m "feat(partners): preferences page + component tests"
```

---

## Task 6: My Availability Page

**Files:**
- Create: `src/app/app/partners/my-availability/AvailabilityForm.tsx`
- Create: `src/app/app/partners/my-availability/page.tsx`

- [ ] **Step 1: Create the client form component**

```typescript
// src/app/app/partners/my-availability/AvailabilityForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { upsertAvailability } from '../actions'
import type { TimePreference, HolePreference } from '@/types/partners'

type Course = { id: string; name: string }

export function AvailabilityForm({ courses }: { courses: Course[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)
  const maxDate = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10)

  const [date, setDate] = useState(todayStr)
  const [timePreference, setTimePreference] = useState<TimePreference>('flexible')
  const [courseId, setCourseId] = useState('')
  const [holes, setHoles] = useState<HolePreference>('either')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await upsertAvailability({
        available_date: date,
        time_preference: timePreference,
        course_id: courseId || undefined,
        holes,
        notes: notes || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setDate(todayStr)
        setTimePreference('flexible')
        setCourseId('')
        setHoles('either')
        setNotes('')
      }
    })
  }

  const timeOptions: TimePreference[] = ['morning', 'afternoon', 'evening', 'flexible']
  const holeOptions: HolePreference[] = ['9', '18', 'either']

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {/* Date */}
      <div>
        <label htmlFor="avail-date" className="block text-sm font-medium text-white mb-1">
          Date
        </label>
        <input
          id="avail-date"
          type="date"
          required
          min={todayStr}
          max={maxDate}
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm"
        />
      </div>

      {/* Time preference */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Time of Day</span>
        <div className="flex gap-2 flex-wrap">
          {timeOptions.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTimePreference(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                timePreference === t ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred course */}
      <div>
        <label htmlFor="avail-course" className="block text-sm font-medium text-white mb-1">
          Preferred Course <span className="text-[#8FA889] font-normal">(optional)</span>
        </label>
        <select
          id="avail-course"
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm"
        >
          <option value="">No preference</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Holes */}
      <div>
        <span className="block text-sm font-medium text-white mb-2">Holes</span>
        <div className="flex gap-2">
          {holeOptions.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setHoles(h)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                holes === h ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-[#8FA889] hover:bg-white/20'
              }`}
            >
              {h === 'either' ? 'Either' : `${h} holes`}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="avail-notes" className="block text-sm font-medium text-white mb-1">
          Notes <span className="text-[#8FA889] font-normal">(optional)</span>
        </label>
        <textarea
          id="avail-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          maxLength={140}
          rows={2}
          placeholder="e.g. Looking to play a quick 9 after work"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
        />
        <p className="text-xs text-[#8FA889] mt-1 text-right">{notes.length} / 140</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-[#52B788] text-sm">Availability added!</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-white text-[#1B4332] font-semibold py-2.5 rounded-lg hover:bg-[#FAF7F2] disabled:opacity-50"
      >
        {isPending ? 'Adding…' : 'Add Availability'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create the page**

```typescript
// src/app/app/partners/my-availability/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { AvailabilityForm } from './AvailabilityForm'
import { DeleteAvailabilityButton } from './DeleteAvailabilityButton'

export const metadata: Metadata = { title: 'My Availability — TeeAhead' }

export default async function MyAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'

  const today = new Date().toISOString().slice(0, 10)
  const admin = createAdminClient()

  const [{ data: windows }, { data: courses }] = await Promise.all([
    supabase
      .from('partner_availability')
      .select('id, available_date, time_preference, holes, notes, courses(name)')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .gte('available_date', today)
      .order('available_date', { ascending: true }),
    admin
      .from('courses')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
  ])

  const slots = (windows ?? []) as Array<{
    id: string
    available_date: string
    time_preference: string
    holes: string
    notes: string | null
    courses: { name: string } | null
  }>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Availability</h1>
        <p className="text-[#8FA889] mt-1">
          Let other members know when you're free to play.
        </p>
      </div>

      {/* Existing windows */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Your Upcoming Availability</h2>
          <span className="text-sm text-[#8FA889]">{slots.length} of 7 slots used</span>
        </div>
        {slots.length === 0 ? (
          <p className="text-[#8FA889] text-sm">No upcoming availability posted.</p>
        ) : (
          <div className="space-y-2">
            {slots.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div className="space-y-0.5">
                  <p className="text-white font-medium text-sm">
                    {new Date(s.available_date + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                    {' · '}
                    <span className="capitalize text-[#8FA889]">{s.time_preference}</span>
                    {' · '}
                    <span className="text-[#8FA889]">{s.holes === 'either' ? 'Any holes' : `${s.holes} holes`}</span>
                  </p>
                  {s.courses && <p className="text-xs text-[#8FA889]">{s.courses.name}</p>}
                  {s.notes && <p className="text-xs text-[#8FA889] italic">"{s.notes}"</p>}
                </div>
                <DeleteAvailabilityButton availabilityId={s.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form or upsell */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Availability</h2>
        {tier === 'fairway' ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-white font-medium mb-2">Eagle or Ace membership required</p>
            <p className="text-[#8FA889] text-sm mb-4">
              Upgrade to post your availability and connect with other members.
            </p>
            <a
              href="/app/membership"
              className="inline-block bg-white text-[#1B4332] font-semibold px-6 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]"
            >
              Upgrade to Eagle →
            </a>
          </div>
        ) : (
          <AvailabilityForm courses={(courses ?? []) as Array<{ id: string; name: string }>} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the delete button component**

```typescript
// src/app/app/partners/my-availability/DeleteAvailabilityButton.tsx
'use client'

import { useTransition } from 'react'
import { deleteAvailability } from '../actions'

export function DeleteAvailabilityButton({ availabilityId }: { availabilityId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => deleteAvailability(availabilityId))}
      disabled={isPending}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 font-medium"
    >
      {isPending ? '…' : 'Delete'}
    </button>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit 2>&1 | grep "my-availability" | head -5
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/partners/my-availability/
git commit -m "feat(partners): my availability page"
```

---

## Task 7: PartnerCard Component

**Files:**
- Create: `src/components/PartnerCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/PartnerCard.tsx
import type { PartnerAvailability } from '@/types/partners'

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible',
}

interface PartnerCardProps {
  availability: PartnerAvailability
  canRequest: boolean // false for fairway tier
  alreadyRequested: boolean
  onRequestClick: (availability: PartnerAvailability) => void
}

export function PartnerCard({
  availability,
  canRequest,
  alreadyRequested,
  onRequestClick,
}: PartnerCardProps) {
  const { profile, preferences, course } = availability
  const name = displayName(profile?.full_name ?? null)
  const initials = getInitials(profile?.full_name ?? null)

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        )}
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-[#8FA889] text-xs">
            HCP: {preferences?.handicap_index ?? 'Not listed'}
          </p>
        </div>
        <span className="ml-auto text-xs font-medium bg-white/10 text-white px-2.5 py-1 rounded-full capitalize">
          {TIME_LABELS[availability.time_preference]}
        </span>
      </div>

      {/* Preference chips */}
      <div className="flex flex-wrap gap-1.5">
        {preferences?.prefers_walking !== undefined && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            {preferences.prefers_walking ? '🚶 Walking' : '🚗 Riding'}
          </span>
        )}
        {preferences?.pace_preference && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full capitalize">
            {preferences.pace_preference} pace
          </span>
        )}
        <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
          {availability.holes === 'either' ? '9 or 18' : `${availability.holes} holes`}
        </span>
        {preferences?.drinks_ok === false && (
          <span className="text-xs bg-white/10 text-[#8FA889] px-2.5 py-1 rounded-full">
            No drinks
          </span>
        )}
      </div>

      {/* Course + bio */}
      {course && (
        <p className="text-xs text-[#8FA889]">📍 {course.name}</p>
      )}
      {preferences?.bio && (
        <p className="text-sm text-[#8FA889] line-clamp-2">{preferences.bio}</p>
      )}
      {availability.notes && (
        <p className="text-xs text-[#8FA889] italic">"{availability.notes}"</p>
      )}

      {/* Action */}
      {canRequest ? (
        alreadyRequested ? (
          <button
            disabled
            className="w-full text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] cursor-default"
          >
            Request already sent
          </button>
        ) : (
          <button
            onClick={() => onRequestClick(availability)}
            className="w-full text-sm font-semibold py-2 rounded-lg bg-white text-[#1B4332] hover:bg-[#FAF7F2]"
          >
            Request to Play
          </button>
        )
      ) : (
        <a
          href="/app/membership"
          className="block text-center text-sm font-medium py-2 rounded-lg bg-white/5 text-[#8FA889] hover:bg-white/10"
        >
          Eagle members can connect →
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "PartnerCard" | head -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PartnerCard.tsx
git commit -m "feat(partners): PartnerCard component"
```

---

## Task 8: PartnerRequestModal Component

**Files:**
- Create: `src/components/PartnerRequestModal.tsx`

- [ ] **Step 1: Create the modal**

```typescript
// src/components/PartnerRequestModal.tsx
'use client'

import { useState, useTransition } from 'react'
import { sendConnectionRequest } from '@/app/app/partners/actions'
import type { PartnerAvailability } from '@/types/partners'

function displayName(fullName: string | null): string {
  if (!fullName) return 'this member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

interface PartnerRequestModalProps {
  availability: PartnerAvailability
  onClose: () => void
  onSent: () => void
}

export function PartnerRequestModal({ availability, onClose, onSent }: PartnerRequestModalProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const name = displayName(availability.profile?.full_name ?? null)
  const dateLabel = new Date(availability.available_date + 'T12:00:00').toLocaleDateString(
    'en-US', { weekday: 'long', month: 'long', day: 'numeric' }
  )

  function handleSend() {
    setError(null)
    startTransition(async () => {
      const result = await sendConnectionRequest(
        availability.profile_id,
        availability.id,
        message || undefined
      )
      if (result.error) {
        setError(result.error)
      } else {
        onSent()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1B4332] rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div>
          <h2 className="text-white font-bold text-lg">Request to Play</h2>
          <p className="text-[#8FA889] text-sm mt-1">
            Sending to <strong className="text-white">{name}</strong> for {dateLabel}.
          </p>
        </div>

        <div>
          <label htmlFor="req-message" className="block text-sm font-medium text-white mb-1">
            Message <span className="text-[#8FA889] font-normal">(optional)</span>
          </label>
          <textarea
            id="req-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="Introduce yourself or suggest a course…"
            className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm placeholder:text-[#8FA889] resize-none"
          />
          <p className="text-xs text-[#8FA889] text-right mt-1">{message.length} / 280</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-white text-[#1B4332] text-sm font-semibold hover:bg-[#FAF7F2] disabled:opacity-50"
          >
            {isPending ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PartnerRequestModal.tsx
git commit -m "feat(partners): PartnerRequestModal component"
```

---

## Task 9: Browse Page (Feed)

**Files:**
- Create: `src/app/app/partners/page.tsx`
- Create: `src/app/app/partners/BrowseFeed.tsx`

The page is a server component for data fetching; the interactive feed (modal state) is a client component.

- [ ] **Step 1: Create the client feed component**

```typescript
// src/app/app/partners/BrowseFeed.tsx
'use client'

import { useState } from 'react'
import { PartnerCard } from '@/components/PartnerCard'
import { PartnerRequestModal } from '@/components/PartnerRequestModal'
import type { PartnerAvailability } from '@/types/partners'

interface BrowseFeedProps {
  grouped: { dateLabel: string; date: string; items: PartnerAvailability[] }[]
  canRequest: boolean
  sentToAvailabilityIds: Set<string>
}

export function BrowseFeed({ grouped, canRequest, sentToAvailabilityIds }: BrowseFeedProps) {
  const [activeAvailability, setActiveAvailability] = useState<PartnerAvailability | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(sentToAvailabilityIds)

  if (grouped.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#8FA889] text-lg">No one's posted availability for the next two weeks.</p>
        <p className="text-[#8FA889] text-sm mt-1">Be the first — add your availability.</p>
        <a
          href="/app/partners/my-availability"
          className="inline-block mt-4 bg-white text-[#1B4332] font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#FAF7F2]"
        >
          Add my availability
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {grouped.map(group => (
          <div key={group.date}>
            <h2 className="text-lg font-semibold text-white mb-3">{group.dateLabel}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(av => (
                <PartnerCard
                  key={av.id}
                  availability={av}
                  canRequest={canRequest}
                  alreadyRequested={sentIds.has(av.id)}
                  onRequestClick={a => setActiveAvailability(a)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeAvailability && (
        <PartnerRequestModal
          availability={activeAvailability}
          onClose={() => setActiveAvailability(null)}
          onSent={() => {
            setSentIds(prev => new Set([...prev, activeAvailability.id]))
            setActiveAvailability(null)
          }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Create the browse page**

```typescript
// src/app/app/partners/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { PartnerAvailability } from '@/types/partners'
import { BrowseFeed } from './BrowseFeed'

export const metadata: Metadata = { title: 'Find a Partner — TeeAhead' }

function buildDateLabel(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T12:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  const formatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  if (diff === 0) return `Today — ${formatted}`
  if (diff === 1) return `Tomorrow — ${formatted}`
  return formatted
}

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const tier = membership?.tier ?? 'fairway'
  const canRequest = tier !== 'fairway'

  const today = new Date().toISOString().slice(0, 10)
  const fourteenDays = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)

  const [{ data: rows }, { data: sentRequests }] = await Promise.all([
    supabase
      .from('partner_availability')
      .select(`
        id, profile_id, available_date, time_preference, holes, notes, course_id, expires_at, is_active, created_at,
        profile:profiles!profile_id(id, full_name, avatar_url),
        preferences:partner_preferences!profile_id(
          id, profile_id, handicap_index, pace_preference, prefers_walking,
          drinks_ok, smoking_ok, preferred_holes, skill_level, bio, is_visible, updated_at
        ),
        course:courses(id, name, slug)
      `)
      .neq('profile_id', user.id)
      .eq('is_active', true)
      .gte('available_date', today)
      .lte('available_date', fourteenDays)
      .order('available_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('partner_connection_requests')
      .select('availability_id')
      .eq('requester_id', user.id)
      .in('status', ['pending', 'accepted']),
  ])

  const availabilities = (rows ?? []) as PartnerAvailability[]
  const sentToAvailabilityIds = new Set(
    (sentRequests ?? []).map((r: { availability_id: string | null }) => r.availability_id).filter(Boolean) as string[]
  )

  // Group by date
  const groupMap = new Map<string, PartnerAvailability[]>()
  for (const av of availabilities) {
    const existing = groupMap.get(av.available_date) ?? []
    existing.push(av)
    groupMap.set(av.available_date, existing)
  }
  const grouped = Array.from(groupMap.entries()).map(([date, items]) => ({
    date,
    dateLabel: buildDateLabel(date),
    items,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Find a Playing Partner</h1>
          <p className="text-[#8FA889] mt-1">Members available to play in the next 14 days.</p>
        </div>
        <a
          href="/app/partners/my-availability"
          className="bg-white text-[#1B4332] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[#FAF7F2]"
        >
          + My Availability
        </a>
      </div>

      <BrowseFeed
        grouped={grouped}
        canRequest={canRequest}
        sentToAvailabilityIds={sentToAvailabilityIds}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "partners" | head -10
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/partners/page.tsx src/app/app/partners/BrowseFeed.tsx
git commit -m "feat(partners): browse feed page"
```

---

## Task 10: Requests Inbox Page

**Files:**
- Create: `src/app/app/partners/requests/page.tsx`
- Create: `src/app/app/partners/requests/RequestActions.tsx`

- [ ] **Step 1: Create the request action buttons (client component)**

```typescript
// src/app/app/partners/requests/RequestActions.tsx
'use client'

import { useTransition } from 'react'
import { respondToRequest, withdrawRequest } from '../actions'

export function RespondButtons({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => respondToRequest(requestId, 'accepted'))}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-[#1B4332] hover:bg-[#FAF7F2] disabled:opacity-50"
      >
        Accept
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => respondToRequest(requestId, 'declined'))}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-[#8FA889] hover:bg-white/20 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  )
}

export function WithdrawButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => withdrawRequest(requestId))}
      className="text-sm text-[#8FA889] hover:text-white disabled:opacity-50"
    >
      {isPending ? '…' : 'Withdraw'}
    </button>
  )
}
```

- [ ] **Step 2: Create the requests page**

```typescript
// src/app/app/partners/requests/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { ConnectionRequest } from '@/types/partners'
import { RespondButtons, WithdrawButton } from './RequestActions'

export const metadata: Metadata = { title: 'Partner Requests — TeeAhead' }

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  accepted: 'bg-green-500/20 text-green-300',
  declined: 'bg-red-500/20 text-red-300',
  withdrawn: 'bg-white/10 text-[#8FA889]',
}

function displayName(fullName: string | null): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'sent' ? 'sent' : 'received'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: received }, { data: sent }] = await Promise.all([
    supabase
      .from('partner_connection_requests')
      .select(`
        id, requester_id, recipient_id, availability_id, message, status, created_at, updated_at,
        requester:profiles!requester_id(full_name, avatar_url),
        availability:partner_availability(available_date)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('partner_connection_requests')
      .select(`
        id, requester_id, recipient_id, availability_id, message, status, created_at, updated_at,
        recipient:profiles!recipient_id(full_name, avatar_url),
        availability:partner_availability(available_date)
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const receivedRequests = (received ?? []) as (ConnectionRequest & {
    availability: { available_date: string } | null
  })[]
  const sentRequests = (sent ?? []) as (ConnectionRequest & {
    availability: { available_date: string } | null
  })[]

  const pendingReceived = receivedRequests.filter(r => r.status === 'pending')
  const historicReceived = receivedRequests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Partner Requests</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(['received', 'sent'] as const).map(t => (
          <a
            key={t}
            href={t === 'received' ? '/app/partners/requests' : '/app/partners/requests?tab=sent'}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === t ? 'bg-white text-[#1B4332]' : 'text-[#8FA889] hover:text-white'
            }`}
          >
            {t}
            {t === 'received' && pendingReceived.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingReceived.length}
              </span>
            )}
          </a>
        ))}
      </div>

      {activeTab === 'received' ? (
        <div className="space-y-6">
          {/* Pending */}
          {pendingReceived.length === 0 && historicReceived.length === 0 && (
            <p className="text-[#8FA889]">No requests yet.</p>
          )}
          {pendingReceived.length > 0 && (
            <div className="space-y-3">
              {pendingReceived.map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {displayName((r.requester as any)?.full_name ?? null)}
                      </p>
                      {r.availability?.available_date && (
                        <p className="text-[#8FA889] text-xs">
                          {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                            'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                          )}
                        </p>
                      )}
                    </div>
                    <RespondButtons requestId={r.id} />
                  </div>
                  {r.message && (
                    <p className="text-sm text-[#8FA889] italic border-l-2 border-white/10 pl-3">
                      "{r.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {historicReceived.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#8FA889] uppercase tracking-wider mb-3">History</h3>
              <div className="space-y-2">
                {historicReceived.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                  >
                    <p className="text-white text-sm">
                      {displayName((r.requester as any)?.full_name ?? null)}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sentRequests.length === 0 && (
            <p className="text-[#8FA889]">You haven't sent any requests yet.</p>
          )}
          {sentRequests.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-white text-sm font-medium">
                  {displayName((r.recipient as any)?.full_name ?? null)}
                </p>
                {r.availability?.available_date && (
                  <p className="text-[#8FA889] text-xs">
                    {new Date(r.availability.available_date + 'T12:00:00').toLocaleDateString(
                      'en-US', { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[r.status]}`}>
                  {r.status}
                </span>
                {r.status === 'pending' && <WithdrawButton requestId={r.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/app/partners/requests/
git commit -m "feat(partners): requests inbox page"
```

---

## Task 11: Nav Integration + Notification Dot

**Files:**
- Modify: `src/lib/nav.ts`
- Modify: `src/app/app/layout.tsx`
- Modify: `src/components/AppSidebar.tsx`
- Modify: `src/components/AppBottomNav.tsx`

The nav currently uses emoji strings. We'll extend `NavItem` with an optional `badge` number and pass the pending request count from the layout.

- [ ] **Step 1: Update nav.ts to add Partners**

In `src/lib/nav.ts`, update `NavItem` and both arrays:

```typescript
export interface NavItem {
  href: string
  label: string
  icon: string
  exact?: boolean
  badge?: number   // optional notification count
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: '/app',              label: 'Dashboard',   icon: '⛳', exact: true },
  { href: '/app/courses',      label: 'Courses',     icon: '🗺️' },
  { href: '/app/bookings',     label: 'Bookings',    icon: '📋' },
  { href: '/app/partners',     label: 'Find a Partner', icon: '🤝' },
  { href: '/app/leagues',      label: 'Leagues',     icon: '🏆' },
  { href: '/app/trading',      label: 'Exchange',    icon: '🔄' },
  { href: '/app/points',       label: 'Points',      icon: '⭐' },
  { href: '/app/card',         label: 'My Card',     icon: '🃏' },
  { href: '/app/billing',      label: 'Billing',     icon: '💳' },
  { href: '/app/profile',      label: 'Profile',     icon: '👤' },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: '/app',          label: 'Home',      icon: '⛳', exact: true },
  { href: '/app/courses',  label: 'Courses',   icon: '🗺️' },
  { href: '/app/bookings', label: 'Bookings',  icon: '📋' },
  { href: '/app/partners', label: 'Partners',  icon: '🤝' },
  { href: '/app/leagues',  label: 'Leagues',   icon: '🏆' },
]
```

- [ ] **Step 2: Update the layout to fetch pending count and inject badge**

Replace `src/app/app/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/AppSidebar'
import AppBottomNav from '@/components/AppBottomNav'
import { SIDEBAR_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '@/lib/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count: pendingCount } = await supabase
    .from('partner_connection_requests')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  const pending = pendingCount ?? 0

  const sidebarItems = SIDEBAR_NAV_ITEMS.map(item =>
    item.href === '/app/partners' && pending > 0
      ? { ...item, badge: pending }
      : item
  )
  const bottomItems = BOTTOM_NAV_ITEMS.map(item =>
    item.href === '/app/partners' && pending > 0
      ? { ...item, badge: pending }
      : item
  )

  return (
    <div className="flex h-screen bg-[#0f2d1d] overflow-hidden">
      <AppSidebar items={sidebarItems} />
      <main className="flex-1 overflow-y-auto md:pl-56">
        <div className="px-8 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <AppBottomNav items={bottomItems} />
    </div>
  )
}
```

- [ ] **Step 3: Update AppSidebar to accept items prop and render badge**

Replace `src/components/AppSidebar.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { isNavItemActive, type NavItem } from '@/lib/nav'

export default function AppSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 fixed top-0 left-0 bottom-0 bg-[#1B4332] border-r border-[#0f2d1d]">
      <div className="p-5 border-b border-[#0f2d1d]">
        <Image
          src="/brand/teeahead-logo-primary.svg"
          alt="TeeAhead"
          width={140}
          height={37}
          className="h-8 w-auto brightness-0 invert"
        />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                active
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#8FA889] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[#0f2d1d]">
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#8FA889] hover:text-white hover:bg-white/5"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Update AppBottomNav to accept items prop and render badge**

Replace `src/components/AppBottomNav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavItemActive, type NavItem } from '@/lib/nav'

export default function AppBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1B4332] border-t border-[#0f2d1d] flex items-center justify-around py-2">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 text-[10px] font-medium ${
              active ? 'text-white' : 'text-[#8FA889]'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-0.5 right-0 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 5: Verify nav.test.ts still passes**

```bash
npx vitest run src/test/nav.test.ts 2>&1 | tail -10
```
Expected: all PASS (the test doesn't reference specific item counts — confirm if needed)

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "nav|layout|AppSidebar|AppBottomNav" | head -10
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/nav.ts src/app/app/layout.tsx src/components/AppSidebar.tsx src/components/AppBottomNav.tsx
git commit -m "feat(nav): add Partner Finder nav item with notification dot"
```

---

## Task 12: Admin Additions

**Files:**
- Modify: `src/app/admin/reports/page.tsx`
- Create: `src/app/admin/reports/partner-finder/page.tsx`
- Modify: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Add the Partner Finder card to the reports index**

In `src/app/admin/reports/page.tsx`, add to the `reports` array (after the existing three entries):

```typescript
{
  href: '/admin/reports/partner-finder',
  title: 'Partner Finder Activity',
  description: 'Members with preferences set, active availability windows, connection request breakdown',
  icon: '🤝',
},
```

- [ ] **Step 2: Create the partner finder report page**

```typescript
// src/app/admin/reports/partner-finder/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Partner Finder Activity' }

export default async function PartnerFinderReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/app')

  const today = new Date().toISOString().slice(0, 10)

  const [
    { count: prefsCount },
    { count: availCount },
    { count: pendingCount },
    { count: acceptedCount },
    { count: declinedCount },
    { count: withdrawnCount },
  ] = await Promise.all([
    admin.from('partner_preferences').select('id', { count: 'exact', head: true }).eq('is_visible', true),
    admin.from('partner_availability').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('available_date', today),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'declined'),
    admin.from('partner_connection_requests').select('id', { count: 'exact', head: true }).eq('status', 'withdrawn'),
  ])

  const stats = [
    { label: 'Members with visible profiles', value: prefsCount ?? 0 },
    { label: 'Active availability windows', value: availCount ?? 0 },
    { label: 'Requests — Pending', value: pendingCount ?? 0 },
    { label: 'Requests — Accepted', value: acceptedCount ?? 0 },
    { label: 'Requests — Declined', value: declinedCount ?? 0 },
    { label: 'Requests — Withdrawn', value: withdrawnCount ?? 0 },
  ]

  return (
    <div>
      <div className="mb-6">
        <a href="/admin/reports" className="text-sm text-[#6B7770] hover:text-[#1B4332]">← Reports</a>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mt-2">Partner Finder Activity</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-3xl font-bold text-[#1B4332]">{s.value.toLocaleString()}</p>
            <p className="text-sm text-[#6B7770] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add "Partner Profile" column to admin users table**

In `src/app/admin/users/page.tsx`, update the query to join `partner_preferences` and add the column to the member map and table render.

Find the `profilesResult` query and update the select:

```typescript
// Change:
admin
  .from('profiles')
  .select('id, full_name, phone, is_admin, founding_member, created_at, memberships(tier, status)')

// To:
admin
  .from('profiles')
  .select('id, full_name, phone, is_admin, founding_member, created_at, memberships(tier, status), partner_preferences(is_visible)')
```

In the members `.map()`, add the partner field:

```typescript
.map(p => ({
  ...p,
  email: emailMap[p.id] ?? '',
  hasPartnerProfile: Array.isArray((p as any).partner_preferences)
    ? (p as any).partner_preferences[0]?.is_visible === true
    : (p as any).partner_preferences?.is_visible === true,
}))
```

In the table `<th>` row, add after the existing tier/status headers:

```html
<th className="px-4 py-3 text-left text-xs font-medium text-[#6B7770] uppercase tracking-wider">
  Partner Profile
</th>
```

In the table `<td>` row for each member `m`, add the corresponding cell:

```html
<td className="px-4 py-3 text-sm text-center">
  {m.hasPartnerProfile ? (
    <span title="Has visible partner profile">✅</span>
  ) : (
    <span className="text-[#D1D5D4]">—</span>
  )}
</td>
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "admin" | head -10
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/reports/ src/app/admin/users/page.tsx
git commit -m "feat(admin): partner finder activity report + partner profile column in users"
```

---

## Task 13: Full Test Run + Build Verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run 2>&1 | tail -30
```
Expected: all suites pass, no regressions.

- [ ] **Step 2: Check TypeScript across entire project**

```bash
npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -30
```
Expected: build completes successfully.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -p   # review any stray changes
git commit -m "chore(partners): clean up types and build warnings"
```

---

## Spec Coverage Self-Review

| Requirement | Task |
|---|---|
| 4 tables + RLS + is_blocked | Task 1 |
| TypeScript types | Task 2 |
| All 7 Server Actions | Task 3 |
| Bio ≤ 280, notes ≤ 140, date validation | Task 3 |
| 7-slot availability cap | Task 3 |
| Silent block in sendConnectionRequest | Task 3 |
| sendPartnerRequestEmail | Task 4 |
| sendPartnerRequestAcceptedEmail | Task 4 |
| Preferences page + fairway upsell | Task 5 |
| My Availability page + fairway upsell | Task 6 |
| PartnerCard (first name + last initial only) | Task 7 |
| PartnerRequestModal + already-sent state | Task 8 |
| Browse feed, 14-day window, date groups | Task 9 |
| Fairway → upsell chip in feed | Task 9 |
| Empty state | Task 9 |
| Requests inbox (received + sent tabs) | Task 10 |
| Accept / Decline / Withdraw buttons | Task 10 |
| Find a Partner in sidebar + bottom nav | Task 11 |
| Notification dot for pending requests | Task 11 |
| Admin: Partner Finder Activity report | Task 12 |
| Admin users: Partner Profile column | Task 12 |
| Unit tests: validation logic | Task 3 |
| Component test: preferences form | Task 5 |
| Migration numbered correctly (052) | Task 1 |

**No gaps found.**

---

## Notes for Executor

- The spec lists migration `041_` — the actual next number is **`052_`** (latest existing is `051_`). The plan uses `052`.
- `partner_preferences` join in the browse page uses a self-referencing foreign key (`profile_id`). Supabase may need the join written as `partner_preferences!profile_id(...)` — the plan already reflects this.
- The `DeleteAvailabilityButton` component needs to be in the same `my-availability/` directory as the page since it imports from `../actions`.
- Admin users page edits are described in prose in Task 12 because the full file is very long and only a few targeted lines change — the executor should find and patch those specific sections rather than rewriting the whole file.
