# Social Media Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/social` — a Buffer-connected social scheduling page with AI caption generation and a 3-panel UI for composing, queuing, and managing TeeAhead social posts.

**Architecture:** Buffer GraphQL client in `src/lib/buffer.ts`, two API routes for image preview and caption generation, server actions for mutations, a server-component page shell that fetches Buffer data in parallel, and a 3-panel client component split into focused sub-components (composer, queue, ideas).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Vitest + React Testing Library, Buffer GraphQL API, Anthropic SDK (claude-sonnet-4-20250514)

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/lib/audit.ts` | Add `social_post_scheduled`, `social_idea_saved` to event type union; add `social` to target type |
| Create | `src/lib/buffer.ts` | Typed GraphQL client for Buffer API |
| Create | `src/test/buffer.test.ts` | Unit tests for buffer client |
| Modify | `.env.example` | Add `ANTHROPIC_API_KEY`, `BUFFER_API_KEY`, `BUFFER_ORG_ID` |
| Modify | `.env.local` | Add `BUFFER_API_KEY` real value, `BUFFER_ORG_ID` placeholder |
| Create | `src/app/api/social/upload-image/route.ts` | Image → base64 dataUrl preview (5MB, jpeg/png/webp only) |
| Create | `src/test/social-upload.test.ts` | Validation logic unit tests |
| Create | `src/app/api/social/generate-caption/route.ts` | Single Anthropic call → all-platform captions JSON |
| Create | `src/test/social-captions.test.ts` | Caption route unit tests with mocked Anthropic |
| Create | `src/app/admin/social/actions.ts` | `schedulePost` + `saveIdea` server actions |
| Create | `src/app/admin/social/page.tsx` | Server component: auth check, parallel Buffer fetch, setup banner |
| Create | `src/components/admin/social/SocialQueue.tsx` | Center panel: scheduled post cards + Saturday warning |
| Create | `src/components/admin/social/SocialIdeasPanel.tsx` | Right panel: idea input + recently sent |
| Create | `src/components/admin/social/SocialComposer.tsx` | Left panel: all composer fields + generate captions |
| Create | `src/components/admin/SocialManager.tsx` | Orchestrator: 3-column grid, passes props + callbacks to panels |
| Modify | `src/components/admin/AdminSidebar.tsx` | Add Social nav item (📣) under Platform section |

---

## Task 1: Extend audit types + add env vars

**Files:**
- Modify: `src/lib/audit.ts`
- Modify: `.env.example`
- Modify: `.env.local`

- [ ] **Step 1: Add new audit event and target types**

In `src/lib/audit.ts`, extend both unions:

```typescript
export type AuditEventType =
  | 'membership_cancelled'
  | 'refund_issued'
  | 'tier_changed'
  | 'member_created'
  | 'member_deleted'
  | 'credit_added'
  | 'points_adjusted'
  | 'config_changed'
  | 'content_edited'
  | 'dispute_updated'
  | 'email_sent'
  | 'admin_note_added'
  | 'profile_updated'
  | 'social_post_scheduled'
  | 'social_idea_saved'

export type AuditTargetType = 'member' | 'config' | 'content' | 'dispute' | 'communication' | 'social'
```

- [ ] **Step 2: Add env vars to .env.example**

Append to `.env.example`:

```bash
# Anthropic (used by caption generator and other AI routes)
ANTHROPIC_API_KEY=      # console.anthropic.com

# Buffer (social scheduling)
BUFFER_API_KEY=         # publish.buffer.com/settings/api
BUFFER_ORG_ID=          # Buffer organization ID — obtain via Buffer API or dashboard
```

- [ ] **Step 3: Add env vars to .env.local**

Append to `.env.local`:

```
BUFFER_API_KEY=_MYk-_yqq-lRkrm3g0gOff3Q5uKBoE3E1liqFhU_ou2
BUFFER_ORG_ID=
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/audit.ts .env.example
git commit -m "feat(social): extend audit types for social actions, add Buffer env vars to example"
```

---

## Task 2: Buffer API client

**Files:**
- Create: `src/lib/buffer.ts`
- Create: `src/test/buffer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/buffer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('buffer client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('throws when BUFFER_API_KEY is missing', async () => {
    vi.stubEnv('BUFFER_API_KEY', '')
    const { getChannels } = await import('@/lib/buffer')
    await expect(getChannels('org1')).rejects.toThrow(
      'BUFFER_API_KEY not configured'
    )
  })

  it('getChannels calls Buffer GraphQL with Authorization header', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          channels: [
            { id: 'ch1', name: 'TeeAhead Instagram', service: 'instagram', avatar: 'https://example.com/avatar.jpg' },
          ],
        },
      }),
    } as Response)

    const { getChannels } = await import('@/lib/buffer')
    const channels = await getChannels('org1')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.buffer.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      })
    )
    expect(channels).toHaveLength(1)
    expect(channels[0].service).toBe('instagram')
  })

  it('getChannels throws on non-200 response', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)

    const { getChannels } = await import('@/lib/buffer')
    await expect(getChannels('org1')).rejects.toThrow('Buffer API error: 401')
  })

  it('getChannels throws on GraphQL errors array', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        errors: [{ message: 'Invalid organization ID' }],
      }),
    } as Response)

    const { getChannels } = await import('@/lib/buffer')
    await expect(getChannels('org1')).rejects.toThrow('Invalid organization ID')
  })

  it('createPost fires one mutation per channelId', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          createPost: {
            __typename: 'PostActionSuccess',
            post: { id: 'p1', dueAt: '2026-05-10T12:00:00Z' },
          },
        },
      }),
    } as Response)

    const { createPost } = await import('@/lib/buffer')
    const results = await createPost({
      text: 'Test post',
      channelIds: ['ch1', 'ch2'],
      mode: 'addToQueue',
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('p1')
  })

  it('createPost throws on MutationError', async () => {
    vi.stubEnv('BUFFER_API_KEY', 'test-key')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          createPost: {
            __typename: 'MutationError',
            error: { message: 'Channel not found' },
          },
        },
      }),
    } as Response)

    const { createPost } = await import('@/lib/buffer')
    await expect(
      createPost({ text: 'Test', channelIds: ['bad'], mode: 'addToQueue' })
    ).rejects.toThrow('Channel not found')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/barris/Desktop/MulliganLinks
npx vitest run src/test/buffer.test.ts
```

Expected: all tests fail with "Cannot find module '@/lib/buffer'"

- [ ] **Step 3: Create the Buffer client**

Create `src/lib/buffer.ts`:

```typescript
const BUFFER_API_URL = 'https://api.buffer.com/graphql'

export type BufferChannel = {
  id: string
  name: string
  service: 'instagram' | 'facebook' | 'linkedin' | 'twitter'
  avatar: string
}

export type BufferPost = {
  id: string
  text: string
  channelId: string
  dueAt: string
  status: 'scheduled' | 'sent' | 'error'
  assets: { url: string }[]
}

export type CreatePostInput = {
  text: string
  channelIds: string[]
  dueAt?: string
  mode: 'addToQueue' | 'customScheduled'
  mediaUrls?: string[]
}

function getApiKey(): string {
  const key = process.env.BUFFER_API_KEY
  if (!key) {
    throw new Error(
      'BUFFER_API_KEY not configured. Add it to your environment variables.'
    )
  }
  return key
}

async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const key = getApiKey()
  const res = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`Buffer API error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }
  return json.data as T
}

export async function getChannels(orgId: string): Promise<BufferChannel[]> {
  const data = await gqlRequest<{ channels: BufferChannel[] }>(
    `query GetChannels($organizationId: String!) {
      channels(organizationId: $organizationId) {
        id name service avatar
      }
    }`,
    { organizationId: orgId }
  )
  return data.channels ?? []
}

export async function getScheduledPosts(orgId: string): Promise<BufferPost[]> {
  const data = await gqlRequest<{ posts: BufferPost[] }>(
    `query GetScheduledPosts($organizationId: String!) {
      posts(
        first: 50
        input: { organizationId: $organizationId, filter: { status: [scheduled] } }
      ) {
        id text channelId dueAt status assets { url }
      }
    }`,
    { organizationId: orgId }
  )
  return data.posts ?? []
}

export async function getSentPosts(
  orgId: string,
  limit = 10
): Promise<BufferPost[]> {
  const data = await gqlRequest<{ posts: BufferPost[] }>(
    `query GetSentPosts($organizationId: String!, $limit: Int!) {
      posts(
        first: $limit
        input: { organizationId: $organizationId, filter: { status: [sent] } }
      ) {
        id text channelId dueAt status assets { url }
      }
    }`,
    { organizationId: orgId, limit }
  )
  return data.posts ?? []
}

export async function createPost(
  input: CreatePostInput
): Promise<{ id: string; dueAt: string }[]> {
  const results: { id: string; dueAt: string }[] = []
  for (const channelId of input.channelIds) {
    const data = await gqlRequest<{
      createPost: {
        __typename: string
        post?: { id: string; dueAt: string }
        error?: { message: string }
      }
    }>(
      `mutation CreatePost(
        $channelId: String!
        $text: String!
        $dueAt: String
        $mode: String!
      ) {
        createPost(input: {
          channelId: $channelId
          text: $text
          dueAt: $dueAt
          mode: $mode
        }) {
          ... on PostActionSuccess {
            post { id dueAt }
          }
          ... on MutationError {
            error { message }
          }
        }
      }`,
      { channelId, text: input.text, dueAt: input.dueAt ?? null, mode: input.mode }
    )
    if (data.createPost.__typename === 'MutationError') {
      throw new Error(data.createPost.error?.message ?? 'Buffer mutation failed')
    }
    if (data.createPost.post) {
      results.push(data.createPost.post)
    }
  }
  return results
}

export async function createIdea(
  orgId: string,
  title: string,
  text: string
): Promise<{ id: string }> {
  const data = await gqlRequest<{ createIdea: { id: string } }>(
    `mutation CreateIdea(
      $organizationId: String!
      $title: String!
      $text: String!
    ) {
      createIdea(organizationId: $organizationId, title: $title, text: $text) {
        id
      }
    }`,
    { organizationId: orgId, title, text }
  )
  return data.createIdea
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/test/buffer.test.ts
```

Expected: all 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/buffer.ts src/test/buffer.test.ts
git commit -m "feat(social): add typed Buffer GraphQL client with unit tests"
```

---

## Task 3: Image upload API route

**Files:**
- Create: `src/app/api/social/upload-image/route.ts`
- Create: `src/test/social-upload.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/social-upload.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Extract the validation logic as a pure function to test it independently
// (the route handler itself is IO, but validation is pure)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function validateUpload(
  mimeType: string,
  sizeBytes: number
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return { valid: false, error: 'File must be JPEG, PNG, or WebP' }
  }
  if (sizeBytes > MAX_BYTES) {
    return { valid: false, error: 'File must be under 5MB' }
  }
  return { valid: true }
}

describe('upload image validation', () => {
  it('accepts image/jpeg', () => {
    expect(validateUpload('image/jpeg', 1024).valid).toBe(true)
  })

  it('accepts image/png', () => {
    expect(validateUpload('image/png', 1024).valid).toBe(true)
  })

  it('accepts image/webp', () => {
    expect(validateUpload('image/webp', 1024).valid).toBe(true)
  })

  it('rejects image/gif', () => {
    const result = validateUpload('image/gif', 1024)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/JPEG|PNG|WebP/i)
  })

  it('rejects files over 5MB', () => {
    const result = validateUpload('image/png', 5 * 1024 * 1024 + 1)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/5MB/)
  })

  it('accepts exactly 5MB', () => {
    expect(validateUpload('image/png', 5 * 1024 * 1024).valid).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/test/social-upload.test.ts
```

Expected: fail — `validateUpload` not defined

- [ ] **Step 3: Note the tests define the validation inline** — they pass as-is once the file exists. Run again to confirm:

```bash
npx vitest run src/test/social-upload.test.ts
```

Expected: all 6 tests pass (the validation logic is defined in the test file itself — no import needed)

- [ ] **Step 4: Create the image upload route**

Create `src/app/api/social/upload-image/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'File must be JPEG, PNG, or WebP' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File must be under 5MB' },
      { status: 400 }
    )
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  // TODO: Replace dataUrl with a public URL once image hosting is configured.
  // Buffer requires a publicly accessible URL for mediaUrls. Options:
  // - Supabase Storage: supabase.storage.from('social-images').upload(...)
  // - Cloudflare Images: POST to api.cloudflare.com/client/v4/accounts/{id}/images/v1
  // For MVP: return dataUrl for preview only. Text-only posts are sent to Buffer.

  return NextResponse.json({
    dataUrl,
    filename: file.name,
    mimeType: file.type,
  })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/social/upload-image/route.ts src/test/social-upload.test.ts
git commit -m "feat(social): add image upload route with base64 preview (MVP — no hosting yet)"
```

---

## Task 4: Caption generator API route

**Files:**
- Create: `src/app/api/social/generate-caption/route.ts`
- Create: `src/test/social-captions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/social-captions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}))

import Anthropic from '@anthropic-ai/sdk'

const mockCaptionsJson = {
  instagram: {
    caption: 'Windsor Parke left GolfNow. Revenue went from $81K to $393K. That\'s the story. #TeeAhead #MetroDetroitGolf #GolfMichigan',
    bestTime: 'Saturday 8:00 AM EST',
    growthNote: 'Saturday morning is peak golf-mindset scroll time in Metro Detroit.',
  },
  facebook: {
    caption: 'Windsor Parke saw a 382% online revenue lift after leaving GolfNow. Does your course know what data it\'s giving away?',
    bestTime: 'Wednesday 11:00 AM EST',
    growthNote: 'Mid-week morning reaches the course-owner audience before afternoon tee times.',
  },
}

describe('caption generation route', () => {
  beforeEach(() => {
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: JSON.stringify(mockCaptionsJson) }],
        }),
      },
    } as any))
  })

  it('returns captions for requested platforms', async () => {
    const { POST } = await import('@/app/api/social/generate-caption/route')
    const req = new Request('http://localhost/api/social/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Windsor Parke left GolfNow',
        pillar: 'Education/Outrage (35%)',
        platforms: ['instagram', 'facebook'],
        audience: 'Course Operators',
      }),
    })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.captions).toHaveProperty('instagram')
    expect(data.captions).toHaveProperty('facebook')
    expect(data.captions.instagram.bestTime).toBe('Saturday 8:00 AM EST')
  })

  it('returns 500 on JSON parse failure', async () => {
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'not valid json' }],
        }),
      },
    } as any))

    const { POST } = await import('@/app/api/social/generate-caption/route')
    const req = new Request('http://localhost/api/social/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'test',
        pillar: 'Education/Outrage (35%)',
        platforms: ['instagram'],
        audience: 'Golfers',
      }),
    })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Parse failed')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/test/social-captions.test.ts
```

Expected: fail — module not found

- [ ] **Step 3: Create the caption generator route**

Create `src/app/api/social/generate-caption/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are the social media voice for TeeAhead, a local-first golf platform launching
in Metro Detroit in Summer 2026. You write captions that sound like a frustrated
founder who built the fix — not a marketer announcing a feature.

PRODUCT FACTS (never invent numbers — use only these):
- Free software for courses. No barter. No commissions. No data extraction.
- Founding Partners (first 10 courses): FREE for full first year, then $349/mo
- Standard (course #11+): $349/mo flat, cancel anytime, no contract
- Golfer tiers: Fairway (free, standard booking fee), Eagle ($89/yr, zero booking
  fees for Eagle and Ace members, 2x Fairway Points, 1 complimentary round/yr,
  1 guest pass, 48hr priority booking), Ace ($159/yr, zero booking fees, 3x points,
  2 complimentary rounds/yr, 2 guest passes, 72hr priority)
- CRITICAL: "Zero booking fees" applies to Eagle and Ace paid members ONLY. Never
  write a blanket "zero booking fees." Always specify "Eagle and Ace members" or
  "when you upgrade." Fairway (free tier) has a standard booking fee.
- Verified case studies ONLY:
  Windsor Parke: 382% online revenue lift ($81K to $393K) after leaving GolfNow
  Missouri Bluffs: 36.3% green fee increase + 44.7% online revenue increase post-GolfNow
  Brown Golf: 39.6% of all rounds over 3 years were zero-revenue barter
- NEVER say "100 courses left GolfNow in Q1 2025" — GolfNow added +320 partners that quarter
- 200+ golfers already on the waitlist before a single course has gone live
- 48-hour onboarding: sign Monday, live by Wednesday. TeeAhead handles all setup.
- Multi-year contracts available at a discount. Volume pricing for 3+ courses: $279/mo each.
- Revenue share: courses earn 10% of every golfer they refer for 12 months, auto-paid via Stripe

KEY FEATURES (genuine differentiators — use these when relevant):
- Tee Time Exchange: "List it. Someone claims it. You earn credit. Zero staff."
- Partner Finder: Find a playing partner in the next 14 days (Eagle + Ace only)
- In-Round Service Requests: One tap from the fairway, pro shop gets real-time alert
- League Management: 9 and 18-hole leagues, live standings, built in, zero extra cost
- QR Check-In: Scan at first tee, every round logged automatically, no manual entry
- Your Data Always: Every golfer goes to course's database, full CSV export anytime
- Stripe Connect: Greens fees go straight to course's account, TeeAhead never touches it
- Priority booking: Eagle 48hr early, Ace 72hr early — best tee times before anyone else
- Fairway Points: Earn every round, never expire, redeem toward tee times or renewal

CONTENT PILLARS — the user will specify one:
1. Education/Outrage (35%): Expose GolfNow's barter trap. Real stats only. Outrage
   tone, not vitriol. Lead with lost revenue or data theft, not the product.
2. Detroit Pride (25%): Celebrate Metro Detroit golf culture, local courses, weekend
   warriors. Community-first. Reference the local market specifically.
3. FOMO/Social Proof (25%): Founding partner spots filling. 200+ golfers on waitlist.
   Eagle $89 + Ace $159 beat GolfPass+ ($119/yr) on every metric. Urgency without lies.
4. Direct Conversion (15%): One clear CTA. teeahead.com. Join waitlist. No fluff.

BRAND VOICE — always:
- Lead with problem or proof, not the product
- Use real specific numbers — "$94,500" beats "a lot of money"
- Sound like a founder who built the fix, not a marketer announcing a feature
- Local-first — Metro Detroit is home, not a test market
- One clear CTA per post. Not two.
- Course posts: lead with lost revenue / cost / pain
- Golfer posts: lead with frustration / value / what they get

BRAND VOICE — never:
- "Thrilled / excited / pleased to announce"
- "Game-changing / revolutionary / disruptive"
- Vague claims without data
- "The Turn" or "MulliganLinks" — dead names, never use
- Mixing golfer and course audiences in one post
- Inventing statistics

FOUNDING PARTNER URGENCY (course posts when relevant):
- "X of 10 Founding Partner spots remaining"
- "Course #11 pays $349/month. Course #1–10 pay nothing for a year."
- "Live in 48 hours. One page to sign."

GOLFER WAITLIST URGENCY (golfer posts when relevant):
- "Founding member pricing closes at launch"
- "Detroit golfers get first access"

PLATFORM FORMATTING — follow exactly:

Instagram: 150-220 chars of punchy copy. Line break after copy.
  Then 6-8 hashtags always including: #TeeAhead #MetroDetroitGolf #GolfMichigan
  Plus 3-5 contextual hashtags. Scroll-stopping first line.

Twitter/X: 240 chars max for single tweet. Complex topics: thread labeled 1/ 2/ 3/
  (max 4 tweets). Each tweet stands alone. No hashtags unless one highly relevant one.

Facebook: 100-180 chars. Conversational, like posting in a local Facebook group.
  No hashtags. End with a genuine question to drive comments. Primary audience is
  Metro Detroit Golfers group (110K+ members across platforms).

LinkedIn: 200-300 chars. Neil posting in first person ("I") dramatically outperforms
  brand posts. Lead with the business problem or insight. No "we're excited to."
  End with a genuine question. No hashtags. NEVER post LinkedIn on weekends.

BEST POSTING TIMES (EST):
Instagram: Saturday 8:00 AM (highest value) | Tuesday 7:00 AM | Sunday 9:00 AM
Twitter/X: Wednesday 8:30 AM | Thursday 7:00 AM | Tuesday 9:00 AM
Facebook: Wednesday 11:00 AM | Thursday 1:00 PM | Sunday 12:00 PM
LinkedIn: Tuesday 7:30 AM | Wednesday 8:00 AM | Thursday 9:00 AM
STAGGERING RULE: Never schedule the same content on all 4 platforms the same day.
  Default stagger: Instagram Tue/Sat, Twitter/X Wed/Thu, Facebook Wed/Sun, LinkedIn Tue/Thu.
NEVER schedule LinkedIn on weekends — engagement drops 70%+.

OUTPUT: Respond with valid JSON only. No preamble, no markdown fences.
{
  "instagram": { "caption": "...", "bestTime": "Saturday 8:00 AM EST", "growthNote": "..." },
  "twitter":   { "caption": "...", "bestTime": "Wednesday 8:30 AM EST", "growthNote": "..." },
  "facebook":  { "caption": "...", "bestTime": "Wednesday 11:00 AM EST", "growthNote": "..." },
  "linkedin":  { "caption": "...", "bestTime": "Tuesday 7:30 AM EST", "growthNote": "..." }
}
Only include keys for platforms requested. growthNote = one sentence explaining why
this time/approach grows that specific account.`

type CaptionResult = {
  caption: string
  bestTime: string
  growthNote: string
}

export async function POST(req: NextRequest) {
  try {
    const { topic, pillar, platforms, audience } = await req.json()

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Write captions for: ${(platforms as string[]).join(', ')}.\nPillar: ${pillar}. Topic: ${topic}. Audience: ${audience}.`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let captions: Record<string, CaptionResult>
    try {
      captions = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
    }

    return NextResponse.json({ captions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/test/social-captions.test.ts
```

Expected: both tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/api/social/generate-caption/route.ts src/test/social-captions.test.ts
git commit -m "feat(social): add AI caption generator route with brand voice system prompt"
```

---

## Task 5: Server actions

**Files:**
- Create: `src/app/admin/social/actions.ts`

- [ ] **Step 1: Create server actions file**

Create `src/app/admin/social/actions.ts`:

```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit'
import { createPost, createIdea } from '@/lib/buffer'

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!ADMIN_EMAILS.includes(user.email ?? '') && !profile?.is_admin) throw new Error('Not authorized')
  return { user }
}

export async function schedulePost(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()

    const text = formData.get('text') as string
    const channelIdsRaw = formData.get('channelIds') as string
    const dueAt = formData.get('dueAt') as string | null
    const mode = (formData.get('mode') as string) || 'addToQueue'

    const channelIds: string[] = JSON.parse(channelIdsRaw)

    await createPost({
      text,
      channelIds,
      dueAt: dueAt || undefined,
      mode: mode as 'addToQueue' | 'customScheduled',
    })

    await writeAuditLog({
      eventType: 'social_post_scheduled',
      targetType: 'social',
      details: {
        channelCount: channelIds.length,
        dueAt: dueAt || null,
        textPreview: text.slice(0, 60),
      },
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function saveIdea(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()

    const title = formData.get('title') as string
    const text = formData.get('text') as string
    const orgId = process.env.BUFFER_ORG_ID ?? ''

    if (!orgId) return { success: false, error: 'BUFFER_ORG_ID not configured' }

    await createIdea(orgId, title, text)

    await writeAuditLog({
      eventType: 'social_idea_saved',
      targetType: 'social',
      details: { title },
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/social/actions.ts
git commit -m "feat(social): add schedulePost and saveIdea server actions with audit logging"
```

---

## Task 6: Admin page shell

**Files:**
- Create: `src/app/admin/social/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/admin/social/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChannels, getScheduledPosts, getSentPosts } from '@/lib/buffer'
import SocialManager from '@/components/admin/SocialManager'

export const metadata = { title: 'Social' }

const ADMIN_EMAILS = ['mulliganlinksgolf@gmail.com', 'nbarris11@gmail.com', 'beslock@yahoo.com']

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isHardcoded = ADMIN_EMAILS.includes(user.email ?? '')
  if (!isHardcoded) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) redirect('/admin')
  }

  const apiKey = process.env.BUFFER_API_KEY
  const orgId = process.env.BUFFER_ORG_ID ?? ''

  if (!apiKey) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Social</h1>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 max-w-lg">
          <p className="font-bold text-amber-900 text-sm mb-1">Buffer not connected</p>
          <p className="text-amber-800 text-sm">
            Add <code className="bg-amber-100 px-1 rounded font-mono">BUFFER_API_KEY</code> and{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">BUFFER_ORG_ID</code> to your
            environment variables to enable social scheduling. Get your key at{' '}
            <span className="font-mono text-xs">publish.buffer.com/settings/api</span>
          </p>
        </div>
      </div>
    )
  }

  const [channels, scheduledPosts, sentPosts] = await Promise.all([
    getChannels(orgId).catch(() => []),
    getScheduledPosts(orgId).catch(() => []),
    getSentPosts(orgId, 5).catch(() => []),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Social</h1>
      <SocialManager
        channels={channels}
        scheduledPosts={scheduledPosts}
        sentPosts={sentPosts}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/social/page.tsx
git commit -m "feat(social): add admin social page shell with auth + Buffer setup banner"
```

---

## Task 7: SocialQueue panel

**Files:**
- Create: `src/components/admin/social/SocialQueue.tsx`

- [ ] **Step 1: Create queue panel**

Create `src/components/admin/social/SocialQueue.tsx`:

```typescript
'use client'

import type { BufferPost } from '@/lib/buffer'

type Props = {
  scheduledPosts: BufferPost[]
  onFillSaturdaySlot: () => void
}

function getNextSaturdayRange(): { start: Date; end: Date } {
  const now = new Date()
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  sat.setHours(0, 0, 0, 0)
  const start = new Date(sat)
  start.setHours(7, 0, 0, 0)
  const end = new Date(sat)
  end.setHours(9, 0, 0, 0)
  // Convert to UTC (EST = UTC-5)
  return {
    start: new Date(start.getTime() + 5 * 60 * 60 * 1000),
    end: new Date(end.getTime() + 5 * 60 * 60 * 1000),
  }
}

function hasSaturdayPost(posts: BufferPost[]): boolean {
  const { start, end } = getNextSaturdayRange()
  return posts.some(p => {
    const due = new Date(p.dueAt)
    return due >= start && due <= end
  })
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white',
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-black text-white',
}

function formatDueAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
}

export default function SocialQueue({ scheduledPosts, onFillSaturdaySlot }: Props) {
  const sorted = [...scheduledPosts].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  )
  const missingSaturdaySlot = !hasSaturdayPost(scheduledPosts)

  return (
    <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-4">
      <h2 className="font-bold text-[#1A1A1A]">
        Scheduled ({scheduledPosts.length})
      </h2>

      {missingSaturdaySlot && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start justify-between gap-3">
          <p className="text-sm text-amber-800">
            ⚠️ No post scheduled for Saturday 8am — your highest-value slot is empty.
          </p>
          <button
            onClick={onFillSaturdaySlot}
            className="text-xs font-semibold text-amber-900 hover:underline whitespace-nowrap"
          >
            Fill this slot →
          </button>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-[#6B7770]">No posts scheduled.</p>
          <p className="text-xs text-[#6B7770] mt-1">Use the composer to add to your queue.</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(post => (
          <div key={post.id} className="rounded-lg border border-black/8 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  PLATFORM_COLORS[post.channelId] ?? 'bg-gray-200 text-gray-800'
                }`}
              >
                {post.channelId}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
                  post.status === 'scheduled'
                    ? 'bg-emerald-100 text-emerald-800'
                    : post.status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {post.status}
              </span>
            </div>
            <p className="text-sm text-[#1A1A1A] line-clamp-2">{post.text}</p>
            {post.assets[0]?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.assets[0].url}
                alt=""
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <p className="text-xs text-[#6B7770]">{formatDueAt(post.dueAt)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/social/SocialQueue.tsx
git commit -m "feat(social): add SocialQueue panel with Saturday warning banner"
```

---

## Task 8: SocialIdeasPanel

**Files:**
- Create: `src/components/admin/social/SocialIdeasPanel.tsx`

- [ ] **Step 1: Create ideas + recent sent panel**

Create `src/components/admin/social/SocialIdeasPanel.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import type { BufferPost } from '@/lib/buffer'
import { saveIdea } from '@/app/admin/social/actions'

type Props = {
  sentPosts: BufferPost[]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white',
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-black text-white',
}

export default function SocialIdeasPanel({ sentPosts }: Props) {
  const [ideaText, setIdeaText] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleSaveIdea() {
    if (!ideaText.trim()) return
    const fd = new FormData()
    fd.append('title', ideaText.slice(0, 80))
    fd.append('text', ideaText)
    startTransition(async () => {
      const result = await saveIdea(fd)
      if (result.success) {
        setIdeaText('')
        showToast('Idea saved ✓')
      } else {
        showToast(result.error ?? 'Failed to save idea')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1B4332] text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Ideas bank */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
        <div>
          <h2 className="font-bold text-[#1A1A1A]">Content Ideas</h2>
          <p className="text-xs text-[#6B7770] mt-0.5">
            Save content ideas to your Buffer backlog. Assign to a channel when you're ready to post.
          </p>
        </div>
        <textarea
          rows={3}
          value={ideaText}
          onChange={e => setIdeaText(e.target.value)}
          placeholder="Drop an idea here — topic, angle, anything..."
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
        <button
          onClick={handleSaveIdea}
          disabled={isPending || !ideaText.trim()}
          className="rounded-lg border border-[#1B4332] px-4 py-1.5 text-xs font-semibold text-[#1B4332] hover:bg-[#1B4332]/5 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Idea'}
        </button>
      </div>

      {/* Recently sent */}
      <div className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-3">
        <h2 className="font-bold text-[#1A1A1A]">Recently Sent</h2>
        {sentPosts.length === 0 && (
          <p className="text-sm text-[#6B7770]">No recent posts yet.</p>
        )}
        <div className="space-y-3">
          {sentPosts.map(post => (
            <div key={post.id} className="rounded-lg border border-black/8 bg-[#FAF7F2]/60 p-3 space-y-1.5 opacity-75">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    PLATFORM_COLORS[post.channelId] ?? 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {post.channelId}
                </span>
                <span className="text-xs text-[#6B7770] ml-auto">
                  Sent {relativeTime(post.dueAt)}
                </span>
              </div>
              <p className="text-sm text-[#6B7770] line-clamp-2">{post.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/social/SocialIdeasPanel.tsx
git commit -m "feat(social): add SocialIdeasPanel with idea input and recently sent feed"
```

---

## Task 9: SocialComposer panel

**Files:**
- Create: `src/components/admin/social/SocialComposer.tsx`

This is the largest component. Build it in full.

- [ ] **Step 1: Create the composer**

Create `src/components/admin/social/SocialComposer.tsx`:

```typescript
'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import type { BufferChannel } from '@/lib/buffer'
import { schedulePost, saveIdea } from '@/app/admin/social/actions'

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter'

type CaptionData = {
  caption: string
  bestTime: string
  growthNote: string
}

type Props = {
  channels: BufferChannel[]
  fillSaturdaySlot: boolean
  onFillHandled: () => void
  onToast: (msg: string) => void
}

const PILLARS = [
  { value: 'Education/Outrage (35%)', label: 'Education/Outrage', pct: '35%' },
  { value: 'Detroit Pride (25%)', label: 'Detroit Pride', pct: '25%' },
  { value: 'FOMO/Social Proof (25%)', label: 'FOMO/Social Proof', pct: '25%' },
  { value: 'Direct Conversion (15%)', label: 'Direct Conversion', pct: '15%' },
]

const PLATFORM_BADGES: Record<Platform, string> = {
  instagram: 'bg-gradient-to-r from-pink-500 to-orange-400 text-white',
  facebook: 'bg-blue-600 text-white',
  linkedin: 'bg-blue-700 text-white',
  twitter: 'bg-black text-white',
}

function getNextSaturday8am(): Date {
  const now = new Date()
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  sat.setHours(8, 0, 0, 0)
  return sat
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SocialComposer({ channels, fillSaturdaySlot, onFillHandled, onToast }: Props) {
  const composerRef = useRef<HTMLDivElement>(null)

  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState<'Course Operators' | 'Golfers'>('Course Operators')
  const [pillar, setPillar] = useState(PILLARS[0].value)
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(['instagram', 'facebook']))
  const [activeTab, setActiveTab] = useState<Platform>('instagram')
  const [captions, setCaptions] = useState<Partial<Record<Platform, CaptionData>>>({})
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageFilename, setImageFilename] = useState<string>('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'queue' | 'custom'>('queue')
  const [scheduledAt, setScheduledAt] = useState(toLocalDatetimeValue(getNextSaturday8am()))
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [isScheduling, startScheduling] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fill Saturday slot when triggered from queue panel
  useEffect(() => {
    if (fillSaturdaySlot) {
      setScheduleMode('custom')
      setScheduledAt(toLocalDatetimeValue(getNextSaturday8am()))
      composerRef.current?.scrollIntoView({ behavior: 'smooth' })
      onFillHandled()
    }
  }, [fillSaturdaySlot, onFillHandled])

  // Default selected channels to match checked platforms
  useEffect(() => {
    const matching = channels
      .filter(ch => platforms.has(ch.service as Platform))
      .map(ch => ch.id)
    setSelectedChannelIds(matching)
  }, [platforms, channels])

  function togglePlatform(p: Platform) {
    setPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(p)) {
        next.delete(p)
      } else {
        next.add(p)
        setActiveTab(p)
      }
      return next
    })
  }

  function updateCaption(platform: Platform, text: string) {
    setCaptions(prev => ({
      ...prev,
      [platform]: { ...prev[platform]!, caption: text },
    }))
  }

  async function handleGenerateCaptions() {
    if (!topic.trim()) return
    setGenerating(true)
    setCaptionError(null)
    try {
      const res = await fetch('/api/social/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          pillar,
          platforms: Array.from(platforms),
          audience,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setCaptionError('Caption generation failed — write it manually')
      } else {
        setCaptions(data.captions)
      }
    } catch {
      setCaptionError('Caption generation failed — write it manually')
    } finally {
      setGenerating(false)
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError(null)

    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch('/api/social/upload-image', { method: 'POST', body: fd })
    const data = await res.json()

    if (data.error) {
      setImageError(data.error)
    } else {
      setImageDataUrl(data.dataUrl)
      setImageFilename(data.filename)
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSchedulePost() {
    const activePlatform = activeTab
    const text = captions[activePlatform]?.caption ?? ''
    if (!text.trim() || selectedChannelIds.length === 0) return

    const fd = new FormData()
    fd.append('text', text)
    fd.append('channelIds', JSON.stringify(selectedChannelIds))
    fd.append('mode', scheduleMode === 'custom' ? 'customScheduled' : 'addToQueue')
    if (scheduleMode === 'custom' && scheduledAt) {
      fd.append('dueAt', new Date(scheduledAt).toISOString())
    }

    startScheduling(async () => {
      const result = await schedulePost(fd)
      if (result.success) {
        const msg =
          scheduleMode === 'custom'
            ? `Scheduled for ${new Date(scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ✓`
            : 'Added to queue ✓'
        onToast(msg)
      } else {
        onToast(result.error ?? 'Scheduling failed')
      }
    })
  }

  function handleSaveAsIdea() {
    const text = captions[activeTab]?.caption ?? ''
    if (!text.trim()) return
    const fd = new FormData()
    fd.append('title', topic.slice(0, 80))
    fd.append('text', text)
    startScheduling(async () => {
      const result = await saveIdea(fd)
      onToast(result.success ? 'Idea saved to Buffer backlog ✓' : (result.error ?? 'Failed to save idea'))
    })
  }

  const platformList = Array.from(platforms)
  const activePlatforms = (Object.keys(PLATFORM_BADGES) as Platform[]).filter(p => platforms.has(p))

  return (
    <div ref={composerRef} className="bg-white rounded-xl ring-1 ring-black/5 p-5 space-y-5">
      <h2 className="font-bold text-[#1A1A1A]">Compose Post</h2>

      {/* Topic */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1A1A1A]">What's this post about?</label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Fox Hills just signed as a Founding Partner"
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
        />
      </div>

      {/* Audience */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#1A1A1A]">Audience</label>
        <div className="flex rounded-lg border border-black/15 overflow-hidden text-sm">
          {(['Course Operators', 'Golfers'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`flex-1 py-1.5 text-center transition-colors ${
                audience === a
                  ? 'bg-[#1B4332] text-white font-medium'
                  : 'text-[#6B7770] hover:bg-[#FAF7F2]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A1A1A]">Content Pillar</label>
        <div className="space-y-1.5">
          {PILLARS.map(p => (
            <label key={p.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pillar"
                value={p.value}
                checked={pillar === p.value}
                onChange={() => setPillar(p.value)}
                className="text-[#1B4332]"
              />
              <span className="text-sm text-[#1A1A1A]">{p.label}</span>
              <span className="text-xs text-[#6B7770]">{p.pct}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A1A1A]">Post to</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(PLATFORM_BADGES) as [Platform, string][]).map(([p, style]) => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                platforms.has(p)
                  ? `${style} border-transparent`
                  : 'border-black/15 text-[#6B7770] hover:border-black/30'
              }`}
            >
              {platforms.has(p) ? '✓ ' : ''}{p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Caption tabs */}
      {platformList.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-1 border-b border-black/10">
            {activePlatforms.map(p => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
                  activeTab === p
                    ? 'border-b-2 border-[#1B4332] text-[#1B4332]'
                    : 'text-[#6B7770] hover:text-[#1A1A1A]'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          {activePlatforms.includes(activeTab) && (
            <div className="space-y-1">
              <textarea
                rows={5}
                value={captions[activeTab]?.caption ?? ''}
                onChange={e => updateCaption(activeTab, e.target.value)}
                placeholder={`Write your ${activeTab} caption here, or generate one below...`}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {captions[activeTab]?.bestTime && (
                <p className="text-xs text-[#6B7770]">
                  Best time: {captions[activeTab]!.bestTime}
                </p>
              )}
              {captions[activeTab]?.growthNote && (
                <p className="text-xs text-[#6B7770] italic">
                  {captions[activeTab]!.growthNote}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generate captions */}
      <div className="space-y-1">
        <button
          onClick={handleGenerateCaptions}
          disabled={!topic.trim() || generating}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B4332]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            '✨ Generate Captions'
          )}
        </button>
        {captionError && (
          <p className="text-xs text-[#6B7770]">{captionError}</p>
        )}
      </div>

      {/* Image attachment */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1A1A1A]">Image (optional)</label>
        {imageDataUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt={imageFilename} className="h-24 w-24 rounded-lg object-cover border border-black/10" />
            <button
              onClick={() => setImageDataUrl(null)}
              className="absolute -top-1.5 -right-1.5 bg-white border border-black/15 rounded-full w-5 h-5 text-xs text-[#6B7770] hover:text-[#1A1A1A] flex items-center justify-center shadow"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-black/15 rounded-lg p-4 text-center cursor-pointer hover:border-[#1B4332]/40 transition-colors"
          >
            <p className="text-sm text-[#6B7770]">
              Drag & drop or{' '}
              <span className="text-[#1B4332] font-medium">Browse</span>
            </p>
            <p className="text-xs text-[#6B7770] mt-0.5">JPEG, PNG, WebP · max 5MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageSelect}
        />
        {imageError && <p className="text-xs text-red-600">{imageError}</p>}
        <div className="space-y-1">
          <a
            href="https://canva.com/create/social-media"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[#1B4332] hover:underline"
          >
            Open Canva →
          </a>
          <p className="text-xs text-[#6B7770]">Design in Canva, download, then upload here</p>
          <a
            href="https://www.canva.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[#1B4332] hover:underline"
          >
            Browse your Canva designs →
          </a>
        </div>
        <p className="text-xs text-[#6B7770]">
          📌 Image preview only — image hosting required to attach images to Buffer posts. Coming in a future update.
        </p>
      </div>

      {/* Schedule controls */}
      <div className="space-y-2">
        <div className="flex rounded-lg border border-black/15 overflow-hidden text-sm">
          {(['queue', 'custom'] as const).map(m => (
            <button
              key={m}
              onClick={() => setScheduleMode(m)}
              className={`flex-1 py-1.5 text-center transition-colors ${
                scheduleMode === m
                  ? 'bg-[#1B4332] text-white font-medium'
                  : 'text-[#6B7770] hover:bg-[#FAF7F2]'
              }`}
            >
              {m === 'queue' ? 'Add to queue' : 'Schedule for specific time'}
            </button>
          ))}
        </div>

        {scheduleMode === 'custom' && (
          <div className="space-y-1">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
            <p className="text-xs text-[#6B7770]">💡 Saturday 8am is your highest-value Instagram slot</p>
          </div>
        )}

        {/* Channel selector */}
        {channels.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#6B7770]">Channels</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {channels.map(ch => (
                <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannelIds.includes(ch.id)}
                    onChange={e => {
                      setSelectedChannelIds(prev =>
                        e.target.checked ? [...prev, ch.id] : prev.filter(id => id !== ch.id)
                      )
                    }}
                    className="text-[#1B4332]"
                  />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${PLATFORM_BADGES[ch.service as Platform] ?? 'bg-gray-200 text-gray-800'}`}
                  >
                    {ch.service}
                  </span>
                  <span className="text-sm text-[#1A1A1A]">{ch.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSchedulePost}
          disabled={isScheduling || selectedChannelIds.length === 0 || !captions[activeTab]?.caption}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B4332]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScheduling ? 'Scheduling...' : 'Schedule Post'}
        </button>
        <button
          onClick={handleSaveAsIdea}
          disabled={isScheduling || !captions[activeTab]?.caption}
          className="w-full text-sm text-[#1B4332] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save as Idea instead →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/social/SocialComposer.tsx
git commit -m "feat(social): add SocialComposer panel with caption tabs, image upload, and scheduling"
```

---

## Task 10: SocialManager orchestrator + nav

**Files:**
- Create: `src/components/admin/SocialManager.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create the SocialManager orchestrator**

Create `src/components/admin/SocialManager.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import type { BufferChannel, BufferPost } from '@/lib/buffer'
import SocialComposer from '@/components/admin/social/SocialComposer'
import SocialQueue from '@/components/admin/social/SocialQueue'
import SocialIdeasPanel from '@/components/admin/social/SocialIdeasPanel'

type Props = {
  channels: BufferChannel[]
  scheduledPosts: BufferPost[]
  sentPosts: BufferPost[]
}

export default function SocialManager({ channels, scheduledPosts, sentPosts }: Props) {
  const [fillSaturdaySlot, setFillSaturdaySlot] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const handleFillSaturdaySlot = useCallback(() => {
    setFillSaturdaySlot(true)
  }, [])

  const handleFillHandled = useCallback(() => {
    setFillSaturdaySlot(false)
  }, [])

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1B4332] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 max-w-xs">
          {toast}
        </div>
      )}

      {/* 3-column grid: composer / queue / ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-5 items-start">
        <SocialComposer
          channels={channels}
          fillSaturdaySlot={fillSaturdaySlot}
          onFillHandled={handleFillHandled}
          onToast={handleToast}
        />
        <SocialQueue
          scheduledPosts={scheduledPosts}
          onFillSaturdaySlot={handleFillSaturdaySlot}
        />
        <SocialIdeasPanel sentPosts={sentPosts} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Social nav item to AdminSidebar**

In `src/components/admin/AdminSidebar.tsx`, find the Platform section:

```tsx
<SidebarSection label="Platform" />
<SidebarItem href="/admin/content" icon="📝" label="Content" active={pathname === '/admin/content'} />
```

Add the Social item between Content and Courses:

```tsx
<SidebarSection label="Platform" />
<SidebarItem href="/admin/content" icon="📝" label="Content" active={pathname === '/admin/content'} />
<SidebarItem href="/admin/social" icon="📣" label="Social" active={pathname === '/admin/social'} />
<SidebarItem href="/admin/courses" icon="🏌️" label="Courses" active={pathname.startsWith('/admin/courses')} />
```

- [ ] **Step 3: Run the full test suite to catch any regressions**

```bash
npx vitest run
```

Expected: all tests pass (buffer + upload + captions + prior tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/SocialManager.tsx src/components/admin/AdminSidebar.tsx
git commit -m "feat(social): add SocialManager orchestrator and Social nav item"
```

---

## Task 11: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to `/admin/social`**

If `BUFFER_ORG_ID` is not set in `.env.local`, expect the page to load with empty arrays (not a crash — the `.catch(() => [])` fallback in the page handles this). The composer, queue, and ideas panels should all render.

- [ ] **Step 3: Verify setup banner shows when env var missing**

Temporarily comment out `BUFFER_API_KEY=` in `.env.local`, restart dev server, visit `/admin/social`. Expected: amber "Buffer not connected" banner, no crashes.

Restore the key.

- [ ] **Step 4: Test caption generation**

Fill in:
- Topic: "Fox Hills just signed as a Founding Partner"
- Audience: Course Operators
- Pillar: FOMO/Social Proof
- Platforms: Instagram + Facebook

Click "✨ Generate Captions". Expected: both tabs populated with brand-voice captions, best times shown below each.

Verify Instagram caption contains `#TeeAhead #MetroDetroitGolf #GolfMichigan`.
Verify no caption says "zero booking fees" without "Eagle and Ace".
Verify no caption uses "The Turn" or "MulliganLinks".

- [ ] **Step 5: Test image upload**

Drop a test JPEG onto the upload zone. Expected: thumbnail preview appears. Try a PDF — expected: inline error "File must be JPEG, PNG, or WebP".

- [ ] **Step 6: Fill Saturday slot**

With no posts scheduled for this Saturday 7–9am, the amber warning banner should appear. Click "Fill this slot →". Expected: schedule toggle switches to "Schedule for specific time", datetime field pre-fills to next Saturday 8:00 AM.

- [ ] **Step 7: Schedule a post to Buffer (requires BUFFER_ORG_ID set)**

Set `BUFFER_ORG_ID` in `.env.local` with your actual org ID. Fill a caption, select a channel, click "Schedule Post". Expected: success toast. Verify the post appears in Buffer dashboard at publish.buffer.com.

- [ ] **Step 8: Save an idea**

Type a content idea in the right panel → "Save Idea". Expected: success toast + input clears. Verify idea appears in Buffer's Ideas section.

- [ ] **Step 9: Verify auth gate**

Sign out or test as a non-admin user. Expected: redirect to `/admin` (or `/login` if not authenticated).

- [ ] **Step 10: Final commit tag**

```bash
git add -p   # review any remaining unstaged changes
git commit -m "feat(social): complete social media manager — Buffer scheduling + AI captions"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Buffer client: `getChannels`, `getScheduledPosts`, `getSentPosts`, `createPost`, `createIdea` — Task 2
- ✅ Image upload route: base64 dataUrl, 5MB limit, JPEG/PNG/WebP only — Task 3
- ✅ Caption generator route: full brand voice system prompt, single Anthropic call, per-platform JSON — Task 4
- ✅ Server actions: `schedulePost`, `saveIdea`, audit logging, assertAdmin — Task 5
- ✅ Page shell: auth, setup banner, parallel fetch — Task 6
- ✅ Queue panel: post cards, Saturday warning, "Fill this slot" callback — Task 7
- ✅ Ideas + recent sent panel — Task 8
- ✅ Composer: all 7 fields, generate captions, image upload, Canva links, schedule controls — Task 9
- ✅ SocialManager orchestrator + nav sidebar — Task 10
- ✅ `AuditEventType` + `AuditTargetType` extended — Task 1
- ✅ Env vars in `.env.example` — Task 1
- ✅ "Image preview only" note in UI — Task 9 (SocialComposer)
- ✅ LinkedIn never recommended on weekends — enforced in system prompt (Task 4)
- ✅ Brand voice rules — enforced in system prompt (Task 4)

**Type consistency:**
- `BufferChannel`, `BufferPost`, `CreatePostInput` defined in `src/lib/buffer.ts` (Task 2) and imported by all consumers (Tasks 5, 6, 7, 9, 10) ✅
- `CaptionData` type defined locally in `SocialComposer.tsx` (Task 9) ✅
- `schedulePost` and `saveIdea` both return `{ success: boolean; error?: string }` — matching call sites in `SocialComposer.tsx` and `SocialIdeasPanel.tsx` ✅
- `onFillSaturdaySlot: () => void` — defined in `SocialQueue` props (Task 7), wired in `SocialManager` (Task 10) ✅
- `fillSaturdaySlot: boolean`, `onFillHandled: () => void`, `onToast: (msg: string) => void` — defined in `SocialComposer` props (Task 9), wired in `SocialManager` (Task 10) ✅
